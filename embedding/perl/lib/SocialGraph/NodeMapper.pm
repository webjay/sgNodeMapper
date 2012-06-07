############################################################################
# Copyright 2007 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
############################################################################

package SocialGraph::NodeMapper;
use strict;
use IPC::Open3;
use File::Temp qw(tempfile);

my $HAVE_JS_LIB;   # is JavaScript::SpiderMonkey available?
my $SMJS;          # path to 'smjs' binary, if found.
BEGIN {
    $HAVE_JS_LIB = eval "use JavaScript::SpiderMonkey; 1;";
    unless ($HAVE_JS_LIB) {
	$SMJS = `which js`;
	chomp $SMJS;
	unless ($SMJS) {
	    die "Missing 'smjs' binary.  Install package 'spidermonkey-bin'.\n";
	}
	die "'smjs' binary isn't executable" unless -x $SMJS;
    }
}
use JSON ();

our $json;
BEGIN {
  local $JSON::AUTOCONVERT = 0;
  $json = JSON->new;
  if ($json->can("allow_nonref")) {
    $json->allow_nonref(1);
  }
}

sub new {
  my ($class, $js_file) = @_;
  my $self = bless {
  }, $class;
  if ($HAVE_JS_LIB) {
      $self->{js} = JavaScript::SpiderMonkey->new();
      $self->{js}->init;
      $self->_load_javascript($js_file);
  } else {
      my ($wtr, $rdr, $err);
      select($wtr); $| = 1; select(STDOUT);
      my ($tmp_fh, $tmp_filename) = tempfile();
      my $js = _slurp($js_file);
      print $tmp_fh $js, "\n";
      print $tmp_fh "debug = function(msg) { print(\"# \" + msg); };\n";
      print $tmp_fh "while (true) { var expr = readline(); print(eval(expr) + \"\\n.\"); }\n";
      close($tmp_fh);
      my $pid = open3($wtr, $rdr, $err, $SMJS, $tmp_filename);
      die "Can't open $SMJS: $!" unless $pid;
      $self->{wtr} = $wtr;
      $self->{rdr} = $rdr;
      $self->{pid} = $pid;
  }
  return $self;
}

sub _slurp {
  my $filename = shift;
  open(my $fh, $filename) or die "Couldn't open $filename: $!";
  return scalar do { local $/; <$fh>; };
}

sub _load_javascript {
  my ($self, $jsfile) = @_;
  my $all_js = _slurp($jsfile);
  die "assert" unless $self->{js};

  # install the debug function (before eval)
  $self->{js}->function_set("debug", sub { print STDERR "DEBUG: @_\n"; });
  $self->{js}->eval($all_js) or die $@;

  # bummer: JavaScript-SpiderMonkey-0.19 didn't wrap JS_CallFunction,
  # so we have to do this indirect method
  $self->{_last_return_value} = undef;
  $self->{js}->function_set("_set_return_value", sub {
      my $val = shift;
      $self->{_last_return_value} = (defined $val && $val ne "undefined") ?
	  $val : undef;
      return 1;
  });
}

sub DESTROY {
  my $self = shift;
  # TODO: is this needed? it doesn't do it itself?
  $self->{js}->destroy if $self->{js};
  kill 9, $self->{pid} if $self->{pid};
}

sub graph_node_from_url {
  my ($self, $url) = @_;
  return $self->_call_jsfunc("nodemapper.urlToGraphNode", $url);
}

sub graph_node_to_url {
  my ($self, $sgn_url, $type) = @_;
  return $self->_call_jsfunc("nodemapper.urlFromGraphNode", $sgn_url, $type);
}

# returns array of { name => "FooName", domain => "fooname.com" }
sub named_sites {
  my $self = shift;
  my $num_sites = $self->_call_jsfunc("nodemapper.namedSitesCount");
  return map {
    my $n = $_;
    { 
      domain => $self->_call_jsfunc("nodemapper.namedSiteProperty",
                                    $n, "domain"),
      name   => $self->_call_jsfunc("nodemapper.namedSiteProperty",
                                    $n, "name"),
      not_mass_market => $self->_call_jsfunc(
                                             "nodemapper.namedSiteProperty",
                                             $n, "notMassMarketSite"),
      } } (0..$num_sites-1);
}

# Given a host ("site.com", "http://www.site.com/", etc) and something
# on that site (which might be a full URL, might be a userid, might be
# a username), return an sgn:// URL, or undef if one couldn't be
# found.
sub graph_node_from_pair {
  my ($self, $host, $what_on_host) = @_;
  return $self->_call_jsfunc("nodemapper.pairToGraphNode", $host, $what_on_host);
}

sub _json_encode {
  my ($arg) = @_;
  if ($json->can("encode")) {
    return $json->encode($arg);
  }
  $arg .= "";
  my $js  = $json->objToJson([$arg]);
  $js =~ s/^\s*\[\s*//;
  $js =~ s/\s*\]\s*$//;
  return $js;
}

sub _call_jsfunc {
  my ($self, $func, @args) = @_;
  my $expr = "$func(" .
    join(", ", map { _json_encode($_) } @args) .
    ")";
  if ($self->{js}) {
    my $js = "_set_return_value($expr);";
    $self->{js}->eval($js) or die $@;
    return $self->{_last_return_value};
  }
  syswrite($self->{wtr}, "$expr\n");
  my $ret;
  my $fh = $self->{rdr};
  while (<$fh>) {
    if (/^\# /) {
      warn $_;
      next;
    }
    if ($_ eq ".\n") {
      chomp $ret;
      last;
    }
    $ret .= $_;
  }
  if ($ret eq "undefined") {
      return undef;
  }
  return $ret;  # TODO(bradfitz): json decode to support non-scalars
}

1;

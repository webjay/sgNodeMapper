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
use JavaScript::SpiderMonkey;
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
  my ($class, $opt_file) = @_;
  my $js = JavaScript::SpiderMonkey->new();
  $js->init;

  my $self = bless {
    'js' => $js,
  }, $class;
  $self->load_javascript($opt_file) if $opt_file;
  return $self;
}

sub load_javascript {
  my ($self, $jsfile) = @_;
  open(my $fh, $jsfile) or die "Couldn't open $jsfile: $!";
  my $all_js = do { local $/; <$fh>; };

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
  $self->{js}->destroy;  # TODO: is this needed? it doesn't do it itself?
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
  my $js = "_set_return_value($func(" .
    join(", ", map { _json_encode($_) } @args) .
    "));";
  $self->{js}->eval($js) or die $@;
  return $self->{_last_return_value};
}

1;

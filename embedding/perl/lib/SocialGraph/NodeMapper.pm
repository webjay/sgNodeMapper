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
  $self->{js}->eval($all_js) or die $@;

  # always override this debug function.
  $self->{js}->function_set("debug", sub { print STDERR "DEBUG: @_\n"; });

  # bummer: JavaScript-SpiderMonkey-0.19 didn't wrap JS_CallFunction,
  # so we have to do this indirect method
  $self->{_last_return_value} = undef;
  $self->{js}->function_set("_set_return_value", sub {
    $self->{_last_return_value} = $_[0];
    return 1;
  });
}

sub DESTROY {
  my $self = shift;
  $self->{js}->destroy;  # TODO: is this needed? it doesn't do it itself?
}

sub graph_node_from_url {
  my ($self, $url) = @_;
  # TODO: javascript-escape $url
  $self->{js}->eval("_set_return_value(nodemapper.urlToGraphNode(\"$url\"));")
    or die $@;
  return $self->{_last_return_value};
}

sub graph_node_to_url {
  my ($self, $sgn_url, $type) = @_;
  # TODO: javascript-escape $url
  $self->{js}->eval("_set_return_value(nodemapper.urlFromGraphNode(\"$sgn_url\", \"$type\"));")
    or die $@;
  return $self->{_last_return_value};
}

1;

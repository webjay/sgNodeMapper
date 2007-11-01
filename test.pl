#!/usr/bin/perl
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

use strict;
use lib 'embedding/perl/lib';
use SocialGraph::NodeMapper;
use Test::More 'no_plan';

# optional pattern to match, to filter testing
my $pattern = shift || ".";

my $mapper = SocialGraph::NodeMapper->new("nodemapper.js");
ok($mapper, "Created mapper");

open(my $fh, "nodemapper_expected.dat")
  or die "Couldn't open nodemapper_expected.dat: $!";

my @errors;

while (<$fh>) {
  s/^\s*\#.*//;
  next unless /\S/;
  my ($input, $expected) = grep { $_ } split;
  next unless $input =~ /$pattern/o || $expected =~ /$pattern/o;
  my $actual;

  if ($input =~ /^(\w+)\((.+)\)$/) {
    # TODO: mapping from sgn:// nodes to URLs not yet
    # supported or tested.

    # for now, pass on these
    next;
  } else {
    $actual = $mapper->graph_node_from_url($input);
  }

  is($actual, $expected, "Mapping $input");

  if ($actual ne $expected) {
    push @errors, {
      input => $input,
      expected => $expected,
      actual => $actual,
    };
  }
}

if (@errors) {
  warn "SUMMARY OF ERRORS:\n";
  foreach my $e (@errors) {
    print "\n";
    print "$e->{input}\n";
    print "        GOT: $e->{actual}\n";
    print "     WANTED: $e->{expected}\n";
  }
} else {
  pass("tests passed.");
}


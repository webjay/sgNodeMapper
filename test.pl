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
my @warnings;

while (<$fh>) {
  s/^\s*\#.*//;
  next unless /\S/;
  my ($input, $expected) = grep { $_ } split;
  next unless $input =~ /$pattern/o || $expected =~ /$pattern/o;
  my $actual;

  my $test_name;
  if ($input =~ /^(\w+)\((.+)\)$/) {
    my ($type, $sgn_node) = ($1, $2);
    $actual = $mapper->graph_node_to_url($sgn_node, $type);
    $test_name = "URL of $type($sgn_node)";

    # and test that it round-trips back to the sgn node
    if ($actual eq $expected) {
	my $http = $expected;
	my $back_sgn = $mapper->graph_node_from_url($http);
	unless ($back_sgn eq $sgn_node) {
	    push @warnings, "$type($sgn_node) doesn't round-trip on URL $expected.  Got $back_sgn, not expected $sgn_node";
	    warn $warnings[-1];
	}
    }

  } else {
    $actual = $mapper->graph_node_from_url($input);
    $test_name = "Mapping $input";
  }

  is($actual, $expected, $test_name);

  if ($actual ne $expected) {
    push @errors, {
      input => $input,
      expected => $expected,
      actual => $actual,
    };
  }
}

if (@warnings) {
    print "WARNINGS:\n";
    foreach (@warnings) {
	print "  * $_\n";
    }
}

if (@errors) {
  print "SUMMARY OF ERRORS:\n";
  foreach my $e (@errors) {
    print "\n";
    print "$e->{input}\n";
    print "        GOT: $e->{actual}\n";
    print "     WANTED: $e->{expected}\n";
  }
} else {
    diag("tests passed.");
}


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
use lib '/home/bradfitz/perllib/lib/perl/5.8.8';
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

my %domain_has_pair_tests;  # domain -> 1
my %seen_sgn_domain;        # domain -> 1

my @parsed_tests;

while (<$fh>) {
  s/^\s*\#.*//;
  next unless /\S/;
  my ($input, $expected) = grep { $_ } split;
  next unless $input =~ /$pattern/o || $expected =~ /$pattern/o;
  my $actual;

  my $test_name;
  if ($input =~ /^pair\((.+),(.+)\)$/) {
    my ($domain, $account) = ($1, $2);
    $domain_has_pair_tests{$domain} = 1;
    $test_name = "Pair of ($domain, $account)";
    $actual = $mapper->graph_node_from_pair($domain, $account) || "";
    push @parsed_tests, ["pair", $domain, $account, $expected];
  } elsif ($input =~ /^(\w+)\((.+)\)$/) {
    my ($type, $sgn_node) = ($1, $2);
    push @parsed_tests, ["from_sgn", $type, $sgn_node, $expected];
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

    # and break it up, and test that the pair still maps back
    # to the sgn
    $sgn_node =~ m!^sgn://(.+?)/\?(?:ident|pk)=(.+)! or die "Couldn't parse $sgn_node";
    my ($sgn_host, $sgn_account) = ($1, $2);
    $seen_sgn_domain{$sgn_host} = 1;

    unless ($domain_has_pair_tests{$sgn_host}) {
	my $back_sgn = $mapper->graph_node_from_pair($sgn_host, $sgn_account) || "";
	unless ($back_sgn eq $sgn_node) {
	    push @warnings, "pair($sgn_host, $sgn_account) from $sgn_node was $back_sgn, not $sgn_node";
	    warn $warnings[-1];
	}
    }
  } else {
    push @parsed_tests, ["to_sgn", $input, $expected];
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

# graph_node_from_pair tests...

# unit tests for parseDomain
is($mapper->_call_jsfunc("nodemapper.parseDomain", "http://foo.com/"),
   "foo.com", "parse domain unittest");
is($mapper->_call_jsfunc("nodemapper.parseDomain", "http://foo.com:80/"),
   "foo.com", "parse domain unittest");
is($mapper->_call_jsfunc("nodemapper.parseDomain", "http://foo.com"),
   "foo.com", "parse domain unittest");
is($mapper->_call_jsfunc("nodemapper.parseDomain", "foo.com"),
   "foo.com", "parse domain unittest");
is($mapper->_call_jsfunc("nodemapper.parseDomain", ""),
   undef, "parse domain unittest");
is($mapper->_call_jsfunc("nodemapper.parseDomain", "http://"),
   undef, "parse domain unittest");
is($mapper->_call_jsfunc("nodemapper.parseDomain", "scheme:foo.com"),
   "foo.com", "parse domain unittest");

# test lookupAccountToSgnHandler (and lookupHandler, indirectly)
{
    my $name = $mapper->_call_jsfunc("nodemapper.lookupHandler_unittest", "x.foo.test", "accountToSgn");
    is($name, "foo.test", ".. and is named foo.test (not x.foo.test)");
}

# named sites
my $num_sites = $mapper->_call_jsfunc("nodemapper.namedSitesCount");
ok($num_sites > 1, "got more than 1 named site: got $num_sites");

my @named_sites = $mapper->named_sites;

my $num_bogus = grep { !$_->{name} || !$_->{domain} } @named_sites;
is($num_bogus, 0, "no bogus named_sites");

# make sure the duplicates don't appear
{
  my %count;  # name -> count
  for my $ns (@named_sites) {
    $count{$ns->{name}}++;
  }
  foreach my $name (keys %count) {
    next if $count{$name} < 2;
    fail("multiple ($count{$name}) occurrences of named site '$name'");
  }
}

my @sorted_named_sites = sort { lc($a->{name}) cmp lc($b->{name}) } @named_sites;
is_deeply(\@named_sites, \@sorted_named_sites, "sites are sorted");

# see that each domain has a name
foreach my $domain (sort keys %seen_sgn_domain) {
  my @match = grep { $_->{domain} eq $domain } @named_sites;
  my $name = @match ? $match[0]->{name} : "";
  ok($name, "$domain has a name");
}

# test the the 'account' field (what the user entered) trumps
# the host
is($mapper->graph_node_from_pair("http://myspace.com/",
				 "http://brad.livejournal.com/"),
   "sgn://livejournal.com/?ident=brad",
   "full url takes precendece over host");

# test the the 'account' field with URL works without a host
is($mapper->graph_node_from_pair("",
				 "http://brad.livejournal.com/"),
   "sgn://livejournal.com/?ident=brad",
   "full url works without host");

is($mapper->graph_node_from_pair("", "bob"),
   undef,
   "need a host");

is($mapper->graph_node_from_pair("http://myspace.com/", ""),
   undef,
   "need an account");


for my $host (qw(
		 livejournal.com
		 www.livejournal.com
	         http://livejournal.com
	         http://livejournal.com/
	         http://www.livejournal.com/
		 )) {
  my $domain =  $mapper->_call_jsfunc("nodemapper.parseDomain", $host);
  is($mapper->graph_node_from_pair($host, "brad"),
     "sgn://livejournal.com/?ident=brad",
     "($host, brad) -> sgn (domain=$domain)");
}

# case
is($mapper->graph_node_from_pair("http://livejournal.com", "BRAD"),
   "sgn://livejournal.com/?ident=brad", "graph_node_from_pair canonicalizes case");

is($mapper->graph_node_from_pair("http://www.mugshot.org", "BrAd"),
   "sgn://mugshot.org/?ident=BrAd", "graph_node_from_pair respects identCasePreserve");

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
  system("cp", "-p", "-f", "nodemapper.js", "autogen/nodemapper.js")
    and die "Failed to copy to to autogen/";
  open(my $fh, ">autogen/nodemapper_tests.js")
    or die "Failed to open nodemapper_tests.js: $!";
  print $fh "// Auto-generated test data from sites/*.js test sections at bottom.\n";
  print $fh "var nodemapper_tests = [\n";
  my $buf = "";
  # TODO(bradfitz): it'd be nice to include comments from the .js file
  # tests in this test output somehow.
  foreach my $test (@parsed_tests) {
    $buf .= "  [" . join(", ", map {
      SocialGraph::NodeMapper::_json_encode($_)
      } @$test) . "],\n";
  }
  chop $buf; chop $buf;
  print $fh $buf, "\n];\n";
}



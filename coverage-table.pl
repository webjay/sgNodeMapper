#!/usr/bin/perl
#

use strict;
my %has_map; # host -> type -> func -> 1

open(my $fh, "nodemapper_expected.dat") or die "Where is nodemapper_expected.dat?";
while (<$fh>) {
  s/^\s*\#.*//;
  next unless /\S/;
  my ($input, $expected) = grep { $_ } split;

  my $actual;
  my ($sgn_node, $sgn_host, $sgn_type);
  my $func = "";
  if ($input =~ /^(\w+)\((.+)\)$/) {
      ($func, $sgn_node) = ($1, $2);
  } else {
      $sgn_node = $expected;
  }
  ($sgn_host, $sgn_type) = parse_sgn_node($sgn_node);

  if ($func) {
      $has_map{$sgn_host}{$sgn_type}{$func} = 1;
  } else {
      $has_map{$sgn_host}{$sgn_type}{"_parse"} = 1;
  }
}

my @fields = qw(_parse content profile blog openid foaf chat rss atom addfriend);

foreach my $host (sort keys %has_map) {
    my $row = sub {
	my $type = shift;
	my $display_host = $type eq "ident" ? $host : "";

	my $has = sub {
	    my $f = shift;
	    return $has_map{$host}{$type}{$f};
	};

	# show a "!!" in the left column for things that we map to
	# sgn, but then not back to http.
	my $maps_back = ! $has->("_parse") ||
	    ($has->("profile") || $has->("content") || $has->("blog"));
	my $left = $maps_back ? "  " : "!!";

	printf("${left}%20s %5s: ", $display_host, $type);

	for my $func (@fields) {
	    if ($has->($func)) {
		print "$func ";
	    } else {
		print " " x (length($func) + 1);
	    }
	}
	print "\n";
    };
    $row->("ident");
    $row->("pk");
}

sub parse_sgn_node {
    my $node = shift;
    $node =~ m!^sgn://(.+)/\?(ident|pk)=! or die
	"Bogus sgn node: $node";
    return ($1, $2);
}

__END__

# livejournal.com
u livejournal.com   rss atom foaf openid

                

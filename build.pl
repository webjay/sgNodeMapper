#!/usr/bin/perl
#

use strict;
use FindBin qw($Bin);

open (my $efh, ">nodemapper_expected.dat")
  or die "Error opening nodemapper_expected.dat for write: $!\n";
open (my $fh, ">nodemapper.js")
  or die "Error opening nodemapper.js for write: $!\n";
print $fh "//##############################################################\n";
print $fh "// AUTO-GENERATED FILE; DO NOT EDIT.  This is a concatenantion\n";
print $fh "// of nodemapper-base.js, and sites/*.js.  Edit those.\n";
print $fh "//##############################################################\n";

for my $file ("$Bin/nodemapper-base.js", glob("$Bin/sites/*.js")) {
  open (my $ifh, $file)
    or die "Error opening $file for read: $!";
  my $hit_end = 0;
  while (<$ifh>) {
    if (/__END__/) {
      $hit_end = 1;
      next;
    }
    if ($hit_end) {
      print $efh $_;
    } else {
      print $fh $_;
    }
  }
  if (! $hit_end && $file !~ /nodemapper-base/) {
    warn "No __END__ section for tests in $file\n";
  }
  print $fh "\n";
  print $efh "\n### FILE: $file\n\n";
}

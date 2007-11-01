#!/usr/bin/perl
#

use strict;
use FindBin qw($Bin);

open (my $fh, ">nodemapper.js")
  or die "Error opening nodemapper.js for write: $!\n";
print $fh "//##############################################################\n";
print $fh "// AUTO-GENERATED FILE; DO NOT EDIT.  This is a concatenantion\n";
print $fh "// of nodemapper-base.js, and sites/*.js.  Edit those.\n";
print $fh "//##############################################################\n";

for my $file ("$Bin/nodemapper-base.js", glob("$Bin/sites/*.js")) {
  open (my $ifh, $file)
    or die "Error opening $file for read: $!";
  while (<$ifh>) {
    # TODO: extract out test rules
    print $fh $_;
  }
  print $fh "\n";
}

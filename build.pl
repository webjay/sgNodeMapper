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
  my $filebase = $file;
  $filebase =~ s!^$Bin/!!;

  open (my $ifh, $file)
    or die "Error opening $file for read: $!";
  my $hit_end = 0;
  my $buffer = "";
  my %pragma;
  while (<$ifh>) {
      if (m!^//\s*pragma (\w+) (.+)!) {
	  $pragma{$1} = $2;
	  next;
      }
      if (/^\s*debug.*FINE/) {
	  next unless $pragma{DEBUG_FINE};
      }

      if (/__END__/) {
      $hit_end = 1;
      next;
    }
    if ($hit_end) {
      print $efh $_;
    } else {
      $buffer .= $_;
    }
  }

  # for sites files, strip the redundant copyright and emacs
  # hints line.  also, wrap them all in anonymous function
  # calls, to give them their own namespace.
  if ($file =~ m!sites/!) {
    $buffer =~ s!/\*\*\s+\*\s+Copyright 20.+?\*/!!s;
    $buffer =~ s!// -\*-\w+-\*-\s*\n!!;
    $buffer =~ s/^\s+//;
    $buffer =~ s/\s+$//;
    $buffer .= "\n";
    $buffer = "// " . "="x73 . "\n" .
      "// Begin included file $filebase\n" .
      "(function(){\n$buffer\n})();\n" .
      "// (end of included file $filebase)\n";
  }
  print $fh $buffer;

  if (! $hit_end && $file !~ /nodemapper-base/) {
    warn "No __END__ section for tests in $file\n";
  }
  print $fh "\n";
  print $efh "\n### FILE: $file\n\n";
}

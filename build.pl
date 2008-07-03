#!/usr/bin/perl
#

use strict;
use FindBin qw($Bin);

open (my $efh, ">nodemapper_expected.dat")
  or die "Error opening nodemapper_expected.dat for write: $!\n";
open (my $nm_fh, ">nodemapper.js")
  or die "Error opening nodemapper.js for write: $!\n";
open (my $nm_debug_fh, ">nodemapper_debug.js")
  or die "Error opening nodemapper_debug.js for write: $!\n";
for my $fh ($nm_fh, $nm_debug_fh) {
  print $fh "//############################################################\n";
  print $fh "// AUTO-GENERATED FILE; DO NOT EDIT.  This is a concatenantion\n";
  print $fh "// of nodemapper-base.js, and sites/*.js.  Edit those.\n";
  print $fh "//#############################################################\n";
}
print $nm_debug_fh "//# (debug version, extra verbose)\n";

for my $file ("$Bin/nodemapper-base.js", glob("$Bin/sites/*.js")) {
  my $filebase = $file;
  $filebase =~ s!^$Bin/!!;

  open (my $ifh, $file)
    or die "Error opening $file for read: $!";
  my $hit_end = 0;
  my $buffer = "";
  my $buffer_debug = ""; # same as $buffer, but includes debug lines
  while (<$ifh>) {
      if (/__END__/) {
          $hit_end = 1;
          next;
      }

      if ($hit_end) {
          print $efh $_;
      } else {
          $buffer_debug .= $_;
          unless (/^\s*debug.*FINE/) {
              $buffer .= $_;
          }
      }
  }

  # remove trailing commas in lists and objects, so stuff works in IE.
  while ($buffer_debug =~ s/^(.*?)\,(\s*\n\s*[\}\]])/\1\2/s) {
    my $bogus_line = scalar split(/\n/, $1);
    die "Bogus trailing comma in $file on line $bogus_line.\n";
  }

  # for sites files, strip the redundant copyright and emacs
  # hints line.  also, wrap them all in anonymous function
  # calls, to give them their own namespace.
  if ($file =~ m!sites/!) {
      wrap_and_strip($buffer, $filebase);
      wrap_and_strip($buffer_debug, $filebase);
  }
  print $nm_fh $buffer;
  print $nm_debug_fh $buffer_debug;

  if (!$hit_end && $file !~ /nodemapper-base/) {
    warn "No __END__ section for tests in $file\n";
  }
  print $nm_fh "\n";
  print $nm_debug_fh "\n";
  print $efh "\n### FILE: $file\n\n";
}

close($nm_fh);
close($nm_debug_fh);

produce_lite_version("nodemapper.js", "nodemapper_lite.js");
unlink "nodemapper.js" or die;
rename "nodemapper_lite.js", "nodemapper.js" or die;

# modifies $buffer, removing its copyright header (it'll
# be included at the top from nodemapper-base.js anyway)
# and wrapping it in its own namespace.
sub wrap_and_strip {
    my ($buffer, $filebase) = @_;
    $_[0] =~ s!/\*\*\s+\*\s+Copyright 20.+?\*/!!s;
    $_[0] =~ s!// -\*-\w+-\*-\s*\n!!;
    $_[0] =~ s/^\s+//;
    $_[0] =~ s/\s+$//;
    $_[0] .= "\n";
    $_[0] = "// " . "="x73 . "\n" .
      "// Begin included file $filebase\n" .
      "(function(){\n$_[0]\n})();\n" .
      "// (end of included file $filebase)\n";
}

sub produce_lite_version {
    my ($in_name, $out_name) = @_;
    open(my $fh, $in_name) or die "open: $!";
    my $file = do { local $/; <$fh> };
    $file =~ s/^(.+? \*\/\s*?\n)//s or die "no header";
    my $header = $1;
    # remove /* .. */ comments
    $file =~ s/\/\*\*\s*.+?\*\///gs;
    # remove // comments
    $file =~ s/^\s*\/\/.*//gm;
    # remove blank lines
    $file =~ s/^\s*?\n//gm;
    open(my $out, ">$out_name") or die "open for out: $!";
    print $out "$header$file";
    close($out) or die;
}

#!/usr/bin/perl
#

use strict;

my $err = system("svn", "up");
if ($err) {
  die "Failed to svn up.";
}

my $info = `svn info`;
my ($rev) = $info =~ /Revision:\s*(\d+)/
  or die "Can't find svn Revision info from svn info";

my $dir = "google-sgnodemapper-svn$rev";

system("svn", "export", "-r", $rev, "https://google-sgnodemapper.googlecode.com/svn/trunk", $dir)
  and die "Export failed.";

unlink map { "$dir/embedding/cpp/$_"} qw(ltmain.sh aclocal.m4 configure);
unlink "$dir/embedding/java/lib/js.jar";

system("tar", "zcvf", "$dir.tar.gz", $dir)
  and die "tar failed";

system("rm", "-rf", $dir)
  and die "cleanup failed";

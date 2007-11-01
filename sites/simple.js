// -*-java-*-

registerDomain("digg.com", {
 urlToGraphNode: commonPatternSomethingSlashUsername("users", "digg.com"),
});

registerDomain("twitter.com", {
 urlToGraphNode: commonPatternSlashUsername("twitter.com"),
});

registerDomain("pownce.com", {
 urlToGraphNode: commonPatternSlashUsername("pownce.com"),
});

registerDomain("jaiku.com", {
 urlToGraphNode: commonPatternSubdomain("jaiku.com"),
});

registerDomain("mugshot.org", {
 urlToGraphNode: commonPatternUriRegexp("mugshot.org", /^\/person\?who=(\w+)/,
                                        { case_preserve: 1 }),
})

__END__

http://digg.com/users/foobar	sgn://digg.com/?ident=foobar
http://digg.com/users/foobar/	sgn://digg.com/?ident=foobar
profile(sgn://digg.com/?ident=foobar)	http://digg.com/users/foobar/

http://twitter.com/brad   sgn://twitter.com/?ident=brad
http://twitter.com/Brad   sgn://twitter.com/?ident=brad
http://twitter.com/Brad/   sgn://twitter.com/?ident=brad

http://pownce.com/a   sgn://pownce.com/?ident=a
http://pownce.com/A   sgn://pownce.com/?ident=a
http://pownce.com/A/   sgn://pownce.com/?ident=a

http://bradfitz.jaiku.com/   sgn://jaiku.com/?ident=bradfitz
http://BRADFITZ.JAIKU.COM/   sgn://jaiku.com/?ident=bradfitz

# case sensitive identifiers!
http://mugshot.org/person?who=7ACcH9gn7zv4YG  sgn://mugshot.org/?ident=7ACcH9gn7zv4YG

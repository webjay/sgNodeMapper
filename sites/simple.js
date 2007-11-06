// -*-java-*-

registerDomain("digg.com", {
 urlToGraphNode: createSomethingSlashUsernameHandler("users", "digg.com"),
});

registerDomain("twitter.com", {
 urlToGraphNode: createSlashUsernameHandler("twitter.com"),
});

registerDomain("pownce.com", {
 urlToGraphNode: createSlashUsernameHandler("pownce.com"),
});

registerDomain("jaiku.com", {
 urlToGraphNode: createUserIsSubdomainHandler("jaiku.com"),
});

registerDomain("mugshot.org", {
 urlToGraphNode: createPathRegexpHandler("mugshot.org", /^\/person\?who=(\w+)/,
                                        { casePreserve: 1 }),
})

registerDomain("ziki.com", {
 urlToGraphNode: createPathRegexpHandler("ziki.com", /^\/\w\w\/people\/(\w+)\/?/),
})

registerDomain("wordpress.com", {
 urlToGraphNode: createHostRegexpHandler("wordpress.com",
                                         /^(?:www\.)?([\w\-]+)\.wordpress\.com$/),
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

http://www.ziki.com/en/people/bob   sgn://ziki.com/?ident=bob
http://www.ziki.com/fr/people/bob/  sgn://ziki.com/?ident=bob
http://www.ziki.com/fr/people/bob/extrastuff sgn://ziki.com/?ident=bob

http://foo.wordpress.com/  sgn://wordpress.com/?ident=foo
http://www.foo.wordpress.com/  sgn://wordpress.com/?ident=foo

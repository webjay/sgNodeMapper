// -*-java-*-

nodemapper.registerDomain("digg.com", {
  urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler("users",
                                                                 "digg.com"),
});

nodemapper.registerDomain("twitter.com", {
  urlToGraphNode: nodemapper.createSlashUsernameHandler("twitter.com"),
});

nodemapper.registerDomain("pownce.com", {
  urlToGraphNode: nodemapper.createSlashUsernameHandler("pownce.com"),
});

nodemapper.registerDomain("jaiku.com", {
  urlToGraphNode: nodemapper.createUserIsSubdomainHandler("jaiku.com"),
});

nodemapper.registerDomain("mugshot.org", {
 urlToGraphNode: nodemapper.createPathRegexpHandler("mugshot.org",
                                                    /^\/person\?who=(\w+)/,
                                                    { casePreserve: 1 }),
});

nodemapper.registerDomain("ziki.com", {
  urlToGraphNode: nodemapper.createPathRegexpHandler(
      "ziki.com",
      /^\/\w\w\/people\/(\w+)\/?/
      ),
});

nodemapper.registerDomain("wordpress.com", {
  urlToGraphNode: nodemapper.createHostRegexpHandler(
      "wordpress.com",
      /^(?:www\.)?([\w\-]+)\.wordpress\.com$/
      ),
});

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

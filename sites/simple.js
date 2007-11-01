// -*-java-*-

registerDomain("digg.com", {
 urlToGraphNode: commonPatternSomethingSlashUsername("users", "digg.com"),
});

__END__

http://digg.com/users/foobar	sgn://digg.com/?ident=foobar
http://digg.com/users/foobar/	sgn://digg.com/?ident=foobar
profile(sgn://digg.com/?ident=foobar)	http://digg.com/users/foobar/

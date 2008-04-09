yelpCompoundHandler = function(url, host, path) {
  var handler;
  if (host.indexOf("www.") == 0) {
     handler = nodemapper.createPathRegexpHandler("yelp.com", 
        /^\/user_details\?userid=(\w+)/, 
        {keyName: "pk", casePreserve: 1});
  } else handler = nodemapper.createUserIsSubdomainHandler("yelp.com");
  return handler(url, host, path);
};

nodemapper.registerDomain("yelp.com", {
	name: "Yelp",
	urlToGraphNode: yelpCompoundHandler,
	pkRegexp: /^\w{22}$/,
        identRegexp: /^\w+$/,
	});
nodemapper.addSimpleHandler("yelp.com", "pk_to_rss", 
    "http://www.yelp.com/syndicate/user/", "/rss.xml");
nodemapper.addSimpleHandler("yelp.com", "pk_to_profile", 
    "http://www.yelp.com/user_details?userid=");
nodemapper.addSimpleHandler("yelp.com", "ident_to_profile",
    "http://", ".yelp.com");

__END__

http://jsmarr.yelp.com	sgn://yelp.com/?ident=jsmarr
http://www.yelp.com/user_details?userid=Dk2IkchUjADbrC05sdsAVQ	sgn://yelp.com/?pk=Dk2IkchUjADbrC05sdsAVQ
rss(sgn://yelp.com/?pk=Dk2IkchUjADbrC05sdsAVQ)	http://www.yelp.com/syndicate/user/Dk2IkchUjADbrC05sdsAVQ/rss.xml 
profile(sgn://yelp.com/?pk=Dk2IkchUjADbrC05sdsAVQ) http://www.yelp.com/user_details?userid=Dk2IkchUjADbrC05sdsAVQ
profile(sgn://yelp.com/?ident=jsmarr) http://jsmarr.yelp.com

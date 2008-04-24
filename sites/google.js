googleMasterHandler = function(url, host, path) {
  var handler = null;
  if (path.indexOf("/reader") == 0) {
    handler = nodemapper.createSomethingSlashUsernameHandler(
        "reader/shared",
        "reader.google.com", /* using fake domain to namespace these pks */
        {keyName: "pk"});
  }

  // TODO: add more handlers for other google properties

  if (handler) return handler(url, host, path);

  // default: just pass raw url back
  return url; 
};

nodemapper.registerDomain("google.com", {urlToGraphNode: googleMasterHandler});

nodemapper.registerDomain("reader.google.com", {
	name: "Google Reader",
	pkRegexp: /^\d{7,}$/,
	});
nodemapper.addSimpleHandler("reader.google.com", "pk_to_content",
			    "http://www.google.com/reader/shared/", "");

var PROFILE_RE = /^\/profile\?user=(\w+)/;
var USER_RE = /^\/(?:user\/)?(\w+)\b/;

var youTubeToSgn = function(url, host, path) {
  var m;
  if ((m = PROFILE_RE.exec(path)) || (m = USER_RE.exec(path))) {
    return "sgn://youtube.com/?ident=" + m[1].toLowerCase();
  }
  return url;
};

nodemapper.registerDomain(
  "youtube.com",
  {name: "YouTube",
   urlToGraphNode: youTubeToSgn});

nodemapper.addSimpleHandler(
    "youtube.com", "ident_to_profile",
    "http://youtube.com/user/");


var PICASA_DOMAINS = [
    "picasaweb.google.at",
    "picasaweb.google.be",
    "picasaweb.google.ca",
    "picasaweb.google.ch",
    "picasaweb.google.co.uk",
    "picasaweb.google.com",
    "picasaweb.google.cz",
    "picasaweb.google.de",
    "picasaweb.google.dk",
    "picasaweb.google.es",
    "picasaweb.google.fi",
    "picasaweb.google.fr",
    "picasaweb.google.gr",
    "picasaweb.google.hr",
    "picasaweb.google.hu",
    "picasaweb.google.it",
    "picasaweb.google.lt",
    "picasaweb.google.nl",
    "picasaweb.google.no",
    "picasaweb.google.pl",
    "picasaweb.google.pt",
    "picasaweb.google.ru",
    "picasaweb.google.se",
    "picasaweb.google.si",
    "picasaweb.google.sk",
    "picasaweb.google.th",
    "picasaweb.google.tr",
    ];

nodemapper.registerDomain(
    PICASA_DOMAINS,
    {name: "Picasa Web Albums",
     primaryDomain: "picasaweb.google.com",
     urlToGraphNode: nodemapper.createPathRegexpHandler(
        "picasaweb.google.com",
	/^\/([\w\.]+)\/?$/
     )});
nodemapper.addSimpleHandler("picasaweb.google.com", "ident_to_profile", 
    "http://picasaweb.google.com/");
nodemapper.addSimpleHandler("picasaweb.google.com", "ident_to_rss", 
    "http://picasaweb.google.com/data/feed/base/user/", 
    "?kind=album&alt=rss&hl=en_US&access=public");

nodemapper.registerDomain(
    "dodgeball.com",
    {name: "Dodgeball",
     urlToGraphNode: nodemapper.createPathRegexpHandler(
      "dodgeball.com",
      /^\/user\?uid=(\d+)/, { keyName: "pk" }),
   });
nodemapper.addSimpleHandler("dodgeball.com", "pk_to_profile",
    "http://www.dodgeball.com/user?uid=", "");

nodemapper.registerDomain(
    "orkut.com",
    {name: "Orkut",
     urlToGraphNode: nodemapper.createPathRegexpHandler(
      "orkut.com",
      /^\/Profile.aspx\?uid=(\d+)/, { keyName: "pk" }),
   });
nodemapper.addSimpleHandler("orkut.com", "pk_to_profile",
                            "http://www.orkut.com/Profile.aspx?uid=");


__END__

http://www.google.com/reader/shared/12649763491721032377 sgn://reader.google.com/?pk=12649763491721032377
content(sgn://reader.google.com/?pk=12649763491721032377) http://www.google.com/reader/shared/12649763491721032377

http://youtube.com/jsmarr sgn://youtube.com/?ident=jsmarr
http://www.youtube.com/user/jsmarr sgn://youtube.com/?ident=jsmarr
http://www.youtube.com/profile?user=bradfitztube  sgn://youtube.com/?ident=bradfitztube

profile(sgn://youtube.com/?ident=jsmarr) http://youtube.com/user/jsmarr


http://www.dodgeball.com/user?uid=54155    sgn://dodgeball.com/?pk=54155
profile(sgn://dodgeball.com/?pk=54155)     http://www.dodgeball.com/user?uid=54155

http://picasaweb.google.com/bradley.j.fitzpatrick/  sgn://picasaweb.google.com/?ident=bradley.j.fitzpatrick
http://picasaweb.google.com/bradley.j.FITZPATRICK/  sgn://picasaweb.google.com/?ident=bradley.j.fitzpatrick

http://picasaweb.google.com/jsmarr	sgn://picasaweb.google.com/?ident=jsmarr
profile(sgn://picasaweb.google.com/?ident=jsmarr) http://picasaweb.google.com/jsmarr
rss(sgn://picasaweb.google.com/?ident=jsmarr) http://picasaweb.google.com/data/feed/base/user/jsmarr?kind=album&alt=rss&hl=en_US&access=public

http://www.orkut.com/Profile.aspx?uid=123  sgn://orkut.com/?pk=123
profile(sgn://orkut.com/?pk=123)           http://www.orkut.com/Profile.aspx?uid=123

http://picasaweb.google.es/Abc.Def  sgn://picasaweb.google.com/?ident=abc.def
http://picasaweb.google.hu/abcdef   sgn://picasaweb.google.com/?ident=abcdef
http://www.picasaweb.google.hu/abcdef   sgn://picasaweb.google.com/?ident=abcdef

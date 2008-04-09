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

__END__

http://www.google.com/reader/shared/12649763491721032377 sgn://reader.google.com/?pk=12649763491721032377
content(sgn://reader.google.com/?pk=12649763491721032377) http://www.google.com/reader/shared/12649763491721032377

http://youtube.com/jsmarr sgn://youtube.com/?ident=jsmarr
http://www.youtube.com/user/jsmarr sgn://youtube.com/?ident=jsmarr
http://www.youtube.com/profile?user=bradfitztube  sgn://youtube.com/?ident=bradfitztube

profile(sgn://youtube.com/?ident=jsmarr) http://youtube.com/user/jsmarr

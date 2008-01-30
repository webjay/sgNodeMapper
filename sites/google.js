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

nodemapper.addSimpleHandler("reader.google.com", "pk_to_content",
			    "http://www.google.com/reader/shared/", "");

__END__

http://www.google.com/reader/shared/12649763491721032377 sgn://reader.google.com/?pk=12649763491721032377
content(sgn://reader.google.com/?pk=12649763491721032377) http://www.google.com/reader/shared/12649763491721032377

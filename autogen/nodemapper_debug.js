//############################################################
// AUTO-GENERATED FILE; DO NOT EDIT.  This is a concatenantion
// of nodemapper-base.js, and sites/*.js.  Edit those.
//#############################################################
//# (debug version, extra verbose)
// -*-java-*-

/**
 * Copyright 2007 Google Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * @fileoverview Maps URLs to/from socialgraph identifiers.
 * @author Brad Fitzpatrick (bradfitz@google.com)
 */


/**
 * The namespace object for all other node mapper methods and
 * registration data from site handlers.
 *
 * @type Object
 */
nodemapper = {};


/**
 * Default regular expressions used if a domain is registered
 * without specifying their own.
 */

nodemapper.IDENT_REGEXP = /^\w*[a-zA-Z]+\w*$/;
nodemapper.PK_REGEXP = /^\d+$/;

nodemapper.pkRegexp = function(handler) {
    return handler.pkRegexp ? handler.pkRegexp : nodemapper.PK_REGEXP;
};

nodemapper.identRegexp = function(handler) {
    return handler.identRegexp ? handler.identRegexp : nodemapper.IDENT_REGEXP;
};

/**
 * Mapping of domain names to handler objects, maintained by
 * NodeMapper.registerDomain().
 *
 * @see NodeMapper#registerDomain
 * @type Object
 */
nodemapper.handlers = {};


/**
 * Register a handler for a domain.
 *
 * @param {String|Array.<String>} domain Domain name (e.g. "foo.com.cn",
 *     "myspace.com") or an array of domain names to register handlers for.
 *
 * @param {Object} handler Object with functions as properties:
 *     'urlToGraphNode': function(url,host,path) -> ident/URL (more coming
 *     in the future).  A handler deals with parsing a URL to an sgn://
 *     URL, and also mapping from sgn:// URLs back to different classes of
 *     http:// URLs for that sgn:// resource.
 *     'caseSensitiveIdent': if true, username is case-sensitive.
 *     'pk_to_foo': function that maps primary key to 'foo' http URL
 *     'ident_to_foo': function that maps primary key to 'foo' http URL
 *     'identRegexp'
 *     'pkRegexp'
 *     'httpsLikeHttp': bool.  if true, https should be treated like http.
 */
nodemapper.registerDomain = function(domain, handler) {
  if (!handler.identRegexp) {
    handler.identRegexp = nodemapper.IDENT_REGEXP;
  }
  if (!handler.pkRegexp) {
    handler.pkRegexp = nodemapper.PK_REGEXP;
  }
  if (domain instanceof Array) {
    for (var i = 0; i < domain.length; i++) {
      nodemapper.handlers[domain[i]] = handler;
    }
  } else {
    nodemapper.handlers[domain] = handler;
  }
};


/**
 * Registers a simple sgn:// to http:// handler for a domain,
 * auto-generating a handler function which simply appends
 * its argument (a primary key or identifier) to your provided
 * prefix.
 *
 * @param {String} domain Domain name (e.g. "myspace.com")
 *
 * @param {String} handlerName Name of handler (e.g. "pk_to_rss")
 *
 * @param {String} prefix Prefix that goes before the pk= or ident=
 *                        value of the sgn:// node, when generating
 *                        the http:// URL.
 *
 * @param {String} suffix Suffix that goes after the pk= or ident=
 *                        value of the sgn:// node, when generating
 *                        the http:// URL.
 */
nodemapper.addSimpleHandler = function(domain, handlerName,
				       prefix, suffix) {
    var handlers = nodemapper.handlers[domain];
    if (!handlers) {
	handlers = nodemapper.handlers[domain] = {};
    }
    if (!suffix) { suffix = ""; }

    var sgnType;
    var m;
    if (m = /^(ident|pk)_to_/.exec(handlerName)) {
	sgnType = m[1];
    }
    
    if (!handlers.sgnToHttpPatterns) {
	handlers.sgnToHttpPatterns = [];
    }
    handlers.sgnToHttpPatterns.push([prefix, suffix, sgnType]);

    handlers[handlerName] = function (pk_or_ident) {
	return prefix + pk_or_ident + suffix;
    };
};


/**
 * Regular expression to test if URL is http or https, capturing: 1) the scheme,
 * 2) the domain (including port) and 3) the path, if any.
 *
 * @type RegExp
 */
nodemapper.HTTP_REGEX = new RegExp("^(https?)://([^/]+)(.*)");


/**
 * Returns a social graph URL (sgn://) for a given URL.
 * This is the main entry point from C++/Java/Perl/etc.
 * If the URL isn't recognized as having a site-specific
 * parser, the URL is returned unchanged.
 *
 * @param {String} url URL of (presumably) a person
 * @return {String} Clean socialgraph sgn:// URL, if URL type is
 *     known, else same URL back.
 */
nodemapper.urlToGraphNode = function(url) {
  var m = nodemapper.HTTP_REGEX.exec(url);
  if (!m) {
    // non-HTTP is rare; pass it to separate handler.  the rest
    // of this function deals with HTTP specifically
    return nodemapper.urlToGraphNodeNotHTTP(url);
  }
  var scheme = m[1];
  var host = m[2].toLowerCase();
  var path = m[3];

  // from user.site.co.uk, lookup handlers for
  // "user.site.co.uk", "site.co.uk", "co.uk", "uk"
  // until first handler is found, then stop.
  var hostparts = host.split(".");
  var handler;
  var matchedDomain; // the domain that matched tightest
  for (var i = 0; i < hostparts.length; ++i) {
    var subhost = hostparts.slice(i, hostparts.length);
    matchedDomain = subhost.join(".");
    debug("urlToGraphNode: " + [url, matchedDomain]); // FINE
    handler = nodemapper.handlers[matchedDomain];
    if (!handler) continue;
    debug(" ... are handlers"); // FINE

    var graphNode;

    // if this is https, and the domain hasn't declare that
    // its https is the same as http, use the normal
    // non-HTTP handler.
    if (scheme == "https" && !handler.httpsLikeHttp) {
	graphNode = nodemapper.urlToGraphNodeNotHTTP(url);
    }

    // Try the registered http-to-sgn handler.
    if (handler.urlToGraphNode) {
	graphNode = handler.urlToGraphNode(url, host, path);
    }

    // If the http-to-sgn handler didn't do anything (or didn't
    // exist), try matching using all the registered sgn-to-http rules
    // in reverse.
    if (!graphNode || graphNode == url) {
	graphNode = nodemapper.sgnFromHttpUsingToHttpRules(matchedDomain, url);
    }

    // If still nothing, try the next domain.
    if (!graphNode || graphNode == url) {
	continue;
    }

    // We mapped to something different.
    return graphNode;
  }

  // wasn't handled above?  return http URL unmodified.
  return url;
};

// Returns an sgn:// URL from a (host, account) pair.  The host
// may be "domain.com", "www.domain.com", "http://domain.com",
// "http://www.domain.com/", etc.
// The 'account' is the account on that host, which may be
// an identifier or a primary key (ident or pk).  The 'account'
// may also be a full-on URL, in which case the host part
// of the pair is ignored.
nodemapper.pairToGraphNode = function (host, account) {
    if (!account) {
	return;
    }

    // for both http and https URLs:
    if (account.substr(0, 4) == "http") {
	var sgn = nodemapper.urlToGraphNode(account);
	if (sgn && sgn.length >= 3 && sgn.substr(0, 3) == "sgn") {
	    return sgn;
	}
	return;
    }

    if (!host) {
	return;
    }

    var domain = nodemapper.parseDomain(host);
    if (!domain) {
	return;
    }

    var accountToSgn = {};
    var handler;

    handler = nodemapper.lookupHandlerWithProperty(domain, "accountToSgn");
    if (handler) {
	accountToSgn = handler.accountToSgn;
    } else {
	handler = nodemapper.lookupHandlerWithProperty(domain, "pkRegexp");
	if (handler) {
	    accountToSgn.pk = [handler._registeredOnDomain, handler.pkRegexp];
	}
	handler = nodemapper.lookupHandlerWithProperty(domain, "identRegexp");
	if (handler) {
	    accountToSgn.ident = [handler._registeredOnDomain, handler.identRegexp];
	}
    }

    if (accountToSgn.pk) {
	var sgnDomain = accountToSgn.pk[0];
	var sgnRegexp = accountToSgn.pk[1] || /^\d+$/;
        var m;
	if (m = sgnRegexp.exec(account)) {
          if (m[1]) {
            return "sgn://" + sgnDomain + "/?pk=" + m[1];
          } else {
            return "sgn://" + sgnDomain + "/?pk=" + account;
          }
	}
    }

    if (accountToSgn.ident) {
	var sgnDomain = accountToSgn.ident[0];
	var sgnRegexp = accountToSgn.ident[1] || /^\w+$/;
	if (sgnRegexp.exec(account)) {
	    // need to lowercase it?
	    if (nodemapper.lookupHandlerWithProperty(host, "identCasePreserve")) {
		// we found a handler with identCasePreserve on,
		// so don't touch the account
	    } else {
		// else lowercase it:
		account = account.toLowerCase();
	    }
	    return "sgn://" + sgnDomain + "/?ident=" + account;
	}
    }

    // TODO: support an accountToSgn.customFunc?  code to run
    // to do the mapping for special cases?
    return;
};

nodemapper.lookupHandlerWithProperty = function (host, property) {
    return nodemapper.lookupHandler(host, function (h) {
	if (h[property]) {
	    return h;
	}
	return;
    });
};

nodemapper.lookupHandler_unittest = function (host, property) {
    var handler = nodemapper.lookupHandlerWithProperty(host, property);
    if (handler) {
	return handler._name_for_testing;
    }
    return;
}

// Returns the first matching handler for a host's list
// of handlers (sorted from most specific to least specific)
// that matches the provided filterFunc.  filterFunc is run
// with one handler (the handler) and must return true to
// have that handler returned.
nodemapper.lookupHandler = function (host, filterFunc) {
  var hostparts = host.split(".");
  var handler;
  var matchedDomain; // the domain that matched tightest
  for (var i = 0; i < hostparts.length; ++i) {
    var subhost = hostparts.slice(i, hostparts.length);
    matchedDomain = subhost.join(".");
    handler = nodemapper.handlers[matchedDomain];
    if (!handler) continue;
    if (filterFunc(handler)) {
	handler._registeredOnDomain = matchedDomain;
	return handler;
    }
  }
  return;
};

// Match optional scheme and slashes (\w+:/{0,2}), then capture
// the domain name (everything until we hit a colon, forward slash,
// or the end)
nodemapper.DOMAIN_RE = /^(?:\w+:\/{0,2})?([^:\/]*?)(?:[:\/]|$)/;

// parses a domain name out of an argument which may be of several
// formats:  domain.com, http://domain.com, scheme:domain.com,
// http://domain.com:8080/some/path
nodemapper.parseDomain = function (arg) {
    var m;
    if ((m = nodemapper.DOMAIN_RE.exec(arg)) && m[1].length > 0) {
	return m[1];
    }
    return;
};

/**
 * Attempts to do http->sgn mapping based on all the installed
 * simple forward mappings (from addSimpleHandler).  This is
 * called then the normal parser for an http URL fails.
 *
 * Note that this will only return a successful mapping if it's
 * unambigous.  Sometimes a domain's pk= and ident= regexps
 * need to be overridden from their default value to resolve
 * ambiguity.
 */
nodemapper.sgnFromHttpUsingToHttpRules = function(domain, url) {
    var handler = nodemapper.handlers[domain];
    debug("sgnFromHttp for: " + [domain, url, handler]); // FINE
    if (!handler || !handler.sgnToHttpPatterns) {
	return;
    }
    debug(" ... are patterns"); // FINE
    var m;
    var matches = [];
    for (var i = 0; i < handler.sgnToHttpPatterns.length; i++) {
	var pattern = handler.sgnToHttpPatterns[i];
	var prefix = pattern[0];
	var suffix = pattern[1];
	var type = pattern[2];
	debug("Considering pattern: " + [prefix, suffix, type]); // FINE
	if (url.substr(0, prefix.length) == prefix &&
	    url.substr(url.length - suffix.length, suffix.length) == suffix) {
	    var midLength = url.length - prefix.length - suffix.length;
	    if (midLength >= 1) {
		var match = url.substr(prefix.length, midLength);
		debug(" ... matched: " + match); // FINE
		if (type == "pk" &&
		    (m = nodemapper.pkRegexp(handler).exec(match))) {
		    matches.push("sgn://" + domain + "/?pk=" + match);
	        } else if (type == "ident" &&
			   (m = nodemapper.identRegexp(handler).exec(match))) {
		    if (! handler.caseSensitiveIdent) {
			match = match.toLowerCase();
		    }
		    matches.push("sgn://" + domain + "/?ident=" + match);
		}
	    }
	}
    }
    if (matches.length == 1) {
	return matches[0];
    } else {
	debug("More/less than 1 match.  Potential matches: " + matches);
    }
    return;
};

nodemapper.SGN_REGEX = new RegExp("^sgn://([^/]+)/\\?(ident|pk)=(.*)");

/**
 * Parses the given sgn:// url and returns the constituent parts as an object.
 * e.g. nodemapper.parseSgnUrl("sgn://twitter.com/?ident=jsmarr") returns
 * { "domain": "twitter.com", "keyName": "ident", "value": "jsmarr" }.
 * Returns null if the input can not be parsed as an sgn url.
 */
nodemapper.parseSgnUrl = function(sgnUrl) {
    var m = nodemapper.SGN_REGEX.exec(sgnUrl);
    if (!m)  return null;

    return { 
        "domain": m[1], 
        "keyName": m[2], 
        "value": m[3] 
    };
}

nodemapper.urlFromGraphNode = function(sgnUrl, type) {
    // is it even an sgn URL?
    var m = nodemapper.SGN_REGEX.exec(sgnUrl);
    if (!m) {
	return;
    }

    var nodeHost = m[1];
    var nodeType = m[2];
    var nodeValue = m[3];

    // see if there's a handler.
    var handler = nodemapper.handlers[nodeHost];
    if (!handler) {
	return;
    }

    // see if there's a to<Type> handler
    var attrName = nodeType + "_to_" + type;
    var toFunc = handler[attrName];
    if (!toFunc) {
	return;
    }

    return toFunc(nodeValue);
};


/**
 * List of functions registered with RegisterNonHTTPHandler
 *
 * @type Array.<Function>
 */
nodemapper.nonHTTPHandlers = [];


/**
 * Registers handlers for non-HTTP URLs
 *
 * @param {Function} Function taking URL, returning either a social
 *     graph node identifier, or nothing if parse didn't match.
 */
nodemapper.registerNonHTTPHandler = function(handler) {
  nodemapper.nonHTTPHandlers.push(handler);
};


/**
 * Returns a social graph node URL, given a non-HTTP URL, or
 * returns the same URL, if scheme/pattern isn't recognized.
 *
 * @param {String} url non-HTTP URL of a person
 * @return {String} Clean socialgraph identifier, if URL type is
 *     known, else same URL back.
 */
nodemapper.urlToGraphNodeNotHTTP = function(url) {
  for (var i=0; i < nodemapper.nonHTTPHandlers.length; ++i) {
    var ident = nodemapper.nonHTTPHandlers[i](url);
    if (ident) return ident;
  }
  return url;
};


/**
 * Returns an sgn parser function, given a domain and regular
 * expression that operates on the path of a URL.
 *
 * @param {String} domain sgn:// domain to return on match
 * @param {RegExp} re Regular expression to match.  Capture #1
 *     must match the username.
 * @param {Object} opt_opts Optional object with extra options:
 *     - casePreserve: if true, don't lowercase the ident/pk
 *     - fallbackHandler: to run if no match (rather than returning URL back)
 *     - keyName: type of identifier in the URL (default: "ident", or "pk")
 *     - slashAnything: if true, allow (and ignore) any /xyz/abc after the match
 * @return {Function} function of (url, host, path) which returns
 *     an sgn:// URL (ideally, if recognized), or the same provided
 *     URL back if URL isn't recognized by a registered parser.
 */
nodemapper.createPathRegexpHandler = function(domain, re, opt_opts) {
  if (!opt_opts) opt_opts = {};
  return function(url, host, path) {
    var m = re.exec(path);
    if (!m) {
      return opt_opts.fallbackHandler ?
          opt_opts.fallbackHandler(url, host, path) :
          url;
    }
    var keyName = opt_opts.keyName || 'ident'; // ident= or pk=; TODO: enforce valid key names?
    var value = (opt_opts.casePreserve ? m[1] : m[1].toLowerCase());
    if (opt_opts.notUsernames && opt_opts.notUsernames[value]) {
	// fail.  this username is marked as not a real username.
	return;
    }
    return "sgn://" + domain + "/?" + keyName + "=" + value;
  };
};


/**
 * Returns an sgn parser function, given a domain and regular
 * expression that operates on the hostname of a URL.
 *
 * @param {String} domain sgn:// domain to return on match
 * @param {RegExp} re Regular expression to match.  Capture #1
 *     must match the username.
 * @param {Object} opt_opts Optional object with extra options
 *     (see list options in nodemapper.createPathRegexpHandler method comment)
 */
nodemapper.createHostRegexpHandler = function(domain, re, opt_opts) {
  if (!opt_opts) opt_opts = {};
  return function(url, host, path) {
    var m = re.exec(host);
    var ident = m ? m[1].toLowerCase() : "";
    if (!m || ident == "www") {
      return opt_opts.fallbackHandler ?
          opt_opts.fallbackHandler(url, host, path) :
          url;
    }
    return "sgn://" + domain + "/?ident=" + ident;
  };
};

/**
 * Returns an sgn parser function which parses URLs with
 * paths of the form /[username]/ (with optional trailing slash)
 *
 * @param {String} domain sgn:// domain to return on match
 * @param {Object} opt_opts Optional object with extra options
 *     (see list options in nodemapper.createPathRegexpHandler method comment)
 * @return {String} Clean socialgraph identifier, if URL type is
 *     known, else same URL back.
 * @see nodemapper#createPathRegexpHandler
 */
nodemapper.createSlashUsernameHandler = function(domain, opt_opts) {
  var slashUsernameRE = /^\/(\w+)\/?$/;
  if (opt_opts && opt_opts.slashAnything) {
      slashUsernameRE = /^\/(\w+)(?:\/|$)/;
  }
  return nodemapper.createPathRegexpHandler(domain, slashUsernameRE, opt_opts);
};


/**
 * Returns an sgn parser function which parses URLs with
 * paths of the form /[prefix]/[username]/ (with optional trailing slash)
 *
 * @param {String} prefix The prefix path before the username
 * @param {String} domain sgn:// domain to return on match
 * @param {Object} opt_opts Optional object with extra options
 *     (see list options in nodemapper.createPathRegexpHandler method comment)
 * @return {String} Clean socialgraph identifier, if URL type is
 *     known, else same URL back.
 * @see nodemapper#createPathRegexpHandler
 */
nodemapper.createSomethingSlashUsernameHandler = function(prefix,
                                                          domain,
                                                          opt_opts) {
  var slashSomethingUserRE = new RegExp("^/" + prefix + "/" +
                                        "(\\w+)(?:/|$)");
  return nodemapper.createPathRegexpHandler(domain,
                                            slashSomethingUserRE,
                                            opt_opts);
};


/**
 * Creates a URL handler that parses out the subdomain
 * of a given domain, returning an sgn:// node of the
 * given subdomain, lowercased.
 *
 * @param {String} domain Domain name base, e.g. "livejournal.com"
 *     if you want to match "brad" in "brad.livejournal.com".
 * @return {Function} URL to sgn:// handler.
 */
nodemapper.createUserIsSubdomainHandler = function(domain) {
  // yes, domain isn't escaped, but that doesn't matter,
  // as nobody will call this outside of a registerDomain'd
  // block of code, where the domain has already been matched
  var subdomainRE = new RegExp("([\\w\\-]+)\." + domain + "$", "i");
  return nodemapper.createHostRegexpHandler(domain, subdomainRE);
};

// return a composed handler, returning the result of the first one that
// returns a different value from its inputs.
nodemapper.createFirstMatchHandler = function(handlerList) {
    return function (url, host, path) {
	for (var i = 0; i < handlerList.length; i++) {
	    var out = handlerList[i](url, host, path);
	    if (out != url) {
		return out;
	    }
	}
	return url;  // unchanged
    };
};

/**
 * Returns an array of objects representing sites with known display
 * names, e.g.:
 * [ { domain: "site.com", name: "Site!" [, notMassMarketSite: 1] }, ... ]
 */
nodemapper.namedSites = function() {
  if (nodemapper._memoizedNamedSites) {
    return nodemapper._memoizedNamedSites;
  }

  var ret = [];
  for (var domain in nodemapper.handlers) {
    var handler = nodemapper.handlers[domain];
    if (handler.name) {
      if (handler.primaryDomain && handler.primaryDomain != domain) {
        continue;
      }
      var canGenerateFeedUrl = false;
      if (handler.ident_to_atom || handler.ident_to_rss
          || handler.pk_to_atom || handler.pk_to_rss) {
        canGenerateFeedUrl = true;
      }
      ret.push({
        domain: domain,
        name: handler.name,
        notMassMarketSite: nodemapper.handlers[domain].notMassMarketSite,
        canGenerateFeedUrl: canGenerateFeedUrl
      });
    }
  }

  // Sort by display name (which is probably the same
  // as the domain, but the display name is what users
  // will see in e.g. drop-downs)
  ret.sort(function(a, b) {
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
    return 0;
  });

  nodemapper._memoizedNamedSites = ret;
  return ret;
}

// Get the number of named sites.
nodemapper.namedSitesCount = function() {
  return nodemapper.namedSites().length;
}

/**
 * Getting a property of a named site.
 *
 * @param {integer} n number in range [0, n), where n
 *                  is from nodemapper.namedSitesCount()
 * @param {String} property one of {domain, name,
 *                 notMassMarketSite, canGenerateFeedUrl}
 */
nodemapper.namedSiteProperty = function(n, property) {
  return nodemapper.namedSites()[n][property];
}

/* install null debug handler, if host container hasn't */
try {
    // access debug and see if it fails:
    if (debug) { }
} catch (e) {
    debug = function() {};
}

// =========================================================================
// Begin included file sites/amazon.js
(function(){
// TODO(bradfitz): this isn't actually case-sensitive.  jsmarr said it was.  :)
var amazonPkHandler = nodemapper.createFirstMatchHandler([
     nodemapper.createSomethingSlashUsernameHandler(
         "gp/pdp/profile", "amazon.com",
         {keyName: "pk", casePreserve: 1}),
     nodemapper.createSomethingSlashUsernameHandler(
         "rss/people", "amazon.com",
         {keyName: "pk", casePreserve: 1})]);

nodemapper.registerDomain("amazon.com", {
  accountToSgn: { pk: ["amazon.com", /^\w{14,14}$/] },
  urlToGraphNode: amazonPkHandler,
  name: "Amazon.com"
});

nodemapper.registerDomain("amazon.co.uk", {
  urlToGraphNode: amazonPkHandler
});

nodemapper.addSimpleHandler("amazon.com", "pk_to_profile", 
    "http://www.amazon.com/gp/pdp/profile/");
nodemapper.addSimpleHandler("amazon.com", "pk_to_rss",
    "http://www.amazon.com/rss/people/", "/reviews");

})();
// (end of included file sites/amazon.js)

// =========================================================================
// Begin included file sites/aol.js
(function(){
/**
 * Regular expression for AOL's aim: URL scheme.
 *
 * @type RegExp
 */
var AIM_REGEX = /^aim:(?:goim\?(?:message=[^&\s]+&)?screenname=)?([%\w \+]+)$/i;

nodemapper.registerNonHTTPHandler(function(url) {
  var m = AIM_REGEX.exec(url);
  if (m) {
    var screenname = m[1].toLowerCase().replace(/(?:[\s\+]|%20)/g, "");
    return "sgn://aol.com/?ident=" + screenname;
  }
});


nodemapper.registerDomain(["openid.aol.com", "profiles.aim.com"], {
 urlToGraphNode: nodemapper.createSlashUsernameHandler("aol.com")
});


var aimPagesHandler = function(url, host, path) {
  var slashProfile = /^\/{1,2}([\w\+]+)(?:\/(?:profile\.html)?|$)/;
  var m;
  if (!(m = slashProfile.exec(path)))
  return url;
  return "sgn://aol.com/?ident=" + m[1].toLowerCase().replace(/[\s\+]/g, "");
};


nodemapper.registerDomain(
    "aimpages.com",
    {urlToGraphNode: aimPagesHandler});


nodemapper.registerDomain(
   "aol.com",
{
 name: "AIM/AOL",
 identRegexp: /^\w+$/,
 ident_to_openid: function (ident) { return "http://openid.aol.com/" + ident; },
 ident_to_chat: function (ident) { return "aim:GoIM?screenname=" + ident; },
 ident_to_profile: function (ident) {
   return "http://profiles.aim.com/" + ident;
 }
});

// TODO(jsmarr): unify this with core AOL.com sgn?
// But then how can I specify these custom profile/atom handlers?
nodemapper.registerDomain("pictures.aol.com",
  {name: "AOL Pictures",
   urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler("galleries",
      "pictures.aol.com")});
nodemapper.addSimpleHandler("pictures.aol.com", "ident_to_profile",
      "http://pictures.aol.com/galleries/");
nodemapper.addSimpleHandler("pictures.aol.com", "ident_to_atom",
      "http://pictures.aol.com/galleries/", "/atom.xml");

})();
// (end of included file sites/aol.js)

// =========================================================================
// Begin included file sites/blogspot.js
(function(){
/**
 * Regular expression for blogspot domain names, with optional
 * "www." at front, and then blogname, then blogspot.com, capturing
 * the blog name.
 *
 * @type RegExp
 */
var BLOGSPOT_REGEX = /^(?:www\.)?([\w\-]+)\.blogspot\.com$/;

nodemapper.registerDomain("blogspot.com", {
  name: "Blogger (Blogspot)",
  urlToGraphNode: nodemapper.createHostRegexpHandler("blogspot.com",
                                                     BLOGSPOT_REGEX)
});

nodemapper.addSimpleHandler("blogspot.com", "ident_to_blog",
			    "http://", ".blogspot.com/");
nodemapper.addSimpleHandler("blogspot.com", "ident_to_content",
			    "http://", ".blogspot.com/");

nodemapper.registerDomain("blogger.com", {
  name: "Blogger (Profile)",
  urlToGraphNode: nodemapper.createPathRegexpHandler(
      "blogger.com",
      /^\/profile\/(\d+)/, { keyName: "pk" })
   });
nodemapper.addSimpleHandler("blogger.com", "pk_to_profile",
                            "http://www.blogger.com/profile/");

})();
// (end of included file sites/blogspot.js)

// =========================================================================
// Begin included file sites/facebook.js
(function(){
var facebookHandler = function(url, host, path) {
  var m;
  var slashProfile = /^(?:\/home\.php\#)?\/profile\.php\?id=(\d+)/;
  if (m = slashProfile.exec(path)) {
    return "sgn://facebook.com/?pk=" + m[1];
  }
  var publicProfile = /^\/(?:p|people)\/([^\/]+\/(\d+))/;
  if (m = publicProfile.exec(path)) {
    return "sgn://facebook.com/?ident=" + m[1];
  }
  return url;
};


nodemapper.registerDomain(
    "facebook.com",
    {name: "Facebook",
     urlToGraphNode: facebookHandler,
     ident_to_profile: function (ident) { return "http://www.facebook.com/people/" + ident },
     pk_to_profile: function (pk) { return "http://www.facebook.com/profile.php?id=" + pk; },
     pkRegexp: /^\d+$/,
     identRegexp: /^.+\/\d+$/,
     identCasePreserve: 1
     });

})();
// (end of included file sites/facebook.js)

// =========================================================================
// Begin included file sites/flickr.js
(function(){
/**
 * Flickr-specific URL handler.
 */
function urlToGraphNodeFlickrFallback(url, host, path) {
  var flickerPathRE = /^\/(?:people|photos)\/(\d+@\w+)\/?$/;
  var m = flickerPathRE.exec(path);
  if (m) {
      return "sgn://flickr.com/?pk=" + m[1];
  }
  return; // undef
};

var urlToGraphNodeFlickr =
    nodemapper.createSomethingSlashUsernameHandler(
        "(?:people|photos)",
        "flickr.com",
        {fallbackHandler: urlToGraphNodeFlickrFallback});

nodemapper.registerDomain(
  "flickr.com", {
  name: "Flickr",
  urlToGraphNode: urlToGraphNodeFlickr,
  pkRegexp: /^\d+@\w\d+$/,
  accountToSgn: { pk: ["flickr.com", /^\d+@\w\d+$/], ident: ["flickr.com"] }
});

nodemapper.addSimpleHandler("flickr.com", "pk_to_rss",
			    "http://api.flickr.com/services/feeds/photos_public.gne?id=", "&lang=en-us&format=rss_200");
nodemapper.addSimpleHandler("flickr.com", "pk_to_atom",
			    "http://api.flickr.com/services/feeds/photos_public.gne?id=", "&lang=en-us&format=atom");

for (var i = 0; i < 2; i++) {
    var type = ["pk", "ident"][i];
    nodemapper.addSimpleHandler("flickr.com", type + "_to_profile",
				"http://www.flickr.com/people/", "/");
    nodemapper.addSimpleHandler("flickr.com", type + "_to_addfriend",
				"http://www.flickr.com/people/", "/relationship/");
    nodemapper.addSimpleHandler("flickr.com", type + "_to_content",
				"http://www.flickr.com/photos/", "/");
}

})();
// (end of included file sites/flickr.js)

// =========================================================================
// Begin included file sites/friendfeed.js
(function(){
nodemapper.registerDomain("friendfeed.com",
{
 name: "FriendFeed",
 urlToGraphNode: nodemapper.createPathRegexpHandler(
     "friendfeed.com", /^\/(\w+)/)
});

nodemapper.addSimpleHandler("friendfeed.com", "ident_to_profile",
    "http://friendfeed.com/");
nodemapper.addSimpleHandler("friendfeed.com", "ident_to_atom",
    "http://friendfeed.com/", "?format=atom");

})();
// (end of included file sites/friendfeed.js)

// =========================================================================
// Begin included file sites/google.js
(function(){
var GOOGLE_TLDS = "ad ae am as at az ba be bg bi bs ca cd cg ch ci cl cn co.bw co.ck co.cr co.id co.il co.im co.in co.je co.jp co.ke co.kr co.ls co.ma co.mw co.nz co.pn co.th co.tt co.ug co.uk co.uz co.ve co.vi co.yu co.za co.zm co.zw com com.af com.ag com.ar com.au com.bd com.bh com.bn com.bo com.br com.bz com.cn com.co com.cu com.do com.ec com.eg com.et com.fj com.gi com.gr com.gt com.hk com.jm com.kh com.kz com.lv com.ly com.mt com.mw com.mx com.my com.na com.nf com.ng com.ni com.np com.om com.pa com.pe com.ph com.pk com.pl com.pr com.py com.qa com.ru com.sa com.sb com.sg com.sv com.tj com.tr com.tt com.tw com.ua com.uy com.vc com.ve com.vn cz de dj dk dm ee es fi fm fr ge gg gl gm gp gr gy hk hn hr ht hu ie is it je jo kg ki kz la li lk lt lu lv md mn ms mu mv mw ne.jp nl no nr nu off.ai ph pl pn pt ro ru rw sc se sg sh si sk sm sn st tk tl tm to tp tt us vg vn vu ws".split(" ");

function googleDomains(prefix) {
  var ret = [];
  for (var idx in GOOGLE_TLDS) {
    ret.push(prefix + GOOGLE_TLDS[idx]);
  }
  return ret;
}

var GOOGLE_DOMAINS = googleDomains("google.");

var READER_RE = /^\/reader\/(?:shared|public\/atom\/user)\/(\d{7,})(?:\/state\/com.google\/broadcast)?/;

var googleProfileHandler = nodemapper.createPathRegexpHandler(
    "profiles.google.com",  // fake domain
    /^\/s2\/(?:profiles\/|sharing\/stuff\?user=)(\d+)/,
    {keyName: "pk"});

var readerHandler = nodemapper.createPathRegexpHandler(
    "reader.google.com",  // fake domain
    READER_RE,
   {keyName: "pk"});


googleMasterHandler = function(url, host, path) {
  var handler = null;
  if (path.indexOf("/reader") == 0) {
    handler = readerHandler;
  } else if (path.indexOf("/s2/") == 0) {
    handler = googleProfileHandler;
  }
  // TODO: add more handlers for other google properties

  if (handler) return handler(url, host, path);

  // default: just pass raw url back
  return url;
};

nodemapper.registerDomain(GOOGLE_DOMAINS, {urlToGraphNode: googleMasterHandler});

nodemapper.registerDomain("reader.google.com", {
	name: "Google Reader",
	pkRegexp: /^\d{7,}$/
	});
nodemapper.addSimpleHandler("reader.google.com", "pk_to_content",
			    "http://www.google.com/reader/shared/", "");
nodemapper.addSimpleHandler("reader.google.com", "pk_to_atom",
			    "http://www.google.com/reader/public/atom/user/",
                            "/state/com.google/broadcast");

var PROFILE_RE = /^\/profile\?user=(\w+)/;
var USER_RE = /^\/(?:(?:rss\/)?user\/)?(\w+)\b/;

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

nodemapper.addSimpleHandler(
    "youtube.com", "ident_to_rss",
    "http://youtube.com/rss/user/", "/videos.rss");

nodemapper.registerDomain(
    googleDomains("picasaweb.google."),
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
      /^\/user\?uid=(\d+)/, { keyName: "pk" })
   });
nodemapper.addSimpleHandler("dodgeball.com", "pk_to_profile",
    "http://www.dodgeball.com/user?uid=", "");

nodemapper.registerDomain(
    "orkut.com",
    {name: "Orkut",
     urlToGraphNode: nodemapper.createPathRegexpHandler(
      "orkut.com",
      /^\/Profile.aspx\?uid=(\d+)/, { keyName: "pk" })
   });
nodemapper.addSimpleHandler("orkut.com", "pk_to_profile",
                            "http://www.orkut.com/Profile.aspx?uid=");

nodemapper.registerDomain("profiles.google.com", {
	name: "Google Profile",
	pkRegexp: /^\d{7,}$/
	});
nodemapper.addSimpleHandler("profiles.google.com", "pk_to_profile",
                            "http://www.google.com/s2/profiles/");

})();
// (end of included file sites/google.js)

// =========================================================================
// Begin included file sites/hi5.js
(function(){
var HAS_ID_REGEXP = /\b(?:ownerId=|userid=|friend\/|\/profile\/foaf\/)(\d+)/;

var DISPLAY_PROFILE = /^\/friend\/profile\/displayHi5URL\.do\?nickname=([\w\-]{6,})\b/;

function urlToGraphNodeHi5(url, host, path) {
    var m;
    if (m = HAS_ID_REGEXP.exec(path)) {
	return "sgn://hi5.com/?pk=" + m[1];
    }

    // subdomain users have to be 6+ characters
    if (path == "/" && (m = /^([\w\-]{6,})\.hi5\.com$/.exec(host))) {
	var match = m[1];
	if (/[^\d]/.exec(match)) {
	    return "sgn://hi5.com/?ident=" + m[1].toLowerCase();
	} else {
	    return "sgn://hi5.com/?pk=" + m[1];
	}
    }

    // display nickname
    if (m = DISPLAY_PROFILE.exec(path)) {
	return "sgn://hi5.com/?ident=" + m[1].toLowerCase();
    }

  return url;
}

nodemapper.registerDomain(
  "hi5.com", {
  name: "hi5",
  urlToGraphNode: urlToGraphNodeHi5
});

nodemapper.addSimpleHandler("hi5.com", "pk_to_foaf",
			    "http://api.hi5.com/rest/profile/foaf/", "");
nodemapper.addSimpleHandler("hi5.com", "pk_to_content",
			    "http://www.hi5.com/friend/profile/displayProfile.do?userid=", "");
nodemapper.addSimpleHandler("hi5.com", "pk_to_profile",
			    "http://www.hi5.com/friend/profile/displayProfile.do?userid=", "");
nodemapper.addSimpleHandler("hi5.com", "pk_to_atom",
			    "http://api.hi5.com/rest/feed/journal/", "");
nodemapper.addSimpleHandler("hi5.com", "pk_to_foaf",
			    "http://api.hi5.com/rest/profile/foaf/", "");
nodemapper.addSimpleHandler("hi5.com", "pk_to_blog",
			    "http://www.hi5.com/friend/profile/displayJournal.do?userid=", "");

nodemapper.addSimpleHandler("hi5.com", "ident_to_content",
			    "http://", ".hi5.com/");
nodemapper.addSimpleHandler("hi5.com", "ident_to_profile",
			    "http://", ".hi5.com/");

})();
// (end of included file sites/hi5.js)

// =========================================================================
// Begin included file sites/lastfm.js
(function(){
////////////////////////////////////////////////////////////////////////////
// Last.fm
//
// Although they have many domains, they appear to all be in the same namespace,
// with possible friendships between all domains.  So we map them all into
// last.fm.  In the future we'll keep track of where we tend to see a user most,
// and put that in node metadata, so when we link _back_ to an http:// URL for
// an sgn:// URL, we map back to the preferred domain.
//
////////////////////////////////////////////////////////////////////////////

/**
 * Domains that last.fm runs on
 *
 * @type Array.<String>
 */
var LAST_FM_ALT_DOMAINS = [
  "cn.last.fm",
  "lastfm.excite.co.jp",
  "lastfm.spiegel.de",
  "www.last.fm",
  "www.lastfm.com.br",
  "www.lastfm.at",
  "www.lastfm.ch",
  "www.lastfm.co.kr",
  "www.lastfm.com.br",
  "www.lastfm.com.tr",
  "www.lastfm.de",
  "www.lastfm.es",
  "www.lastfm.fr",
  "www.lastfm.it",
  "www.lastfm.jp",
  "www.lastfm.pl",
  "www.lastfm.pt",
  "www.lastfm.ru",
  "www.lastfm.se"
];

var lastFmHttpToSgn = nodemapper.createPathRegexpHandler(
    "last.fm", /^\/user\/([\w\-]+)(?:\/|$)/);

nodemapper.registerDomain(
    "last.fm",
    {name: "Last.fm",
     urlToGraphNode: lastFmHttpToSgn});

nodemapper.registerDomain(
    LAST_FM_ALT_DOMAINS,
    {urlToGraphNode: lastFmHttpToSgn});

nodemapper.addSimpleHandler("last.fm", "ident_to_profile",
			    "http://www.last.fm/user/", "/");

})();
// (end of included file sites/lastfm.js)

// =========================================================================
// Begin included file sites/livejournal.js
(function(){
/**
 * Regular expression for user URLs hosted on www.livejournal.com or
 * livejournal.com.
 *
 * @type RegExp
 */
var LJCOM_MAIN_DOMAIN_REGEX = /^\/(?:~|users\/|community\/)(\w+)(?:\/|$)/;


/**
 * Regular expression for the old URL of profile pages hosted on
 * www.livejournal.com or livejournal.com.  Nowadays they redirect.
 *
 * @type RegExp
 */
var LJCOM_USERINFO_BML_REGEX = /^\/userinfo\.bml\?(user|userid)=(\w+)/;


/**
 * Regular expression for the previous/next links between blog
 * entries, and old entry URLs.
 *
 * @type RegExp
 */
var LJCOM_MISC_BML_REGEX = /^\/(?:go|talkread)\.bml\?.*\bjournal=(\w+)/;


/**
 * Handler for URLs on 'users.' or 'community.' subdomains.
 *
 * @type Function
 */
var urlToGraphNodeUsersCommunity = function(url, host, path) {
  var slashUserMaybeProfile = /^\/(\w+)(?:\/|\/profile|$)/;
  var m;
  if (!(m = slashUserMaybeProfile.exec(path))) {
    return url;
  }
  return "sgn://livejournal.com/?ident=" + m[1].toLowerCase();
};


nodemapper.registerDomain(["users.livejournal.com",
                           "community.livejournal.com"],
                          {urlToGraphNode:urlToGraphNodeUsersCommunity});


/**
 * Handler for URLs on all other livejournal domains which aren't
 * otherwise handled by urlToGraphNodeUsersCommunity.
 *
 * @type Function
 */
var urlToGraphNodeGeneral = function(url, host, path) {
  var m;
  if (host == "www.livejournal.com" || host == "livejournal.com") {
    if (m = LJCOM_MAIN_DOMAIN_REGEX.exec(path)) {
      return "sgn://livejournal.com/?ident=" + m[1].toLowerCase();
    }

    if (m = LJCOM_USERINFO_BML_REGEX.exec(path)) {
      if (m[1] == "user") {
        return "sgn://livejournal.com/?ident=" + m[2].toLowerCase();
      } else {
        return "sgn://livejournal.com/?pk=" + m[2];
      }
    }

    if (m = LJCOM_MISC_BML_REGEX.exec(path)) {
      return "sgn://livejournal.com/?ident=" + m[1].toLowerCase();
    }

    // fall through... couldn't match
    return url;
  }

  var hostparts = host.split(".");
  var user = hostparts[0].replace(/-/g, "_");
  return "sgn://livejournal.com/?ident=" + user;
};

var journalBase = function (ident) {
    if (ident.indexOf("_") == 0) {
	return "http://www.livejournal.com/~" + ident + "/";
    }
    return "http://" + ident.replace("_", "-") + ".livejournal.com/";
};

var appendToBase = function (suffix) {
    return function(ident) { return journalBase(ident) + suffix; };
};

var identToContent = journalBase;
var identToRss = appendToBase("data/rss");
var identToAtom = appendToBase("data/atom");
var identToFoaf = appendToBase("data/foaf");
var identToProfile = appendToBase("profile");
var identToOpenid = journalBase;

nodemapper.registerDomain("livejournal.com",
                          {urlToGraphNode: urlToGraphNodeGeneral,
			  ident_to_content: identToContent,
			  ident_to_rss: identToRss,
			  ident_to_atom: identToAtom,
			  ident_to_foaf: identToFoaf,
			  ident_to_profile: identToProfile,
			  ident_to_openid: identToOpenid,
 	 	          identRegexp: /^\w+$/,
                          name: "LiveJournal"
			 });

})();
// (end of included file sites/livejournal.js)

// =========================================================================
// Begin included file sites/meetup.js
(function(){
meetupHandler = function(url, host, path) {
  var primaryKeyRegexp = /\/members\/(\d+)(?:\/|$)/;
  var m;
  if (!(m = primaryKeyRegexp.exec(path))) {
    return url;
  }
  return "sgn://meetup.com/?pk=" + m[1];
};


nodemapper.registerDomain("meetup.com", {
 name: "Meetup",
 urlToGraphNode: meetupHandler
});

nodemapper.addSimpleHandler("meetup.com", "pk_to_profile",
			    "http://www.meetup.com/members/", "/");

})();
// (end of included file sites/meetup.js)

// =========================================================================
// Begin included file sites/mybloglog.js
(function(){
var BUZZ_MEMBER_REGEXP = /^\/buzz\/members\/(?:mybloglog([0-9a-f]{20,20})|([\w\-]+))(?:\/|$)/;

var toSgn = function(url, host, path) {
  var m;
  if (!(m = BUZZ_MEMBER_REGEXP.exec(path))) {
    return url;
  }
  if (m[1]) {
    return "sgn://mybloglog.com/?pk=" + m[1].toLowerCase();
  } else {
    return "sgn://mybloglog.com/?ident=" + m[2].toLowerCase();
  }

};

var PK_REGEXP = /^(?:mybloglog)?([0-9a-f]{20,20})$/;

nodemapper.registerDomain("mybloglog.com", {
  urlToGraphNode: toSgn,
  accountToSgn: { pk: ["mybloglog.com", PK_REGEXP],
                  ident: ["mybloglog.com", /^[\w-]+$/] },
  pkRegexp: PK_REGEXP,
  name: "MyBlogLog"
});

nodemapper.addSimpleHandler("mybloglog.com", "ident_to_foaf",
                            "http://www.mybloglog.com/buzz/members/", "/foaf");
nodemapper.addSimpleHandler("mybloglog.com", "ident_to_profile",
                            "http://www.mybloglog.com/buzz/members/", "/");

nodemapper.addSimpleHandler("mybloglog.com", "pk_to_foaf",
                            "http://www.mybloglog.com/buzz/members/mybloglog", "/foaf");
nodemapper.addSimpleHandler("mybloglog.com", "pk_to_profile",
                            "http://www.mybloglog.com/buzz/members/mybloglog", "/");

})();
// (end of included file sites/mybloglog.js)

// =========================================================================
// Begin included file sites/myspace.js
(function(){
/**
 * Regular expression for MySpace action paths, capturing the action
 * in $1 and userid in $2.
 *
 * @type RegExp
 */
var ACTION_REGEX = /index\.cfm\?fuseaction=(.+)&friendID=(\d+)/i;


/**
 * Regular expression for MySpace pretty paths, capturing either
 * the userid in $1 or the username in $2 (but not both).  May
 * contain trailing query parameters.
 *
 * @type RegExp
 */
var SLASH_WHATEVER_REGEX = /^\/(\d+)|([a-z]\w*)(?:\?|$)/;


/**
 * MySpace actions which are particular to a user.
 *
 * @type Object
 */
var MYSPACE_USER_ACTIONS = {
  "user.viewprofile": 1,
  "blog.listall": 1,
  "blog.confirmsubscribe": 1
};


/**
 * MySpace-specific URL handler
 */
function urlToGraphNodeMySpace(url, host, path) {
  var m = ACTION_REGEX.exec(path);
  if (m) {
    var action = m[1].toLowerCase();
    var userid = m[2];
    if (MYSPACE_USER_ACTIONS[action]) {
      return "sgn://myspace.com/?pk=" + userid;
    }
  }
  if (host == "profile.myspace.com") {
    m = SLASH_WHATEVER_REGEX.exec(path);
    if (m) {
      if (m[1]) {
        return "sgn://myspace.com/?pk=" + m[1];
      }
      if (m[2]) {
        return "sgn://myspace.com/?ident=" + m[2];
      }
    }
  }

  // pass through non-recognized myspace URLs changed
  return url;
};

/**
 * MySpace handler which tries find a /username in
 * the URL, else falling back to the general
 * MySpace parser.
 *
 * @type Function
 */
var urlToGraphNodeMySpaceUsername =
    nodemapper.createSlashUsernameHandler(
        "myspace.com",
        {fallbackHandler: urlToGraphNodeMySpace});


nodemapper.registerDomain(
    "myspace.com",
    {name: "MySpace",
     urlToGraphNode: urlToGraphNodeMySpaceUsername,
     accountToSgn: { pk: ["myspace.com"], ident: ["myspace.com"] }
});

nodemapper.addSimpleHandler(
    "myspace.com", "ident_to_profile",
    "http://myspace.com/");

nodemapper.addSimpleHandler(
    "myspace.com", "ident_to_content",
    "http://myspace.com/");

nodemapper.addSimpleHandler(
    "myspace.com", "pk_to_profile",
    "http://profile.myspace.com/index.cfm?fuseaction=user.viewprofile&friendid=");

nodemapper.addSimpleHandler(
    "myspace.com", "pk_to_content",
    "http://profile.myspace.com/index.cfm?fuseaction=user.viewprofile&friendid=");

nodemapper.addSimpleHandler(
    "myspace.com", "pk_to_rss",
    "http://blog.myspace.com/blog/rss.cfm?friendID=");

nodemapper.addSimpleHandler(
    "myspace.com", "pk_to_blog",
    "http://blog.myspace.com/index.cfm?fuseaction=blog.ListAll&friendID=");

nodemapper.registerDomain(
    ["profile.myspace.com", "blog.myspace.com"],
    {urlToGraphNode: urlToGraphNodeMySpace});

})();
// (end of included file sites/myspace.js)

// =========================================================================
// Begin included file sites/nonhttp.js
(function(){
var XMPP_REGEX = /^(?:xmpp|jabber):(.+)/i;
var MAILTO_REGEX = /^mailto:(.+)/i;

nodemapper.registerNonHTTPHandler(function(url) {
  var m;
  if (m = XMPP_REGEX.exec(url)) {
    return "xmpp:" + m[1].replace(/%40/, "@");
  }
  if (m = MAILTO_REGEX.exec(url)) {
    return "mailto:" + m[1].replace(/%40/, "@");
  }
});

})();
// (end of included file sites/nonhttp.js)

// =========================================================================
// Begin included file sites/simple.js
(function(){
nodemapper.registerDomain(
    "digg.com",
    {name: "Digg",
     urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
        "users",
        "digg.com")});
nodemapper.addSimpleHandler("digg.com", "ident_to_profile",
			    "http://digg.com/users/", "/");
nodemapper.addSimpleHandler("digg.com", "ident_to_rss",
			    "http://digg.com/rss/", "/index2.xml");

nodemapper.registerDomain(
    "pownce.com",
    {name: "Pownce",
     urlToGraphNode: nodemapper.createPathRegexpHandler(
        "pownce.com", /^\/(?:feeds\/public\/)?(\w+)(?:[.\/]|$)/, {slashAnything: 1})});
nodemapper.addSimpleHandler("pownce.com", "ident_to_profile", 
    "http://pownce.com/");
nodemapper.addSimpleHandler("pownce.com", "ident_to_rss", 
    "http://pownce.com/feeds/public/", ".rss");
nodemapper.addSimpleHandler("pownce.com", "ident_to_atom", 
    "http://pownce.com/feeds/public/", ".atom");

nodemapper.registerDomain(
    "jaiku.com",
    {name: "Jaiku",
     urlToGraphNode: nodemapper.createUserIsSubdomainHandler("jaiku.com")});
nodemapper.addSimpleHandler("jaiku.com", "ident_to_profile", 
    "http://", ".jaiku.com/");
nodemapper.addSimpleHandler("jaiku.com", "ident_to_rss", 
    "http://", ".jaiku.com/feed/rss");

nodemapper.registerDomain(
    "mugshot.org",
    {name: "Mugshot",
     urlToGraphNode: nodemapper.createPathRegexpHandler(
        "mugshot.org",
        /^\/person\?who=(\w+)/,
        {casePreserve: 1}),
     identCasePreserve: 1,
     accountToSgn: {ident: ["mugshot.org"]}
    });

nodemapper.addSimpleHandler("mugshot.org", "ident_to_profile",
			    "http://mugshot.org/person?who=", "");

nodemapper.registerDomain(
    "linkedin.com",
    {name: "LinkedIn",
     urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
        "in",
        "linkedin.com")});

nodemapper.addSimpleHandler("linkedin.com", "ident_to_profile",
			    "http://www.linkedin.com/in/", "");

nodemapper.registerDomain(
    "ma.gnolia.com",
    {name: "Ma.gnolia",
     urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
        "people",
        "ma.gnolia.com")});
nodemapper.addSimpleHandler("ma.gnolia.com", "ident_to_profile", 
    "http://ma.gnolia.com/people/");
nodemapper.addSimpleHandler("ma.gnolia.com", "ident_to_rss", 
    "http://ma.gnolia.com/rss/full/people/");

nodemapper.registerDomain(
    "ziki.com",
    {name: "Ziki",
     urlToGraphNode: nodemapper.createPathRegexpHandler(
        "ziki.com",
        /^\/\w\w\/people\/(\w+)\/?/)});

nodemapper.addSimpleHandler("ziki.com", "ident_to_profile",
			    "http://www.ziki.com/people/", "");

nodemapper.registerDomain(
    "wordpress.com",
    {name: "WordPress",
     urlToGraphNode: nodemapper.createHostRegexpHandler(
        "wordpress.com",
        /^(?:www\.)?([\w\-]+)\.wordpress\.com$/)});

nodemapper.addSimpleHandler("wordpress.com", "ident_to_blog",
			    "http://", ".wordpress.com/");

nodemapper.registerDomain(
    ["del.icio.us", "delicious.com"],
    {name: "del.icio.us",
     primaryDomain: "del.icio.us",
     urlToGraphNode: nodemapper.createSlashUsernameHandler("del.icio.us")});
nodemapper.addSimpleHandler("del.icio.us", "ident_to_profile", 
    "http://del.icio.us/");
nodemapper.addSimpleHandler("del.icio.us", "ident_to_rss", 
    "http://del.icio.us/rss/");


nodemapper.registerDomain("webshots.com", {
    name: "Webshots",
    identRegexp: /^\w+$/
});
nodemapper.registerDomain("community.webshots.com",
  {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler("user", 
      "webshots.com")});
nodemapper.addSimpleHandler("webshots.com", "ident_to_profile", 
    "http://community.webshots.com/user/");
nodemapper.addSimpleHandler("webshots.com", "ident_to_rss", 
    "http://community.webshots.com/rss?contentType=rss&type=user&value=");

nodemapper.registerDomain(
    "smugmug.com",
    {name: "SmugMug",
     urlToGraphNode: nodemapper.createUserIsSubdomainHandler("smugmug.com")});
nodemapper.addSimpleHandler("smugmug.com", "ident_to_profile", 
    "http://", ".smugmug.com/");
nodemapper.addSimpleHandler("smugmug.com", "ident_to_atom", 
    "http://www.smugmug.com/hack/feed.mg?Type=nicknameRecentPhotos&Data=", 
    "&format=atom03");

nodemapper.registerDomain(
    "vox.com",
    {name: "Vox",
     urlToGraphNode: nodemapper.createUserIsSubdomainHandler("vox.com")});
nodemapper.addSimpleHandler("vox.com", "ident_to_content", 
    "http://", ".vox.com/");
nodemapper.addSimpleHandler("vox.com", "ident_to_profile",
    "http://", ".vox.com/profile/");
nodemapper.addSimpleHandler("vox.com", "ident_to_rss",
    "http://", ".vox.com/library/rss-full.xml");
nodemapper.addSimpleHandler("vox.com", "ident_to_atom",
    "http://", ".vox.com/library/atom-full.xml");
nodemapper.addSimpleHandler("vox.com", "ident_to_foaf",
    "http://", ".vox.com/profile/foaf.rdf");

nodemapper.registerDomain(
    "tumblr.com",
    {name: "Tumblr",
     urlToGraphNode: nodemapper.createUserIsSubdomainHandler("tumblr.com")});
nodemapper.addSimpleHandler("tumblr.com", "ident_to_profile", 
    "http://", ".tumblr.com/");
nodemapper.addSimpleHandler("tumblr.com", "ident_to_rss", 
    "http://", ".tumblr.com/rss");

nodemapper.registerDomain(
    "xanga.com",
    {name: "Xanga",
     urlToGraphNode: nodemapper.createSlashUsernameHandler(
        "xanga.com", { slashAnything: 1 })});
nodemapper.addSimpleHandler("xanga.com", "ident_to_profile", 
    "http://xanga.com/");
nodemapper.addSimpleHandler("xanga.com", "ident_to_rss", 
    "http://xanga.com/", "/rss");

nodemapper.registerDomain(
    "360.yahoo.com",
    {name: "Yahoo! 360",
     urlToGraphNode: nodemapper.createSlashUsernameHandler(
        "360.yahoo.com", { slashAnything: 1 })});
nodemapper.addSimpleHandler("360.yahoo.com", "ident_to_profile", 
    "http://360.yahoo.com/");
nodemapper.addSimpleHandler("360.yahoo.com", "ident_to_rss", 
    "http://blog.360.yahoo.com/");

nodemapper.registerDomain(
    "spaces.live.com",
    {name: "Windows Live Spaces",
     urlToGraphNode: nodemapper.createUserIsSubdomainHandler(
        "spaces.live.com")});
nodemapper.addSimpleHandler("spaces.live.com", "ident_to_profile", 
    "http://", ".spaces.live.com");
nodemapper.addSimpleHandler("spaces.live.com", "ident_to_rss", 
    "http://", ".spaces.live.com/feed.rss");

nodemapper.registerDomain(
    "stumbleupon.com",
    {name: "StumbleUpon",
     urlToGraphNode: nodemapper.createUserIsSubdomainHandler(
        "stumbleupon.com")});
nodemapper.addSimpleHandler("stumbleupon.com", "ident_to_profile", 
    "http://", ".stumbleupon.com");
nodemapper.addSimpleHandler("stumbleupon.com", "ident_to_rss", 
    "http://www.stumbleupon.com/syndicate.php?stumbler=");

nodemapper.registerDomain(
    "travelpod.com",
    {name: "TravelPod",
     urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
        "members", "travelpod.com")});
nodemapper.addSimpleHandler("travelpod.com", "ident_to_profile",
			    "http://travelpod.com/members/");
nodemapper.addSimpleHandler("travelpod.com", "ident_to_rss",
			    "http://travelpod.com/syndication/rss/");

nodemapper.registerDomain(
    "imageshack.us",
    {name: "ImageShack",
     urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
        "user", "imageshack.us")});
nodemapper.addSimpleHandler("imageshack.us", "ident_to_profile",
			    "http://profile.imageshack.us/user/");
nodemapper.addSimpleHandler("imageshack.us", "ident_to_rss",
			    "http://rss.imageshack.us/user/", "/rss/");

nodemapper.registerDomain("bloglines.com",
  {name: "Bloglines",
   urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
      "(?:blog|public)", "bloglines.com", {slashAnything: 1})});
nodemapper.addSimpleHandler("bloglines.com", "ident_to_profile", 
    "http://www.bloglines.com/blog/");
nodemapper.addSimpleHandler("bloglines.com", "ident_to_rss", 
    "http://www.bloglines.com/blog/", "/rss");

upcomingHandler = nodemapper.createSomethingSlashUsernameHandler("user", 
    "upcoming.yahoo.com", {keyName: "pk"});
nodemapper.registerDomain("upcoming.yahoo.com",
  {name: "Upcoming",
   urlToGraphNode: upcomingHandler});
nodemapper.registerDomain("upcoming.org",
  {urlToGraphNode: upcomingHandler});
nodemapper.addSimpleHandler("upcoming.yahoo.com", "pk_to_profile", 
    "http://upcoming.yahoo.com/user/", "/");
nodemapper.addSimpleHandler("upcoming.yahoo.com", "pk_to_rss", 
    "http://upcoming.yahoo.com/syndicate/v2/my_events/");

nodemapper.registerDomain("socializr.com",
  {name: "Socializr",
   identRegexp: /^[A-Za-z]\w{2,}$/});
nodemapper.addSimpleHandler("socializr.com", "ident_to_profile", 
    "http://www.socializr.com/user/");
nodemapper.addSimpleHandler("socializr.com", "ident_to_rss", 
    "http://www.socializr.com/rss/user/", "/rss.xml");
nodemapper.addSimpleHandler("socializr.com", "pk_to_profile", 
    "http://www.socializr.com/user/");
nodemapper.addSimpleHandler("socializr.com", "pk_to_rss", 
    "http://www.socializr.com/rss/user/", "/rss.xml");

nodemapper.registerDomain("furl.net",
  {name: "Furl",
   urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
      "members", "furl.net", {slashAnything: 1})});
nodemapper.addSimpleHandler("furl.net", "ident_to_profile", 
    "http://www.furl.net/members/");
nodemapper.addSimpleHandler("furl.net", "ident_to_rss", 
    "http://www.furl.net/members/", "/rss.xml");

nodemapper.registerDomain("dailymotion.com",
  {name: "DailyMotion",
   urlToGraphNode: nodemapper.createPathRegexpHandler(
    "dailymotion.com", /^\/(?:rss\/)?(\w+)(?:\/|$)/, {slashAnything: 1})});
nodemapper.addSimpleHandler("dailymotion.com", "ident_to_profile", 
    "http://www.dailymotion.com/");
nodemapper.addSimpleHandler("dailymotion.com", "ident_to_rss", 
    "http://www.dailymotion.com/rss/", "/1");

nodemapper.registerDomain("vimeo.com",
  {name: "Vimeo",
   urlToGraphNode: nodemapper.createSlashUsernameHandler(
    "vimeo.com", {slashAnything: 1})});
nodemapper.addSimpleHandler("vimeo.com", "ident_to_profile", 
    "http://www.vimeo.com/");
nodemapper.addSimpleHandler("vimeo.com", "ident_to_rss", 
    "http://www.vimeo.com/", "/videos/rss");

nodemapper.registerDomain("disqus.com",
  {name: "Disqus",
   urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
      "people", "disqus.com", {slashAnything: 1})});
nodemapper.addSimpleHandler("disqus.com", "ident_to_profile", 
    "http://www.disqus.com/people/");
nodemapper.addSimpleHandler("disqus.com", "ident_to_rss", 
    "http://www.disqus.com/people/", "/comments.rss");

nodemapper.registerDomain("rateitall.com",
  {name: "RateItAll",
   identRegexp: /^[A-Za-z][\w-]*$/});
nodemapper.addSimpleHandler("rateitall.com", "ident_to_profile", 
    "http://www.rateitall.com/");
nodemapper.addSimpleHandler("rateitall.com", "ident_to_rss", 
    "http://www.rateitall.com/usercommentsrss.aspx?RI=");
nodemapper.addSimpleHandler("rateitall.com", "pk_to_rss", 
    "http://www.rateitall.com/usercommentsrss.aspx?RI=");

nodemapper.registerDomain("slideshare.net",
  {name: "SlideShare",
   urlToGraphNode: nodemapper.createPathRegexpHandler(
    "slideshare.net", /^\/(?:rss\/user\/)?(\w+)(?:\/|$)/, {slashAnything: 1})});
nodemapper.addSimpleHandler("slideshare.net", "ident_to_profile", 
    "http://www.slideshare.net/");
nodemapper.addSimpleHandler("slideshare.net", "ident_to_rss", 
    "http://www.slideshare.net/rss/user/");

nodemapper.registerDomain("blog.sina.com.cn",
  {name: "Sina Blog"});
nodemapper.addSimpleHandler("blog.sina.com.cn", "ident_to_profile", 
    "http://blog.sina.com.cn/");
nodemapper.addSimpleHandler("blog.sina.com.cn", "ident_to_rss", 
    "http://blog.sina.com.cn/rss/", ".xml");

nodemapper.registerDomain("hi.baidu.com",
  {name: "Baidu Space"});
nodemapper.addSimpleHandler("hi.baidu.com", "ident_to_profile", 
    "http://hi.baidu.com/");
nodemapper.addSimpleHandler("hi.baidu.com", "ident_to_rss", 
    "http://hi.baidu.com/", "/rss");

nodemapper.registerDomain(
    "blogbus.com",
    {name: "Blogbus",
     urlToGraphNode: nodemapper.createUserIsSubdomainHandler("blogbus.com")});
nodemapper.addSimpleHandler("blogbus.com", "ident_to_profile", 
    "http://", ".blogbus.com/");
nodemapper.addSimpleHandler("blogbus.com", "ident_to_rss", 
    "http://", ".blogbus.com/index.rdf");

nodemapper.registerDomain("bebo.com",
  {name: "Bebo",
   identRegexp: /^[A-Za-z]\w{2,}$/});
nodemapper.addSimpleHandler("bebo.com", "pk_to_profile", 
    "http://bebo.com/Profile.jsp?MemberId=");
nodemapper.addSimpleHandler("bebo.com", "ident_to_profile", 
    "http://bebo.com/");
nodemapper.addSimpleHandler("bebo.com", "pk_to_rss", 
    "http://bebo.com/api/BlogRss.jsp?MemberId=");

nodemapper.registerDomain("reddit.com",
  {name: "Reddit",
   urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
      "user", "reddit.com", {slashAnything: 1})});
nodemapper.addSimpleHandler("reddit.com", "ident_to_profile", 
    "http://reddit.com/user/");
nodemapper.addSimpleHandler("reddit.com", "ident_to_rss", 
    "http://reddit.com/user/", "/submitted.rss");

nodemapper.registerDomain("ilike.com",
  {name: "iLike",
   urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
      "user", "ilike.com", {slashAnything: 1})});
nodemapper.addSimpleHandler("ilike.com", "ident_to_profile", 
    "http://www.ilike.com/user/");
nodemapper.addSimpleHandler("ilike.com", "ident_to_rss", 
    "http://www.ilike.com/user/", "/songs_ilike.rss");


nodemapper.registerDomain(
    "multiply.com",
    {name: "Multiply",
     urlToGraphNode: nodemapper.createUserIsSubdomainHandler("multiply.com")});
nodemapper.addSimpleHandler("multiply.com", "ident_to_profile", 
    "http://", ".multiply.com/");
nodemapper.addSimpleHandler("multiply.com", "ident_to_rss", 
    "http://", ".multiply.com/feed.rss");

nodemapper.registerDomain(
    "dopplr.com",
    {name: "Dopplr",
     urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
        "traveller", "dopplr.com")});
nodemapper.addSimpleHandler("dopplr.com", "ident_to_profile",
			    "http://www.dopplr.com/traveller/", "");

nodemapper.registerDomain(
    "c2.com",
    {name: "c2.com",
     notMassMarketSite: true,
     urlToGraphNode: nodemapper.createPathRegexpHandler(
      "c2.com", 
      /^\/cgi\/wiki\?(.*)/, 
      {casePreserve: 1}),
     identCasePreserve: 1
});

nodemapper.addSimpleHandler("c2.com", "ident_to_profile",
    "http://c2.com/cgi/wiki?");

nodemapper.registerDomain(
    "bookshelved.org",
    {name: "Bookshelved",
     notMassMarketSite: true,
     urlToGraphNode: nodemapper.createPathRegexpHandler(
      "bookshelved.org",
      /^\/cgi\-bin\/wiki\.pl\?(.*)/,
      {casePreserve: 1}),
     identCasePreserve: 1
});
nodemapper.addSimpleHandler("bookshelved.org", "ident_to_profile",
    "http://bookshelved.org/cgi-bin/wiki.pl?");

nodemapper.registerDomain(
    ["xpdeveloper.net", "xpdeveloper.org"],
    {name: "XP Developer",
     primaryDomain: "xpdeveloper.net", // is this?
     notMassMarketSite: true,
     urlToGraphNode: nodemapper.createPathRegexpHandler(
      "xpdeveloper.net", 
      /^\/xpdwiki\/Wiki\.jsp\?page=(.*)/, 
      {casePreserve: 1}),
     identCasePreserve: 1
});
nodemapper.addSimpleHandler("xpdeveloper.net", "ident_to_profile",
    "http://xpdeveloper.net/xpdwiki/Wiki.jsp?page=");

nodemapper.registerDomain(
    "usemod.com",
    {name: "UseModWiki",
     notMassMarketSite: true,
     urlToGraphNode: nodemapper.createPathRegexpHandler(
      "usemod.com", 
      /^\/cgi\-bin\/mb\.pl\?(.*)/, 
      {casePreserve: 1}),
     identCasePreserve: 1
   });
nodemapper.addSimpleHandler("usemod.com", "ident_to_profile",
    "http://usemod.com/cgi-bin/mb.pl?");

nodemapper.registerDomain(
    "advogato.org",
    {name: "Advogato",
     notMassMarketSite: true,
     urlToGraphNode: nodemapper.createPathRegexpHandler(
      "advogato.org",
      /^\/person\/(\w+)/)
   });
nodemapper.addSimpleHandler("advogato.org", "ident_to_profile",
    "http://www.advogato.org/person/", "/");
nodemapper.addSimpleHandler("advogato.org", "ident_to_foaf",
    "http://www.advogato.org/person/", "/foaf.rdf");

nodemapper.registerDomain("weeloop.com",
{name: "weeloop",
 urlToGraphNode: nodemapper.createUserIsSubdomainHandler("weeloop.com")
});
nodemapper.addSimpleHandler("weeloop.com", "ident_to_foaf",
                            "http://", ".weeloop.com/foaf.rdf");
nodemapper.addSimpleHandler("weeloop.com", "ident_to_profile",
                            "http://", ".weeloop.com/profile");
nodemapper.addSimpleHandler("weeloop.com", "ident_to_atom",
                            "http://", ".weeloop.com/api/post?mimeType=application/atom+xml");

nodemapper.registerDomain("planeta.rambler.ru",
{name: "Rambler-Planeta",
 identRegexp: /^[\w\.]+$/,
 urlToGraphNode: nodemapper.createPathRegexpHandler(
   "planeta.rambler.ru",
   /^\/users\/([\w\.]+)/)
});
nodemapper.addSimpleHandler("planeta.rambler.ru", "ident_to_foaf",
    "http://planeta.rambler.ru/users/", "/friends/foaf/");
nodemapper.addSimpleHandler("planeta.rambler.ru", "ident_to_rss",
    "http://planeta.rambler.ru/users/", "/rss/");

})();
// (end of included file sites/simple.js)

// =========================================================================
// Begin included file sites/spin-de.js
(function(){
spinPkHandler = function(url, host, path) {
  var primaryKeyRegexp = /^\/(?:hp|foaf)\/,([0-9a-fA-F]+)($|\/)/;
  var m;
  if (!(m = primaryKeyRegexp.exec(path))) {
    return url;
  }
  return "sgn://spin.de/?pk=" + m[1].toLowerCase();
};


spinIdentHandler = nodemapper.createPathRegexpHandler(
    "spin.de",
    /^\/(?:hp|foaf)\/([^\/,]+)/,
  { fallbackHandler: spinPkHandler,
    casePreserve: 0
  });


nodemapper.registerDomain("spin.de", {
    name: "spin.de",
    urlToGraphNode: spinIdentHandler,
    pkRegexp: /^,[0-9a-fA-F]+$/,
    identRegexp: /^\w+$/
});

nodemapper.addSimpleHandler("spin.de", "ident_to_foaf",
			    "http://www.spin.de/foaf/", "");

nodemapper.addSimpleHandler("spin.de", "pk_to_foaf",
			    "http://www.spin.de/foaf/,", "");

nodemapper.addSimpleHandler("spin.de", "ident_to_profile",
			    "http://www.spin.de/hp/", "/");

nodemapper.addSimpleHandler("spin.de", "pk_to_profile",
			    "http://www.spin.de/hp/,", "/");

nodemapper.addSimpleHandler("spin.de", "ident_to_blog",
			    "http://www.spin.de/hp/", "/blog");

nodemapper.addSimpleHandler("spin.de", "pk_to_blog",
			    "http://www.spin.de/hp/,", "/blog");

})();
// (end of included file sites/spin-de.js)

// =========================================================================
// Begin included file sites/test.js
(function(){
nodemapper.registerDomain(
			  "x.foo.test", {
			      blah: {},
			      _name_for_testing: "x.foo.test (the specific one)"
			  });
nodemapper.registerDomain(
			  "foo.test", {
			      accountToSgn: {},
	  		      _name_for_testing: "foo.test"
			  });

})();
// (end of included file sites/test.js)

// =========================================================================
// Begin included file sites/threadless.js
(function(){
// Theadless.com

var pkMatcher = nodemapper.createPathRegexpHandler(
    "threadless.com",
    /\/(?:profile|rss\/blog)\/(\d+)\/?$/,
    {keyName:"pk"});

var identMatcher = nodemapper.createPathRegexpHandler(
    "threadless.com",
    /\/(?:profile|rss\/blog)\/(\d+\/\w+)(?:\/.*)?$/,
    {fallbackHandler: pkMatcher});

nodemapper.registerDomain(
    "threadless.com",
    {name: "Threadless",
     urlToGraphNode: identMatcher,
     identRegexp: /^\d+\/\w+$/});

nodemapper.addSimpleHandler("threadless.com", "pk_to_rss",
                            "http://www.threadless.com/rss/blog/", "");
nodemapper.addSimpleHandler("threadless.com", "ident_to_rss",
                            "http://www.threadless.com/rss/blog/", "");

nodemapper.addSimpleHandler("threadless.com", "pk_to_profile",
                            "http://www.threadless.com/profile/", "");
nodemapper.addSimpleHandler("threadless.com", "ident_to_profile",
                            "http://www.threadless.com/profile/", "");

nodemapper.addSimpleHandler("threadless.com", "ident_to_blog",
                            "http://www.threadless.com/profile/", "/blogs");

})();
// (end of included file sites/threadless.js)

// =========================================================================
// Begin included file sites/tribe.js
(function(){
tribePkHandler = function(url, host, path) {
  var primaryKeyRegexp = /^\/([\w\-]{36})(?:\/(?:foaf|blog)|\/$|$)/;
  var m;
  if (!(m = primaryKeyRegexp.exec(path))) {
    return url;
  }
  return "sgn://tribe.net/?pk=" + m[1].toLowerCase();
};


tribeIdentHandler = nodemapper.createPathRegexpHandler(
    "tribe.net",
    /^\/(\w+)(?:\/(?:foaf|blog)|\/$|$)/,
  { fallbackHandler: tribePkHandler }
    );


nodemapper.registerDomain("tribe.net", {
 name: "Tribe.net",
 pkRegexp: /^[\w\-]{36}$/,
 identRegexp: /^\w+$/
});

nodemapper.registerDomain("people.tribe.net", {
 urlToGraphNode: tribeIdentHandler
});

nodemapper.addSimpleHandler("tribe.net", "ident_to_foaf",
			    "http://people.tribe.net/", "/foaf");

nodemapper.addSimpleHandler("tribe.net", "pk_to_foaf",
			    "http://people.tribe.net/", "/foaf");

nodemapper.addSimpleHandler("tribe.net", "ident_to_profile",
			    "http://people.tribe.net/");

nodemapper.addSimpleHandler("tribe.net", "pk_to_profile",
			    "http://people.tribe.net/");

})();
// (end of included file sites/tribe.js)

// =========================================================================
// Begin included file sites/twitter.js
(function(){
nodemapper.registerDomain(
    "twitter.com",
    { httpsLikeHttp: 1,
      name: "Twitter",
      accountToSgn: { pk: ["twitter.com"], ident: ["twitter.com"] },
      urlToGraphNode: nodemapper.createSlashUsernameHandler(
          "twitter.com",
          {slashAnything: 1,
	   notUsernames: {
	      "statuses": 1
           }
	  })
   });


nodemapper.addSimpleHandler("twitter.com", "ident_to_profile",
    "http://twitter.com/");
nodemapper.addSimpleHandler("twitter.com", "ident_to_rss",
    "http://twitter.com/statuses/user_timeline/", ".rss");
nodemapper.addSimpleHandler("twitter.com", "ident_to_atom",
    "http://twitter.com/statuses/user_timeline/", ".atom");

nodemapper.addSimpleHandler("twitter.com", "pk_to_rss",
    "http://twitter.com/statuses/user_timeline/", ".rss");
nodemapper.addSimpleHandler("twitter.com", "pk_to_atom",
    "http://twitter.com/statuses/user_timeline/", ".atom");

})();
// (end of included file sites/twitter.js)

// =========================================================================
// Begin included file sites/yelp.js
(function(){
var yelpCompoundHandler = function(url, host, path) {
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
        identRegexp: /^\w+$/
	});
nodemapper.addSimpleHandler("yelp.com", "pk_to_rss", 
    "http://www.yelp.com/syndicate/user/", "/rss.xml");
nodemapper.addSimpleHandler("yelp.com", "pk_to_profile", 
    "http://www.yelp.com/user_details?userid=");
nodemapper.addSimpleHandler("yelp.com", "ident_to_profile",
    "http://", ".yelp.com");

})();
// (end of included file sites/yelp.js)

// =========================================================================
// Begin included file sites/zooomr.js
(function(){
// $1: first slash word in URL
// $2: second part
var SLASH_WORD_MAYBEWORD = /^\/(\w+)(?:\/(\w+))?(?:\/|$)/;

var SLASH_PK_REGEXP = /\b(\d+\@Z\d\d)\b/;

var toSgn = function(url, host, path) {
  var m;
  if (m = SLASH_PK_REGEXP.exec(path)) {
    return  "sgn://zooomr.com/?pk=" + m[1];
  }
  if (!(m = SLASH_WORD_MAYBEWORD.exec(path))) {
    return url;
  }
  if (m[1] == "people" || m[1] == "photos") {
    return "sgn://zooomr.com/?ident=" + m[2].toLowerCase();
  }
  if (!m[2]) {
    return "sgn://zooomr.com/?ident=" + m[1].toLowerCase();
  }
  return url;
};

nodemapper.registerDomain("zooomr.com",
  {name: "Zooomr",
   urlToGraphNode: toSgn,
   pkRegexp: /^\d+\@Z\d\d$/

});

nodemapper.addSimpleHandler("zooomr.com", "ident_to_profile",
    "http://www.zooomr.com/people/", "/");
nodemapper.addSimpleHandler("zooomr.com", "ident_to_content",
    "http://www.zooomr.com/photos/", "/");
nodemapper.addSimpleHandler("zooomr.com", "ident_to_rss",
    "http://www.zooomr.com/services/feeds/public_photos/?id=",
    "&format=rss_200");

nodemapper.addSimpleHandler("zooomr.com", "pk_to_profile",
    "http://www.zooomr.com/people/", "/");
nodemapper.addSimpleHandler("zooomr.com", "pk_to_content",
    "http://www.zooomr.com/photos/", "/");
nodemapper.addSimpleHandler("zooomr.com", "pk_to_rss",
    "http://www.zooomr.com/services/feeds/public_photos/?id=",
    "&format=rss_200");

})();
// (end of included file sites/zooomr.js)


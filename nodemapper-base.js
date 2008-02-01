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
 */
nodemapper.registerDomain = function(domain, handler) {
  if (domain instanceof Array) {
    for (var i=0; i<domain.length; i++) {
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
 * @param {String} handler_name Name of handler (e.g. "pk_to_rss")
 *
 * @param {String} prefix Prefix that goes before the pk= or ident=
 *                        value of the sgn:// node, when generating
 *                        the http:// URL.
 *
 * @param {String} suffix Suffix that goes after the pk= or ident=
 *                        value of the sgn:// node, when generating
 *                        the http:// URL.
 */
nodemapper.addSimpleHandler = function(domain, handler_name,
				       prefix, suffix) {
    var handlers = nodemapper.handlers[domain];
    if (! handlers) {
	handlers = nodemapper.handlers[domain] = {};
    }
    if (!suffix) { suffix = ""; }
    handlers[handler_name] = function (pk_or_ident) {
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
  for (var i = 0; i < hostparts.length; ++i) {
    var subhost = hostparts.slice(i, hostparts.length);
    handler = nodemapper.handlers[subhost.join(".")];
    if (handler) break;
  }

  // no handler? just return URL unmodified.
  if (!(handler && handler.urlToGraphNode)) return url;

  // if this is https, and the domain hasn't declare that
  // its https is the same as http, use the normal
  // non-HTTP handler.
  if (scheme == "https" && !handler.httpsLikeHttp) {
    return nodemapper.urlToGraphNodeNotHTTP(url);
  }

  var graphnode = handler.urlToGraphNode(url, host, path);
  if (!graphnode) return url;
  return graphnode;
};

nodemapper.SGN_REGEX = new RegExp("^sgn://([^/]+)/\\?(ident|pk)=(.*)");

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
    return "sgn://" + domain + "/?" + keyName + "=" +
        (opt_opts.casePreserve ? m[1] : m[1].toLowerCase());
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
    if (!m) {
      return opt_opts.fallbackHandler ?
          opt_opts.fallbackHandler(url, host, path) :
          url;
    }
    return "sgn://" + domain + "/?ident=" + m[1].toLowerCase();
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

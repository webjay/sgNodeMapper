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
 * Mapping of domain names to handler objects,
 * maintained by NodeMapper.registerDomain().
 *
 * @see NodeMapper#registerDomain
 * @type Object
 */
nodemapper.handlers = {};


/**
 * Register a handler for a domain.
 *
 * @param {String|Array.<String>} domain Domain name
 *     (e.g. "foo.com.cn", "myspace.com") or an array of
 *     domain names to register handlers for.
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
 * Regular expression to test if URL is http, capturing: 1) domain
 * (including port) and 2) the path, if any.
 *
 * @type RegExp
 */
nodemapper.HTTP_REGEX = new RegExp("^http://([^/]+)(.*)");


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
  var host = m[1].toLowerCase();
  var path = m[2];

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
  if (!handler) return url;

  var graphnode = handler.urlToGraphNode(url, host, path);
  if (!graphnode) return url;
  return graphnode;
};


/**
 * List of functions registered with RegisterNonHTTPHandler
 *
 * @type Array.<Function>
 */
nodemapper.nonHTTPHandlers = [];


/**
 * registers handlers for non-HTTP URLs
 *
 * @param {Function} Function taking URL, returning either a social
 *     graph node identifier, or nothing if parse didn't match.
 */
nodemapper.registerNonHTTPHandler = function(handler) {
  nodemapper.nonHTTPHandlers.push(handler);
};


/**
 * returns a social graph node URL, given a non-HTTP URL, or
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
 * returns an sgn parser function, given a domain and regular
 * expression that operates on the path of a URL.
 *
 * @param {String} domain sgn:// domain to return on match
 * @param {RegExp} re Regular expression to match.  Capture #1
 *     must match the username.
 * @param {Object} opts Optional object with extra options, for
 *     instance: 'fallbackHandler' to run if no match
 *     (rather than returning URL back), 'casePreserve',
 *     a bool, to not lowercase the username.
 * @return {Function} function of (url, host, path) which returns
 *     an sgn:// URL (ideally, if recognized), or the same provided
 *     URL back if URL isn't recognized by a registered parser.
 */
nodemapper.createPathRegexpHandler = function(domain, re, opts) {
  if (!opts) opts = {};
  return function(url, host, path) {
    var m = re.exec(path);
    if (!m) {
      return opts.fallbackHandler ? opts.fallbackHandler(url, host, path) : url;
    }
    return "sgn://" + domain + "/?ident=" +
        (opts.casePreserve ? m[1] : m[1].toLowerCase());
  };
};


/**
 * Returns an sgn parser function, given a domain and regular
 * expression that operates on the hostname of a URL.
 *
 * @param {String} domain sgn:// domain to return on match
 * @param {RegExp} re Regular expression to match.  Capture #1
 *     must match the username.
 * @param {Object} opts Optional object with extra options, for
 *     instance: 'fallbackHandler' to run if no match
 *     (rather than returning URL back)
 */
nodemapper.createHostRegexpHandler = function(domain, re, opts) {
  if (!opts) opts = {};
  return function(url, host, path) {
    var m = re.exec(host);
    if (!m) {
      return opts.fallbackHandler ? opts.fallbackHandler(url, host, path) : url;
    }
    return "sgn://" + domain + "/?ident=" + m[1].toLowerCase();
  };
};

/**
 * returns an sgn parser function which parses URLs with
 * paths of the form /[username]/ (with optional trailing slash)
 *
 * @param {String} domain sgn:// domain to return on match
 * @param {Object} opts Options supported by createPathRegexpHandler
 * @return {String} Clean socialgraph identifier, if URL type is
 *     known, else same URL back.
 * @see nodemapper#createPathRegexpHandler
 */
nodemapper.createSlashUsernameHandler = function(domain, opts) {
  var slashUsernameRE = /^\/(\w+)\/?$/;
  return nodemapper.createPathRegexpHandler(domain, slashUsernameRE, opts);
};


/**
 * returns an sgn parser function which parses URLs with
 * paths of the form /[prefix]/[username]/ (with optional trailing slash)
 *
 * @param {String} prefix The prefix path before the username
 * @param {String} domain sgn:// domain to return on match
 * @param {Object} opts Options supported by createPathRegexpHandler
 * @return {String} Clean socialgraph identifier, if URL type is
 *     known, else same URL back.
 * @see nodemapper#createPathRegexpHandler
 */
nodemapper.createSomethingSlashUsernameHandler = function(prefix,
                                                          domain,
                                                          opts) {
  var slashSomethingUserRE = new RegExp("^/" + prefix + "/" +
                                        "(\\w+)(?:/|$)");
  return nodemapper.createPathRegexpHandler(domain, slashSomethingUserRE, opts);
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

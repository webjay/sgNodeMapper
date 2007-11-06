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
 **/


/**
 * @fileoverview Maps URLs to/from socialgraph identifiers.
 */


/**
 * NodeMapper object, the namespace for all other NodeMapper methods
 * and registrations from site handlers.
 * @type Object
 */
NodeMapper = {};


/**
 * Mapping of domain names to handler objects,
 * maintained by NodeMapper.registerDomain().
 *
 * @see NodeMapper#registerDomain
 * @type Object
 */
NodeMapper.handlers = {};


/**
 * How domains register their URL routines

 * @param {String | Array.<String>} domain Domain name
 *     (e.g. "foo.com.cn", "myspace.com") or an array of
 *     domain names to register handlers for.
 *
 * @param {Object} handler Object with functions as properties:
 *     'urlToGraphNode': function(url,host,path) -> ident/URL
 *     (more coming in the future)
 */
NodeMapper.registerDomain = function(domain, handler) {
  if (domain instanceof Array) {
    for (var i=0; i<domain.length; i++) {
      NodeMapper.handlers[domain[i]] = handler;
    }
  } else {
    NodeMapper.handlers[domain] = handler;
  }
};


/**
 * alias for brevity in site-specific *.js files
 */
registerDomain = NodeMapper.registerDomain;


/**
 * Regular expression to test if URL is http, capturing: 1) domain
 * (including port) and 2) the path, if any.
 *
 * @type RegExp
 */
NodeMapper.HTTP_RE = new RegExp("^http://([^/]+)(.*)");


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
NodeMapper.urlToGraphNode = function(url) {
  var m = NodeMapper.HTTP_RE.exec(url);
  if (!m) {
    // non-HTTP is rare; pass it to separate handler.  the rest
    // of this function deals with HTTP specifically
    return NodeMapper.urlToGraphNodeNotHTTP(url);
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
    handler = NodeMapper.handlers[subhost.join(".")];
    if (handler) break;
  }

  // no handler? just return URL unmodified.
  if (!handler) return url;

  var graphnode = handler.urlToGraphNode(url, host, path);
  if (!graphnode) return url;
  return graphnode;
};


/**
 * Temporary compatibility wrapper (the old entrypoint),
 * still used by C++ library, hence the C++ style.
 */
URLToGraphNode = NodeMapper.urlToGraphNode;

/**
 * List of functions registered with RegisterNonHTTPHandler
 *
 * @type Array.<Function>
 */
NodeMapper.nonHTTPHandlers = [];


/**
 * registers handlers for non-HTTP URLs
 *
 * @param {Function} Function taking URL, returning either a social
 *     graph node identifier, or nothing if parse didn't match.
 */
NodeMapper.registerNonHTTPHandler = function(handler) {
  NodeMapper.nonHTTPHandlers.push(handler);
};


/**
 * returns a social graph node URL, given a non-HTTP URL, or
 * returns the same URL, if scheme/pattern isn't recognized.
 *
 * @param {String} url non-HTTP URL of a person
 * @return {String} Clean socialgraph identifier, if URL type is
 *     known, else same URL back.
 */
NodeMapper.urlToGraphNodeNotHTTP = function(url) {
  for (var i=0; i < NodeMapper.nonHTTPHandlers.length; ++i) {
    var ident = NodeMapper.nonHTTPHandlers[i](url);
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
 * @param {Object} opts Optional object with extra options, for
 *     instance: 'fallbackHandler' to run if no match
 *     (rather than returning URL back), 'casePreserve',
 *     a bool, to not lowercase the username.
 */
function createPathRegexpHandler(domain, re, opts) {
  if (!opts) opts = {};
  return function(url, host, path) {
    var m = re.exec(path);
    if (!m) {
      return opts.fallbackHandler ? opts.fallbackHandler(url, host, path) : url;
    }
    return "sgn://" + domain + "/?ident=" +
        (opts.casePreserve ? m[1] : m[1].toLowerCase());
  };
}

function createHostRegexpHandler(domain, re, opts) {
  if (!opts) opts = {};
  return function(url, host, path) {
    var m = re.exec(host);
    if (!m) {
      return opts.fallbackHandler ? opts.fallbackHandler(url, host, path) : url;
    }
    return "sgn://" + domain + "/?ident=" + m[1].toLowerCase();
  };
}

/**
 * Wrapper around createPathRegexpHandler, returning a parser for
 * common pattern: path of /username/, where trailing slash is optional
 *
 * @param {String} domain sgn:// domain to return on match
 * @param {Object} opts Options supported by createPathRegexpHandler
 * @return {String} Clean socialgraph identifier, if URL type is
 *     known, else same URL back.
 */
function createSlashUsernameHandler(domain, opts) {
  var slashUsernameRE = /^\/(\w+)\/?$/;
  return createPathRegexpHandler(domain, slashUsernameRE, opts);
}


/**
 * Wrapper around createPathRegexpHandler, returning a parser for
 * common pattern: path of /[prefix]/[username]/, where the trailing
 * slash is optional.
 *
 * @param {String} prefix The prefix path before the username
 * @param {String} domain sgn:// domain to return on match
 * @param {Object} opts Options supported by createPathRegexpHandler
 * @return {String} Clean socialgraph identifier, if URL type is
 *     known, else same URL back.
 */
function createSomethingSlashUsernameHandler(prefix,
                                             domain,
                                             opts) {
  var slashSomethingUserRE = new RegExp("^/" + prefix + "/" +
                                        "(\\w+)(?:/|$)");
  return createPathRegexpHandler(domain, slashSomethingUserRE, opts);
}


/**
 * Creates a URL handler that parses out the subdomain
 * of a given domain, returning an sgn:// node of the
 * given subdomain, lowercased.
 *
 * @param {String} domain Domain name base, e.g. "livejournal.com"
 *     if you want to match "brad" in "brad.livejournal.com".
 * @return {Function} URL to sgn:// handler.
 */
function createUserIsSubdomainHandler(domain) {
  // yes, domain isn't escaped, but that doesn't matter,
  // as nobody will call this outside of a registerDomain'd
  // block of code, where the domain has already been matched
  var hostRE = new RegExp("([\\w\\-]+)\." + domain + "$", "i");
  return function(url, host, path) {
    var m;
    if (m = hostRE.exec(host)) {
      return "sgn://" + domain + "/?ident=" + m[1].toLowerCase();
    }
    return url;
  };
}

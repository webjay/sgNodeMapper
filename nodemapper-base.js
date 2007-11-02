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

NodeMapper = {};

/**
 * @fileoverview Maps URLs to/from socialgraph identifiers.
 */

/**
 * Mapping of domainString ("www.myspace.com") -> handlerObject,
 * maintained by NodeMapper.registerDomain()
 * @type Object
 */
NodeMapper.handlers = {};


/**
 * How domains register their URL routines
 * @param {String} domain Domainname, e.g. "foo.com.cn", "myspace.com", etc
 * @param {Object} handler Object with functions as properties:
 *    'urlToGraphNode': function(url,host,uri) -> ident/URL
 * (more coming in the future)
 */
NodeMapper.registerDomain = function (domain, handler) {
  if (domain instanceof Array) {
    for (var i=0; i<domain.length; i++) {
      NodeMapper.handlers[domain[i]] = handler;
    }
  } else {
    NodeMapper.handlers[domain] = handler;
  }
};

/**
 * compatibility
 */
registerDomain = NodeMapper.registerDomain;


/**
 * Regexp to test if URL is http, capturing: 1) domain (including port)
 * and 2) the URI, if any
 * @type RegExp
 */
NodeMapper.HTTP_RE = new RegExp("^http://([^/]+)(.*)");


/**
 * Entry point from C++/Java.
 * @param {String} url URL of a person
 * @return {String} Clean socialgraph identifier, if URL type is
 * known, else same URL back.
 */
NodeMapper.URLToGraphNode = function (url) {
  var m = NodeMapper.HTTP_RE.exec(url);
  if (!m) {
    // non-HTTP is rare; pass it to separate handler.  the rest
    // of this function deals with HTTP specifically
    return NodeMapper.urlToGraphNodeNotHTTP(url);
  }
  var host = m[1].toLowerCase();
  var uri = m[2];

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

  var graphnode = handler.urlToGraphNode(url, host, uri);
  if (!graphnode) return url;
  return graphnode;
};


/**
 * List of functions registered with RegisterNonHTTPHandler
 * @type Array
 */
NodeMapper.nonHTTPHandlers = [];


/**
 * How domains register parsers for non-http URLs
 * @param {Function} Function taking URL, returning either a social
 * graph node identifier, or nothing if parse didn't match.
 */
NodeMapper.registerNonHTTPHandler = function (handler) {
  NodeMapper.nonHTTPHandlers.push(handler);
};

/**
 * Called by URLToGraphNode for non-HTTP URLs
 * @param {String} url URL of a person
 * @return {String} Clean socialgraph identifier, if URL type is
 * known, else same URL back.
 */
NodeMapper.urlToGraphNodeNotHTTP = function (url) {
  for (var i=0; i < NodeMapper.nonHTTPHandlers.length; ++i) {
    var ident = NodeMapper.nonHTTPHandlers[i](url);
    if (ident) return ident;
  }
  return url;
};


/**
 * Returns a sgn parser function, given a regular expression
 * that operates on the path of a URI.
 *
 * @param {String} domain sgn:// domain to return on match
 * @param {RegExp} re Regular expression to match.  Capture #1
 *                 must match the username.
 * @param {Object} opts Optional object with extra options, for
 *                 instance: 'fallback_func' to run if no match
 *                 (rather than returning URL back), 'case_preserve',
 *                 a bool, to not lowercase the username.
 */
function makeUriRegexpHandler(domain, re, opts) {
  if (!opts) opts = {};
  return function (url, host, uri) {
    var m = re.exec(uri);
    if (!m) {
      return opts.fallback_func ? opts.fallback_func(url, host, uri) : url;
    }
    return "sgn://" + domain + "/?ident=" +
        (opts.case_preserve ? m[1] : m[1].toLowerCase());
  };
};

function makeHostRegexpHandler(domain, re, opts) {
  if (!opts) opts = {};
  return function (url, host, uri) {
    var m = re.exec(host);
    if (!m) {
      return opts.fallback_func ? opts.fallback_func(url, host, uri) : url;
    }
    return "sgn://" + domain + "/?ident=" + m[1].toLowerCase();
  };
};

/**
 * Wrapper around makeUriRegexpHandler, returning a parser for
 * common pattern: URI of /username/, where trailing slash is optional
 *
 * @param {String} domain sgn:// domain to return on match
 * @param {Object} opts Options supported by makeUriRegexpHandler
 * @return {String} Clean socialgraph identifier, if URL type is
 * known, else same URL back.
 */
function commonPatternSlashUsername(domain, opts) {
  var slashUsernameRE = /^\/(\w+)\/?$/;
  return makeUriRegexpHandler(domain, slashUsernameRE, opts);
};


/**
 * Wrapper around makeUriRegexpHandler, returning a parser for
 * common pattern: URI of /prefix/username/, where trailing slash is
 * optional.
 * @param {String} prefix The prefix path before the username
 * @param {String} domain sgn:// domain to return on match
 * @param {Object} opts Options supported by makeUriRegexpHandler
 * @return {String} Clean socialgraph identifier, if URL type is
 * known, else same URL back.
 */
function commonPatternSomethingSlashUsername(prefix,
                                             domain,
                                             opts) {
  var SlashSomethingUserRE = new RegExp("^/" + prefix + "/" +
                                        "(\\w+)(?:/|$)");
  return makeUriRegexpHandler(domain, SlashSomethingUserRE, opts);
};

function commonPatternSubdomain(domain) {
  // yes, domain isn't escaped, but that doesn't matter,
  // as nobody will call this outside of a registerDomain'd
  // block of code, where the domain has already been matched
  var hostRE = new RegExp("([\\w\\-]+)\." + domain + "$", "i");
  return function (url, host, uri) {
    var m;
    if (m = hostRE.exec(host)) {
      return "sgn://" + domain + "/?ident=" + m[1].toLowerCase();
    }
    return url;
  };
}

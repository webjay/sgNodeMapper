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
 * Mapping of domain -> handlers (from registerDomain)
 * @type Object
 */
handlers = {};


/**
 * How domains register their URL routines
 * @param {String} domain Domainname, e.g. "foo.com.cn", "myspace.com", etc
 * @param {Object} handler Object with functions as properties:
 *    'urlToGraphNode': function(url,host,uri) -> ident/URL
 * (more coming in the future)
 */
function registerDomain(domain, handler) {
  if (domain instanceof Array) {
    for (var i=0; i<domain.length; i++) {
      handlers[domain[i]] = handler;
    }
  } else {
    handlers[domain] = handler;
  }
};


/**
 * Regexp to test if URL is http, capturing: 1) domain (including port)
 * and 2) the URI, if any
 * @type RegExp
 */
var HTTP_RE = new RegExp("^http://([^/]+)(.*)");


/**
 * Entry point from C++/Java.
 * @param {String} url URL of a person
 * @return {String} Clean socialgraph identifier, if URL type is
 * known, else same URL back.
 */
function URLToGraphNode (url) {
  var m = HTTP_RE.exec(url);
  if (!m) {
    // non-HTTP is rare; pass it to separate handler.  the rest
    // of this function deals with HTTP specifically
    return urlToGraphNodeNotHTTP(url);
  }
  var host = m[1];
  var uri = m[2];

  // from user.site.co.uk, lookup handlers for
  // "user.site.co.uk", "site.co.uk", "co.uk", "uk"
  // until first handler is found, then stop.
  var hostparts = host.split(".");
  var handler;
  for (var i = 0; i < hostparts.length; ++i) {
    var subhost = hostparts.slice(i, hostparts.length);
    handler = handlers[subhost.join(".")];
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
var nonHTTPHandlers = [];


/**
 * How domains register parsers for non-http URLs
 * @param {Function} Function taking URL, returning either a social
 * graph node identifier, or nothing if parse didn't match.
 */
function registerNonHTTPHandler(handler) {
  nonHTTPHandlers.push(handler);
}

/**
 * Called by URLToGraphNode for non-HTTP URLs
 * @param {String} url URL of a person
 * @return {String} Clean socialgraph identifier, if URL type is
 * known, else same URL back.
 */
function urlToGraphNodeNotHTTP(url) {
  for (var i=0; i < nonHTTPHandlers.length; ++i) {
    var ident = nonHTTPHandlers[i](url);
    if (ident) return ident;
  }
  return url;
};


/**
 * Returns parser for common pattern: URI of /username/, where
 * trailing slash is optional
 * @param {String} desired_domain sgn:// domain to return on match
 * @param {Function} fallback_func Optional fallback function
 * to call if URI doesn't match pattern.
 * @return {String} Clean socialgraph identifier, if URL type is
 * known, else same URL back.
 */
function commonPatternSlashUsername(desired_domain, fallback_func) {
  var slashUsernameRE = /^\/(\w+)\/?$/;
  return function (url, host, uri) {
    var m = slashUsernameRE.exec(uri);
    if (!m) {
      return fallback_func ? fallback_func(url, host, uri) : url;
    }
    return "sgn://" + desired_domain + "/?ident=" + m[1].toLowerCase();
  };
};


/**
 * Returns parser for common pattern: URI of /prefix/username/, where
 * trailing slash is optional
 * @param {String} prefix The prefix path before the username
 * @param {String} desired_domain sgn:// domain to return on match
 * @param {Function} fallback_func Optional fallback function
 * to call if URI doesn't match pattern.
 * @return {String} Clean socialgraph identifier, if URL type is
 * known, else same URL back.
 */
function commonPatternSomethingSlashUsername(prefix,
                                             desired_domain,
                                             fallback_func) {
  var SlashSomethingUserRE = new RegExp("^/" + prefix + "/" +
                                        "(\\w+)(?:/|$)");
  return function (url, host, uri) {
    var m;
    if (!(m = SlashSomethingUserRE.exec(uri))) {
      if (fallback_func)
        return fallback_func(url, host, uri);
      return url;
    }
    return "sgn://" + desired_domain + "/?ident=" + m[1].toLowerCase();
  };
};


////////////////////////////////////////////////////////////////////////////
// MySpace
////////////////////////////////////////////////////////////////////////////

var MYSPACE_URI_RE = /index\.cfm\?fuseaction=(.+)&friendID=(\d+)/i;

// match $1 = number, or $2 = username, followed by optional query
// parameters, or nothing
var MYSPACE_URI_SLASH_WHATEVER = /^\/(\d+)|([a-z]\w*)(?:\?|$)/;

// actions which, if seen in a URL, likely point to a user or her content
var MYSPACE_USER_ACTIONS = {
  "user.viewprofile": 1,
  "blog.listall": 1,
  "blog.confirmsubscribe": 1,
};

function urlToGraphNode_MySpace(url, host, uri) {
  var m = MYSPACE_URI_RE.exec(uri);
  if (m) {
    var action = m[1].toLowerCase();
    var userid = m[2];
    if (MYSPACE_USER_ACTIONS[action]) {
      return "sgn://myspace.com/?pk=" + userid;
    }
  }
  if (host == "profile.myspace.com") {
    m = MYSPACE_URI_SLASH_WHATEVER.exec(uri);
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

registerDomain("myspace.com", {
 urlToGraphNode: commonPatternSlashUsername("myspace.com",
                                            urlToGraphNode_MySpace),
});

registerDomain(["profile.myspace.com",
                "blog.myspace.com"], {
 urlToGraphNode: urlToGraphNode_MySpace,
});

////////////////////////////////////////////////////////////////////////////
// AOL
////////////////////////////////////////////////////////////////////////////

var AOL_RE = /^aim:(?:goim\?screenname=)?([\w \+]+)/i;
registerNonHTTPHandler(function (url) {
  var m = AOL_RE.exec(url);
  if (m) {
    var screenname = m[1].toLowerCase().replace(/[\s\+]/g, "");
    return "sgn://aol.com/?ident=" + screenname;
  }
});

registerDomain("openid.aol.com", {
 urlToGraphNode: commonPatternSlashUsername("aol.com"),
});

registerDomain("aimpages.com", {
 urlToGraphNode: function (url, host, uri) {
   var slashProfile = /^\/{1,2}([\w\+]+)(?:\/(?:profile\.html)?|$)/;
   var m;
   if (!(m = slashProfile.exec(uri)))
     return url;
   return "sgn://aol.com/?ident=" + m[1].toLowerCase().replace(/[\s\+]/g, "");
 },
});

////////////////////////////////////////////////////////////////////////////
// LiveJournal
////////////////////////////////////////////////////////////////////////////

registerDomain(["users.livejournal.com",
                "community.livejournal.com"], {
  urlToGraphNode: function (url, host, uri) {
    var slashUserMaybeProfile = /^\/(\w+)(?:\/|\/profile|$)/;
    var m;
    if (!(m = slashUserMaybeProfile.exec(uri)))
      return url;
    return "sgn://livejournal.com/?ident=" + m[1].toLowerCase();
  },
});

registerDomain("livejournal.com", {
 urlToGraphNode: function (url, host, uri) {
   if (host == "www.livejournal.com" || host == "livejournal.com") {
     var slashTildeUserMaybeProfile = /^\/~(\w+)(?:\/|\/profile|$)/;
     var m;
     if (!(m = slashTildeUserMaybeProfile.exec(uri)))
       return url;
     return "sgn://livejournal.com/?ident=" + m[1].toLowerCase();
   }

   var hostparts = host.split(".");
   var user = hostparts[0].replace(/-/g, "_");
   return "sgn://livejournal.com/?ident=" + user;
 },
});

////////////////////////////////////////////////////////////////////////////
// Digg
////////////////////////////////////////////////////////////////////////////

registerDomain("digg.com", {
 urlToGraphNode: commonPatternSomethingSlashUsername("users", "digg.com"),
});

////////////////////////////////////////////////////////////////////////////
// Flickr
////////////////////////////////////////////////////////////////////////////

function urlToGraphNode_Flickr(url, host, uri) {
  var flickerUriRE = /^\/(?:people|photos)\/(\d+@\w+)\/?$/;
  var m = flickerUriRE.exec(uri);
  return m ? "sgn://flickr.com/?pk=" + m[1] : uri;
};

registerDomain("flickr.com", {
 urlToGraphNode: commonPatternSomethingSlashUsername("(?:people|photos)",
                                                     "flickr.com",
                                                     urlToGraphNode_Flickr),
});

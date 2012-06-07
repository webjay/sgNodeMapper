//############################################################
// AUTO-GENERATED FILE; DO NOT EDIT.  This is a concatenantion
// of nodemapper-base.js, and sites/*.js.  Edit those.
//#############################################################
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
nodemapper = {};
nodemapper.IDENT_REGEXP = /^\w*[a-zA-Z]+\w*$/;
nodemapper.PK_REGEXP = /^\d+$/;
nodemapper.pkRegexp = function(handler) {
    return handler.pkRegexp ? handler.pkRegexp : nodemapper.PK_REGEXP;
};
nodemapper.identRegexp = function(handler) {
    return handler.identRegexp ? handler.identRegexp : nodemapper.IDENT_REGEXP;
};
nodemapper.handlers = {};
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
nodemapper.HTTP_REGEX = new RegExp("^(https?)://([^/]+)(.*)");
nodemapper.urlToGraphNode = function(url) {
  var m = nodemapper.HTTP_REGEX.exec(url);
  if (!m) {
    return nodemapper.urlToGraphNodeNotHTTP(url);
  }
  var scheme = m[1];
  var host = m[2].toLowerCase();
  var path = m[3];
  var hostparts = host.split(".");
  var handler;
  var matchedDomain; // the domain that matched tightest
  for (var i = 0; i < hostparts.length; ++i) {
    var subhost = hostparts.slice(i, hostparts.length);
    matchedDomain = subhost.join(".");
    handler = nodemapper.handlers[matchedDomain];
    if (!handler) continue;
    var graphNode;
    if (scheme == "https" && !handler.httpsLikeHttp) {
	graphNode = nodemapper.urlToGraphNodeNotHTTP(url);
    }
    if (handler.urlToGraphNode) {
	graphNode = handler.urlToGraphNode(url, host, path);
    }
    if ((!graphNode || graphNode == url) && !handler.skipAutomaticHttpToSgn) {
	graphNode = nodemapper.sgnFromHttpUsingToHttpRules(matchedDomain, url);
    }
    if (!graphNode || graphNode == url) {
	continue;
    }
    return graphNode;
  }
  return url;
};
nodemapper.pairToGraphNode = function (host, account) {
    if (!account) {
	return;
    }
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
	    if (nodemapper.lookupHandlerWithProperty(host, "identCasePreserve")) {
	    } else {
		account = account.toLowerCase();
	    }
	    return "sgn://" + sgnDomain + "/?ident=" + account;
	}
    }
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
nodemapper.DOMAIN_RE = /^(?:\w+:\/{0,2})?([^:\/]*?)(?:[:\/]|$)/;
nodemapper.parseDomain = function (arg) {
    var m;
    if ((m = nodemapper.DOMAIN_RE.exec(arg)) && m[1].length > 0) {
	return m[1];
    }
    return;
};
nodemapper.sgnFromHttpUsingToHttpRules = function(domain, url) {
    var handler = nodemapper.handlers[domain];
    if (!handler || !handler.sgnToHttpPatterns) {
	return;
    }
    var m;
    var matches = [];
    for (var i = 0; i < handler.sgnToHttpPatterns.length; i++) {
	var pattern = handler.sgnToHttpPatterns[i];
	var prefix = pattern[0];
	var suffix = pattern[1];
	var type = pattern[2];
	if (url.substr(0, prefix.length) == prefix &&
	    url.substr(url.length - suffix.length, suffix.length) == suffix) {
	    var midLength = url.length - prefix.length - suffix.length;
	    if (midLength >= 1) {
		var match = url.substr(prefix.length, midLength);
		if (type == "pk" &&
		    (m = nodemapper.pkRegexp(handler).exec(match))) {
		    matches.push("sgn://" + domain + "/?pk=" + match);
	        } else if (type == "ident" &&
			   (m = nodemapper.identRegexp(handler).exec(match))) {
		    if (! handler.caseSensitiveIdent) {
			match = match.toLowerCase();
		    }
                    if (!(match == "www" ||
                          (handler.notUsernames && handler.notUsernames[match]))) {
                      matches.push("sgn://" + domain + "/?ident=" + match);
                    }
		}
	    }
	}
    }
    if (matches.length == 1) {
	return matches[0];
    } else {
        debug("More/less than 1 match for " + url + ".  Potential matches: [" + matches + "]");
    }
    return;
};
nodemapper.SGN_REGEX = new RegExp("^sgn://([^/]+)/\\?(ident|pk)=(.*)");
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
    var node = nodemapper.parseSgnUrl(sgnUrl);
    if (!node) {
	return;
    }
    var handler = nodemapper.handlers[node.domain];
    if (!handler) {
	return;
    }
    var attrName = node.keyName + "_to_" + type;
    var toFunc = handler[attrName];
    if (!toFunc) {
	return;
    }
    return toFunc(node.value);
};
nodemapper.nonHTTPHandlers = [];
nodemapper.registerNonHTTPHandler = function(handler) {
  nodemapper.nonHTTPHandlers.push(handler);
};
nodemapper.urlToGraphNodeNotHTTP = function(url) {
  for (var i=0; i < nodemapper.nonHTTPHandlers.length; ++i) {
    var ident = nodemapper.nonHTTPHandlers[i](url);
    if (ident) return ident;
  }
  return url;
};
nodemapper.createPathRegexpHandler = function(domain, re, opt_opts) {
  if (!opt_opts) opt_opts = {};
  return function(url, host, path) {
    if (opt_opts.pathTransform) {
      path = opt_opts.pathTransform(path);
    }
    var m = re.exec(path);
    if (!m) {
      return opt_opts.fallbackHandler ?
          opt_opts.fallbackHandler(url, host, path) :
          url;
    }
    var keyName = opt_opts.keyName || 'ident'; // ident= or pk=; TODO: enforce valid key names?
    var value = (opt_opts.casePreserve ? m[1] : m[1].toLowerCase());
    if (opt_opts.notUsernames && opt_opts.notUsernames[value]) {
      return opt_opts.fallbackHandler ?
          opt_opts.fallbackHandler(url, host, path) :
          url;
    }
    return "sgn://" + domain + "/?" + keyName + "=" + value;
  };
};
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
nodemapper.createSlashUsernameHandler = function(domain, opt_opts) {
  var slashUsernameRE = /^\/(\w+)\/?$/;
  if (opt_opts && opt_opts.slashAnything) {
      slashUsernameRE = /^\/(\w+)(?:\/|$)/;
  }
  return nodemapper.createPathRegexpHandler(domain, slashUsernameRE, opt_opts);
};
nodemapper.createSomethingSlashUsernameHandler = function(prefix,
                                                          domain,
                                                          opt_opts) {
  var slashSomethingUserRE = new RegExp("^/" + prefix + "/" +
                                        "(\\w+)(?:/|$)");
  return nodemapper.createPathRegexpHandler(domain,
                                            slashSomethingUserRE,
                                            opt_opts);
};
nodemapper.createUserIsSubdomainHandler = function(domain) {
  var subdomainRE = new RegExp("([\\w\\-]+)\." + domain + "$", "i");
  return nodemapper.createHostRegexpHandler(domain, subdomainRE);
};
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
  ret.sort(function(a, b) {
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
    if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
    return 0;
  });
  nodemapper._memoizedNamedSites = ret;
  return ret;
}
nodemapper.namedSitesCount = function() {
  return nodemapper.namedSites().length;
}
nodemapper.namedSiteProperty = function(n, property) {
  return nodemapper.namedSites()[n][property];
}
/* install null debug handler, if host container hasn't */
try {
    if (debug) { }
} catch (e) {
    debug = function() {};
}
(function(){
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
(function(){
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
nodemapper.registerDomain("pictures.aol.com",
  {name: "AOL Pictures",
   urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler("galleries",
      "pictures.aol.com")});
nodemapper.addSimpleHandler("pictures.aol.com", "ident_to_profile",
      "http://pictures.aol.com/galleries/");
nodemapper.addSimpleHandler("pictures.aol.com", "ident_to_atom",
      "http://pictures.aol.com/galleries/", "/atom.xml");
})();
(function(){
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
nodemapper.addSimpleHandler("blogspot.com", "ident_to_rss",
			    "http://", ".blogspot.com/feeds/posts/default?alt=rss");
nodemapper.addSimpleHandler("blogspot.com", "ident_to_atom",
			    "http://", ".blogspot.com/feeds/posts/default");
nodemapper.registerDomain("blogger.com", {
  name: "Blogger (Profile)",
  urlToGraphNode: nodemapper.createPathRegexpHandler(
      "blogger.com",
      /^\/profile\/(\d+)/, { keyName: "pk" })
   });
nodemapper.addSimpleHandler("blogger.com", "pk_to_profile",
                            "http://www.blogger.com/profile/");
})();
(function(){
var FACEBOOK_ALT_DOMAINS = [
    "facebook.at",
    "facebook.ca",
    "facebook.co.nz",
    "facebook.co.za",
    "facebook.com.au",
    "facebook.de",
    "facebook.dk",
    "facebook.es",
    "facebook.ie",
    "facebook.jp",
    "facebook.net.nz",
    "facebook.no",
    "facebook.pl",
    "facebook.se",
    "facebook.vn"
];
var PRIVATE_PROFILE_RE = /^(?:\/home\.php\#)?\/profile\.php\?id=(\d+)/;
var PUBLIC_PROFILE_RE = /^\/(?:p|people)\/([^\/]+\/(\d+))/;
var USERNAME_RE = /^\/(\w[\w\.\-]{2,30}\w)(?:$|[\/\?])/;
var NOT_USERNAME = {
  people: 1,
  pages: 1,
  directory: 1,
  video: 1,
  apps: 1,
  discography: 1,
  networks: 1,
  help: 1,
  applications: 1,
  reviews: 1,
  ext: 1,
  marketplace: 1
};
var facebookHandler = function(url, host, path) {
  var m;
  if (m = PRIVATE_PROFILE_RE.exec(path)) {
    return "sgn://facebook.com/?pk=" + m[1];
  }
  if (m = PUBLIC_PROFILE_RE.exec(path)) {
    return "sgn://facebook.com/?ident=" + m[1];
  }
  if (m = USERNAME_RE.exec(path)) {
    if (m[1].lastIndexOf(".php") == m[1].length - 4 ||
        NOT_USERNAME[m[1].toLowerCase()]) {
      return url;
    }
    return "sgn://facebook.com/?ident=" + m[1].toLowerCase().replace(/[\-\.]/g, "");
  }
  return url;
};
nodemapper.registerDomain(
    FACEBOOK_ALT_DOMAINS,
    { urlToGraphNode: facebookHandler });
nodemapper.registerDomain(
    "facebook.com",
    {name: "Facebook",
     urlToGraphNode: facebookHandler,
     ident_to_profile: function (ident) {
        if (/\//.exec(ident)) {
          return "http://www.facebook.com/people/" + ident;
        } else {
          return "http://www.facebook.com/" + ident;
        }
      },
     pk_to_profile: function (pk) { return "http://www.facebook.com/profile.php?id=" + pk; },
     pkRegexp: /^\d+$/,
     identRegexp: /^(?:.+\/\d+)|(?:\w[\w\.\-]{2,30}\w)$/,
     identCasePreserve: 1
     });
})();
(function(){
function urlToGraphNodeFlickrFallback(url, host, path) {
  var flickerPathRE = /^\/(?:people|photos)\/(\d+@\w+)(?:\/|$)/;
  var m = flickerPathRE.exec(path);
  if (m) {
      return "sgn://flickr.com/?pk=" + m[1];
  }
  return; // undef
};
var urlToGraphNodeFlickr =
    nodemapper.createPathRegexpHandler(
        "flickr.com",
        /^(?:\/(?:people|photos))?\/([\w\-]+)(?:\/|$)/,
        {fallbackHandler: urlToGraphNodeFlickrFallback,
	 notUsernames: {
		photos: 1,
		groups: 1,
		people: 1,
		search: 1,
		places: 1,
		help: 1,
		services: 1,
		explore: 1,
		groups_topics: 1,
		photo: 1,
		creativecommons: 1,
		commons: 1,
		cameras: 1,
		photo_zoom: 1,
		signin: 1,
		forums: 1,
		apps: 1,
		slideShow: 1,
		map: 1,
		account: 1,
		groups_topic: 1
	    },
         pathTransform: function(path) { return path.replace('%40', '@'); }
        });
nodemapper.registerDomain(
  "flickr.com", {
  name: "Flickr",
  urlToGraphNode: urlToGraphNodeFlickr,
  pkRegexp: /^\d+@\w\d+$/,
  accountToSgn: { pk: ["flickr.com", /^\d+@\w\d+$/],
                  ident: ["flickr.com", /^[\-\w]+$/] }
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
(function(){
var GOOGLE_TLDS = "ad ae am as at az ba be bg bi bs ca cd cg ch ci cl cn co.bw co.ck co.cr co.id co.il co.im co.in co.je co.jp co.ke co.kr co.ls co.ma co.mw co.nz co.pn co.th co.tt co.ug co.uk co.uz co.ve co.vi co.yu co.za co.zm co.zw com com.af com.ag com.ar com.au com.bd com.bh com.bn com.bo com.br com.bz com.cn com.co com.cu com.do com.ec com.eg com.et com.fj com.gi com.gr com.gt com.hk com.jm com.kh com.kz com.lv com.ly com.mt com.mw com.mx com.my com.na com.nf com.ng com.ni com.np com.om com.pa com.pe com.ph com.pk com.pl com.pr com.py com.qa com.ru com.sa com.sb com.sg com.sl com.sv com.tj com.tr com.tt com.tw com.ua com.uy com.vc com.ve com.vn cz de dj dk dm ee es fi fm fr ge gg gl gm gp gr gy hk hn hr ht hu ie is it je jo kg ki kz la li lk lt lu lv md me mn ms mu mv mw ne.jp nl no nr nu off.ai ph pl pn pt ro ru rw sc se sg sh si sk sl sm sn st tk tl tm to tp tt us vg vn vu ws".split(" ");
function googleDomains(prefix) {
  var ret = [];
  for (var idx in GOOGLE_TLDS) {
    ret.push(prefix + GOOGLE_TLDS[idx]);
  }
  return ret;
}
var GOOGLE_DOMAINS = googleDomains("google.");
var READER_RE = /^\/reader\/(?:shared|public\/atom\/user)\/(\d{7,})(?:\/state\/com.google\/broadcast)?/;
var googleIdentProfileHandler = nodemapper.createPathRegexpHandler(
    "profiles.google.com",  // fake domain
    /^(?:\/s2)?\/(?:profiles\/|sharing\/stuff\?user=)([\w+\.]+)/,
    {keyName: "ident"});
var googleProfileHandler = nodemapper.createPathRegexpHandler(
    "profiles.google.com",  // fake domain
    /^(?:\/s2)?\/(?:profiles\/|sharing\/stuff\?user=)(\d+)/,
    {keyName: "pk", fallbackHandler: googleIdentProfileHandler });
var readerHandler = nodemapper.createPathRegexpHandler(
    "reader.google.com",  // fake domain
    READER_RE,
   {keyName: "pk"});
var profilesDomainIdentHandler = nodemapper.createPathRegexpHandler(
    "profiles.google.com",  // fake domain
    /^\/([\w+\.]+)(?:\?|$)/,
    {keyName: "ident"})
googleMasterHandler = function(url, host, path) {
  var handler = null;
  if (path.indexOf("/reader") == 0) {
    handler = readerHandler;
  } else if (path.indexOf("/s2/") == 0) {
    handler = googleProfileHandler;
  } else if (path.indexOf("/profiles/") == 0) {
    handler = googleProfileHandler;
  }
  if (handler) return handler(url, host, path);
  return url;
};
nodemapper.registerDomain(GOOGLE_DOMAINS, {urlToGraphNode: googleMasterHandler});
nodemapper.registerDomain("reader.google.com", {
	name: "Google Reader",
	pkRegexp: /^\d{7,}$/
	});
nodemapper.addSimpleHandler("reader.google.com", "pk_to_content",
			    "http://www.google.com/reader/shared/", "");
nodemapper.addSimpleHandler("reader.google.com", "pk_to_profile",
			    "http://www.google.com/reader/shared/", "");
nodemapper.addSimpleHandler("reader.google.com", "pk_to_atom",
			    "http://www.google.com/reader/public/atom/user/",
                            "/state/com.google/broadcast");
var PROFILE_RE = /^\/profile\?user=(\w+)/;
var USER_RE = /^\/(?:(?:rss\/)?user\/)?(\w+)\b/;
var YOUTUBE_NOT_USERNAME = {
  'blog': true,
  'browse': true,
  'community': true,
  'dev': true,
  'feeds': true,
  'greetings': true,
  'inbox': true,
  'jobs': true,
  'members': true,
  'my_account': true,
  'my_favorites': true,
  'my_playlists': true,
  'my_subscriptions': true,
  'my_videos': true,
  'press_room': true,
  'support': true,
  't': true,
  'testtube': true,
  'watch': true,
  'watch_queue': true,
  'youtubeonyoursite': true
};
var youTubeToSgn = function(url, host, path) {
  var m;
  if ((m = PROFILE_RE.exec(path)) || (m = USER_RE.exec(path))) {
    var username = m[1].toLowerCase();
    if (YOUTUBE_NOT_USERNAME[username]) {
      return url;
    }
    return "sgn://youtube.com/?ident=" + username;
  }
  return url;
};
nodemapper.registerDomain(
  "youtube.com",
  {name: "YouTube",
   urlToGraphNode: youTubeToSgn});
nodemapper.registerDomain(
    "gdata.youtube.com",
    {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
          "feeds/base/users",
          "youtube.com")});
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
        urlToGraphNode: profilesDomainIdentHandler,
	name: "Google Profile",
	pkRegexp: /^\d{7,}$/,
        identRegexp: /^[\w\.]{1,40}$/
  });
nodemapper.addSimpleHandler("profiles.google.com", "pk_to_profile",
                            "http://www.google.com/profiles/");
nodemapper.addSimpleHandler("profiles.google.com", "ident_to_profile",
                            "http://www.google.com/profiles/");
})();
(function(){
var HAS_ID_REGEXP = /\b(?:ownerId=|userid=|friend\/|\/profile\/foaf\/)(\d+)/;
var FRIEND_ID_REGEXP = /^\/friend\/p(\d+)-/;
var DISPLAY_PROFILE = /^\/friend\/profile\/displayHi5URL\.do\?nickname=([\w\-]{6,})\b/;
var NUMERIC_DOMAIN = /^(\d+)\.hi5\.com$/;
function urlToGraphNodeHi5(url, host, path) {
    var m;
    if ((m = HAS_ID_REGEXP.exec(path)) ||
        (m = FRIEND_ID_REGEXP.exec(path))) {
	return "sgn://hi5.com/?pk=" + m[1];
    }
    if (path == "/" && (m = /^([\w\-]{6,})\.hi5\.com$/.exec(host))) {
	var match = m[1];
	if (/[^\d]/.exec(match)) {
	    return "sgn://hi5.com/?ident=" + m[1].toLowerCase();
	} else {
	    return "sgn://hi5.com/?pk=" + m[1];
	}
    }
    if (m = DISPLAY_PROFILE.exec(path)) {
	return "sgn://hi5.com/?ident=" + m[1].toLowerCase();
    }
    if ((m = NUMERIC_DOMAIN.exec(host)) && !/\?/.exec(path)) {
      return "sgn://hi5.com/?pk=" + m[1];
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
(function(){
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
(function(){
var LJCOM_MAIN_DOMAIN_REGEX = /^\/(?:~|users\/|community\/)(\w+)(?:\/|$)/;
var LJCOM_USERINFO_BML_REGEX = /^\/userinfo\.bml\?(user|userid)=(\w+)/;
var LJCOM_MISC_BML_REGEX = /^\/(?:go|talkread)\.bml\?.*\bjournal=(\w+)/;
var LJCOM_MISC_FDATA_REGEX = /^\/misc\/fdata2?\.bml\?.*\buser=(\w+)/;
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
var urlToGraphNodeGeneral = function(url, host, path) {
  var m;
  if (host == "pics.livejournal.com") {
    return url;
  }
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
    if (m = LJCOM_MISC_FDATA_REGEX.exec(path)) {
      return "sgn://livejournal.com/?ident=" + m[1].toLowerCase();
    }
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
nodemapper.registerDomain(
    "pics.livejournal.com",
    {urlToGraphNode: nodemapper.createSlashUsernameHandler(
          "livejournal.com",
          { slashAnything: 1 })});
})();
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
(function(){
var ACTION_REGEX = /index\.cfm\?fuseaction=(.+)&friendID=(\d+)/i;
var SLASH_WHATEVER_REGEX = /^\/(\d+)|([a-z]\w*)(?:\?|$)/;
var MYSPACE_USER_ACTIONS = {
  "user.viewprofile": 1,
  "user.viewfriends": 1,
  "blog.listall": 1,
  "blog.confirmsubscribe": 1
};
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
  return url;
};
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
    "http://www.myspace.com/");
nodemapper.addSimpleHandler(
    "myspace.com", "ident_to_content",
    "http://www.myspace.com/");
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
(function(){
var IDENT_REGEXP = /^[\w\-\%\.\:\*]+$/;
var SLASH_WHATEVER = /^\/([^\/]+)(?:\/|$)/;
var toSgn = function(url, host, path) {
  var m;
  if (!(m = SLASH_WHATEVER.exec(path))) {
    return;
  }
  var username = m[1];
  if (!(m = IDENT_REGEXP.exec(username))) {
    return url;
  }
  return "sgn://my.opera.com/?ident=" + username.toLowerCase();
};
nodemapper.registerDomain("my.opera.com", {
  name: "My Opera",
  identRegexp: IDENT_REGEXP,
  pkRegexp: /^ dontmatchme $/,
  urlToGraphNode: toSgn
});
nodemapper.addSimpleHandler("my.opera.com", "ident_to_profile",
                            "http://my.opera.com/", "/about/");
nodemapper.addSimpleHandler("my.opera.com", "ident_to_foaf",
                            "http://my.opera.com/", "/xml/foaf/");
})();
(function(){
nodemapper.registerDomain(
    "gallery.ru",
    {urlToGraphNode: nodemapper.createUserIsSubdomainHandler("gallery.ru"),
          name: "Gallery.ru"
          });
nodemapper.addSimpleHandler("gallery.ru", "ident_to_foaf",
                            "http://", ".gallery.ru/foaf/");
nodemapper.addSimpleHandler("gallery.ru", "ident_to_profile",
                            "http://", ".gallery.ru/");
nodemapper.registerDomain(
    "blogonline.ru",
    {urlToGraphNode: nodemapper.createUserIsSubdomainHandler("blogonline.ru"),
     name: "blogonline.ru"
          });
nodemapper.addSimpleHandler("blogonline.ru", "ident_to_foaf",
                            "http://", ".blogonline.ru/data/foaf");
nodemapper.addSimpleHandler("blogonline.ru", "ident_to_profile",
                            "http://", ".blogonline.ru/profile");
nodemapper.addSimpleHandler("blogonline.ru", "ident_to_blog",
                            "http://", ".blogonline.ru/");
nodemapper.registerDomain(
    "privet.ru",
    {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler("user", "privet.ru"),
          name: "privet.ru"
          });
nodemapper.addSimpleHandler("privet.ru", "ident_to_foaf",
                            "http://www.privet.ru/user/", "/foaf");
nodemapper.addSimpleHandler("privet.ru", "ident_to_blog",
                            "http://blogs.privet.ru/user/");
nodemapper.addSimpleHandler("privet.ru", "ident_to_profile",
                            "http://www.privet.ru/user/");
})();
(function(){
nodemapper.registerDomain(
    "blogs.sapo.pt",
    {urlToGraphNode: nodemapper.createUserIsSubdomainHandler("blogs.sapo.pt"),
          name: "SAPO"
          });
nodemapper.addSimpleHandler("blogs.sapo.pt", "ident_to_foaf",
                            "http://", ".blogs.sapo.pt/data/foaf");
nodemapper.addSimpleHandler("blogs.sapo.pt", "ident_to_blog",
                            "http://", ".blogs.sapo.pt/");
})();
(function(){
nodemapper.registerDomain(
    "digg.com",
    {name: "Digg",
     urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
        "(?:users|rss)",
        "digg.com")});
nodemapper.addSimpleHandler("digg.com", "ident_to_profile",
			    "http://digg.com/users/", "/");
nodemapper.addSimpleHandler("digg.com", "ident_to_rss",
			    "http://digg.com/users/", "/history/diggs.rss");
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
    ["del.icio.us", "delicious.com"],
    {name: "del.icio.us",
     primaryDomain: "del.icio.us",
     urlToGraphNode: nodemapper.createPathRegexpHandler(
         "del.icio.us", /^\/(?:rss\/)?(\w+)/, 
         { notUsernames: { "rss": 1 }, slashAnything: 1})});
nodemapper.addSimpleHandler("del.icio.us", "ident_to_profile", 
    "http://delicious.com/");
nodemapper.addSimpleHandler("del.icio.us", "ident_to_rss", 
    "http://feeds.delicious.com/rss/");
nodemapper.registerDomain(
    ["tungle.me", "tgl.me"],
    {name: "Tungle.me",
     primaryDomain: "tungle.me",
     urlToGraphNode: nodemapper.createSlashUsernameHandler(
         "tungle.me")});
nodemapper.addSimpleHandler("tungle.me", "ident_to_profile", 
    "http://tungle.me/");
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
nodemapper.registerDomain("nytimes.com",
  {name: "TimesPeople",
   urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler("view/user",
      "nytimes.com", {keyName: "pk", slashAnything: 1})});
nodemapper.addSimpleHandler("nytimes.com", "pk_to_profile", 
    "http://timespeople.nytimes.com/view/user/", "/activities.html");
nodemapper.addSimpleHandler("nytimes.com", "pk_to_rss", 
    "http://timespeople.nytimes.com/view/user/", "/rss.xml");
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
    "dailymotion.com", /^\/(?:rss\/)?(\w+)(?:\/|$|\?from=)/, {slashAnything: 1})});
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
nodemapper.registerDomain("d.hatena.ne.jp",
  {name: "Hatena::Diary",
   urlToGraphNode: nodemapper.createPathRegexpHandler(
    "d.hatena.ne.jp", /^\/([\w-]+)(?:\/|$)/, {casePreserve: 1})});
nodemapper.addSimpleHandler("d.hatena.ne.jp", "ident_to_profile", 
    "http://d.hatena.ne.jp/", "/");
nodemapper.addSimpleHandler("d.hatena.ne.jp", "ident_to_rss", 
    "http://d.hatena.ne.jp/", "/rss");
nodemapper.addSimpleHandler("d.hatena.ne.jp", "ident_to_foaf", 
    "http://d.hatena.ne.jp/", "/foaf");
nodemapper.registerDomain("disqus.com",
  {name: "Disqus",
   urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
      "people", "disqus.com", {slashAnything: 1})});
nodemapper.addSimpleHandler("disqus.com", "ident_to_profile", 
    "http://www.disqus.com/people/");
nodemapper.addSimpleHandler("disqus.com", "ident_to_rss", 
    "http://www.disqus.com/people/", "/comments.rss");
var rateitallHandler = function(url, host, path) {
  var handler;
  if (path.match(/\/rss-u-[A-Za-z]/)) {
    handler = nodemapper.createPathRegexpHandler(
     "rateitall.com", /^\/rss-u-([A-Za-z][\w-]*).aspx$/);
  } else if (path.match(/\/rss-u-[0-9]/)) {
    handler = nodemapper.createPathRegexpHandler(
     "rateitall.com", /^\/rss-u-([0-9]+).aspx$/, {keyName: "pk"});
  } else if (path.match(/\/usercommentsrss.aspx\?RI=[A-Za-z]/)) {
    handler = nodemapper.createPathRegexpHandler(
     "rateitall.com", /^\/usercommentsrss.aspx\?RI=([A-Za-z][\w-]*)/);
  } else if (path.match(/\/usercommentsrss.aspx\?RI=[0-9]/)) {
    handler = nodemapper.createPathRegexpHandler(
     "rateitall.com", /^\/usercommentsrss.aspx\?RI=([0-9]+)/, {keyName: "pk"});
  } else {
     handler = nodemapper.createSlashUsernameHandler("rateitall.com");
  }
  return handler(url, host, path);
};
nodemapper.registerDomain("rateitall.com",
  {name: "RateItAll",
   identRegexp: /^(?!rss-)[A-Za-z][\w-]*$/,
   urlToGraphNode: rateitallHandler});
nodemapper.addSimpleHandler("rateitall.com", "ident_to_profile", 
    "http://www.rateitall.com/");
nodemapper.addSimpleHandler("rateitall.com", "pk_to_profile", 
    "http://www.rateitall.com/Profile.aspx?userID=");
nodemapper.addSimpleHandler("rateitall.com", "ident_to_rss", 
    "http://www.rateitall.com/rss-u-", ".aspx");
nodemapper.addSimpleHandler("rateitall.com", "pk_to_rss", 
    "http://www.rateitall.com/rss-u-", ".aspx");
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
nodemapper.registerDomain("mojageneracja.pl",
  {name: "MojaGeneracja",
   urlToGraphNode: nodemapper.createPathRegexpHandler(
   "mojageneracja.pl",
       /^\/(\d+)(?:\/|$)/, {keyName: "pk"})
      });
nodemapper.addSimpleHandler("mojageneracja.pl", "pk_to_profile",
    "http://www.mojageneracja.pl/", "/");
nodemapper.addSimpleHandler("mojageneracja.pl", "pk_to_rss",
    "http://www.mojageneracja.pl/", "/rss");
nodemapper.registerDomain(
    "goodreads.com",
    {name: "goodreads",
     urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
        "user/show", "goodreads.com", {keyName: "pk"})});
nodemapper.addSimpleHandler("goodreads.com", "pk_to_profile",
			    "http://www.goodreads.com/user/show/");
nodemapper.addSimpleHandler("goodreads.com", "pk_to_rss",
			    "http://www.goodreads.com/review/list_rss/");
nodemapper.registerDomain("tripit.com", {
  name: "TripIt",
  identRegexp: /^[-\w\+\.]+$/,
  urlToGraphNode: nodemapper.createPathRegexpHandler(
      "tripit.com", /^\/people\/([-\w\+\.]+)/ )
});
nodemapper.addSimpleHandler("tripit.com", "ident_to_profile",
    "http://tripit.com/people/");
})();
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
(function(){
var stumbleuponCompoundHandler = function(url, host, path) {
  var handler;
  if (host.indexOf('www.') == 0 || host.indexOf('rss.') == 0) {
    if (path.indexOf('syndicate.php') != -1) {
      handler = nodemapper.createPathRegexpHandler("stumbleupon.com",
          /^\/syndicate.php\?stumbler=([^&]+)/);
    } else {
      handler = nodemapper.createSomethingSlashUsernameHandler(
        "(?:user|stumbler)", "stumbleupon.com", {slashAnything:1});
    }
  } else handler = nodemapper.createUserIsSubdomainHandler("stumbleupon.com");
  return handler(url, host, path);
};
nodemapper.registerDomain(
    "stumbleupon.com",
    {name: "StumbleUpon",
     urlToGraphNode: stumbleuponCompoundHandler});
nodemapper.addSimpleHandler("stumbleupon.com", "ident_to_profile", 
    "http://", ".stumbleupon.com");
nodemapper.addSimpleHandler("stumbleupon.com", "ident_to_rss", 
    "http://rss.stumbleupon.com/user/", "/favorites");
})();
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
(function(){
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
(function(){
var FRIENDS_API1_RE = /^\/friends\/ids\/(\w+)\.(?:xml|json)/;
var FRIENDS_API2_RE = /^\/friends\/ids\.(?:xml|json)\?screen_name=(\w+)/;
var HASH_BANG_RE    = /^\/#!\/(\w+)/;
var twitterFallbackHandler = function(url, host, path) {
  var m;
  if ((m = FRIENDS_API1_RE.exec(path)) ||
      (m = FRIENDS_API2_RE.exec(path)) ||
      (m = HASH_BANG_RE.exec(path))) {
    var username = m[1].toLowerCase();
    return "sgn://twitter.com/?ident=" + username;
  }
  return url;
};
var NOT_USERNAMES = {
  "statuses": 1,
  "friends": 1
};
nodemapper.registerDomain(
    "twitter.com",
    { httpsLikeHttp: 1,
      name: "Twitter",
      accountToSgn: { pk: ["twitter.com"], ident: ["twitter.com"] },
      notUsernames: NOT_USERNAMES,
      urlToGraphNode: nodemapper.createSlashUsernameHandler(
          "twitter.com",
          {slashAnything: 1,
           notUsernames: NOT_USERNAMES,
           fallbackHandler: twitterFallbackHandler
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
(function(){
var SOFTWARE_REGEXP = /^\/software\/([\w-]+)/;
var USER_REGEXP = /^\/(\w+)(?:\/|$)/;
var toSgn = function(url, host, path) {
    var m;
    if (m = SOFTWARE_REGEXP.exec(path)) {
        return "sgn://software.wakoopa.com/?ident=" + m[1].toLowerCase();
    }
    if (m = USER_REGEXP.exec(path)) {
        return "sgn://wakoopa.com/?ident=" + m[1].toLowerCase();
    }
    return url;
};
nodemapper.registerDomain("wakoopa.com", {
  name: "Wakoopa",
  urlToGraphNode: toSgn
});
nodemapper.registerDomain("software.wakoopa.com", {
  name: "Wakoopa Software",
  notMassMarketSite: true,
  identRegexp: /^[\w-]+$/
});
nodemapper.addSimpleHandler("wakoopa.com", "ident_to_profile",
    "http://wakoopa.com/");
nodemapper.addSimpleHandler("software.wakoopa.com", "ident_to_profile",
    "http://wakoopa.com/software/");
})();
(function(){
var DOMAIN_RE = /^(?:www\.)?([\w\-]+)\.wordpress\.com$/;
function wordpressHandler(url, host, path) {
  var m = DOMAIN_RE.exec(host);
  var ident = m ? m[1].toLowerCase() : "";
  if (!m || ident == "www" || ident.length == 2 ||
      (ident.length == 5 && ident.substr(2, 1) == "-")) {
    return url;
  }
  return "sgn://wordpress.com/?ident=" + ident;
}
nodemapper.registerDomain(
    "wordpress.com",
    {name: "WordPress",
     skipAutomaticHttpToSgn: true,
     urlToGraphNode: wordpressHandler});
nodemapper.addSimpleHandler("wordpress.com", "ident_to_blog",
			    "http://", ".wordpress.com/");
})();
(function(){
var yelpCompoundHandler = function(url, host, path) {
  var handler;
  if (host.indexOf("www.") == 0 || path.indexOf('user_details') != -1 || path.indexOf('syndicate/user') != -1) {
     handler = nodemapper.createPathRegexpHandler("yelp.com", 
        /^(?:\/user_details\?userid=|\/syndicate\/user\/)([\w\-]+)/, 
        {keyName: "pk", casePreserve: 1});
  } else handler = nodemapper.createUserIsSubdomainHandler("yelp.com");
  return handler(url, host, path);
};
nodemapper.registerDomain("yelp.com", {
	name: "Yelp",
	urlToGraphNode: yelpCompoundHandler,
	pkRegexp: /^(?=\w)[\w-]{22}$/,
        identRegexp: /^[\w\-]+$/
	});
nodemapper.addSimpleHandler("yelp.com", "pk_to_rss", 
    "http://www.yelp.com/syndicate/user/", "/rss.xml");
nodemapper.addSimpleHandler("yelp.com", "pk_to_profile", 
    "http://www.yelp.com/user_details?userid=");
nodemapper.addSimpleHandler("yelp.com", "ident_to_profile",
    "http://", ".yelp.com");
})();
(function(){
var SLASH_WORD_MAYBEWORD = /^\/(\w+)(?:\/(\w+))?(?:\/|$)/;
var SLASH_PK_REGEXP = /\b(\d+\@Z\d\d)\b/;
var userFirstPaths = {
  'people': 1,
  'photos': 1,
  'zipline': 1
};
var userSecondPaths = {
    'fans': 1,
    'statuses': 1,
    'favorites': 1,
    'mutual': 1,
    'with_friends': 1
};
var toSgn = function(url, host, path) {
  var m;
  if (m = SLASH_PK_REGEXP.exec(path)) {
    return  "sgn://zooomr.com/?pk=" + m[1];
  }
  if (!(m = SLASH_WORD_MAYBEWORD.exec(path))) {
    return url;
  }
  if (userFirstPaths[m[1]]) {
    if (!m[2]) {
      return url;
    }
    return "sgn://zooomr.com/?ident=" + m[2].toLowerCase();
  }
  if (!m[2] || userSecondPaths[m[2]] || m[2].substr(0, 4) == "page") {
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

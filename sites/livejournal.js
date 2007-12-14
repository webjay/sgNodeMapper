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
 * Handler for URLs on 'users.' or 'community.' subdomains.
 *
 * @type Function
 */
var urlToGraphNodeUsersCommunity = function(url, host, path) {
  var slashUserMaybeProfile = /^\/(\w+)(?:\/|\/profile|$)/;
  var m;
  if (!(m = slashUserMaybeProfile.exec(path)))
  return url;
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
        return "sgn://livejournal.com/?ident=" + m[2];
      } else {
        return "sgn://livejournal.com/?pk=" + m[2];
      }
    }

    // fall through... couldn't match
    return url;
  }

  var hostparts = host.split(".");
  var user = hostparts[0].replace(/-/g, "_");
  return "sgn://livejournal.com/?ident=" + user;
};


nodemapper.registerDomain("livejournal.com",
                          {urlToGraphNode:urlToGraphNodeGeneral});

__END__

# usernames go in front of livejournal.com
http://brad.livejournal.com/		sgn://livejournal.com/?ident=brad
http://brad.livejournal.com/profile	sgn://livejournal.com/?ident=brad
http://brad.livejournal.com/data/foaf	sgn://livejournal.com/?ident=brad
http://brad.livejournal.com/data/rss    sgn://livejournal.com/?ident=brad
http://brad.livejournal.com/data/atom	sgn://livejournal.com/?ident=brad

content(sgn://livejournal.com/?ident=brad)	http://brad.livejournal.com/

# but underscores map to hyphens:
http://a-b.livejournal.com/		sgn://livejournal.com/?ident=a_b
http://a-b.livejournal.com/profile	sgn://livejournal.com/?ident=a_b
content(sgn://livejournal.com/?ident=a_b)	http://a-b.livejournal.com/

# but leading underscores can't have leading hyphens in domain names, so those
# go to tilde notation (which LJ redirects to community vs. user)
content(sgn://livejournal.com/?ident=_underscores_)	http://www.livejournal.com/~_underscores_/

http://users.livejournal.com/_underscores_/	sgn://livejournal.com/?ident=_underscores_
http://users.livejournal.com/_underscores_/profile sgn://livejournal.com/?ident=_underscores_
http://users.livejournal.com/_underscores_	sgn://livejournal.com/?ident=_underscores_
http://users.livejournal.com/_u_/profile	sgn://livejournal.com/?ident=_u_
http://community.livejournal.com/linux/profile	sgn://livejournal.com/?ident=linux
http://community.livejournal.com/linux/		sgn://livejournal.com/?ident=linux
http://community.livejournal.com/linux		sgn://livejournal.com/?ident=linux
http://www.livejournal.com/~abc/		sgn://livejournal.com/?ident=abc
http://www.livejournal.com/~abc 		sgn://livejournal.com/?ident=abc
http://livejournal.com/~abc/			sgn://livejournal.com/?ident=abc
http://livejournal.com/~abc			sgn://livejournal.com/?ident=abc
http://livejournal.com/users/bob                sgn://livejournal.com/?ident=bob
http://livejournal.com/users/bob/               sgn://livejournal.com/?ident=bob

rss(sgn://livejournal.com/?ident=abc)		http://abc.livejournal.com/data/rss
atom(sgn://livejournal.com/?ident=abc)		http://abc.livejournal.com/data/atom
openid(sgn://livejournal.com/?ident=abc)	http://abc.livejournal.com/
openid(sgn://livejournal.com/?ident=abc)	http://abc.livejournal.com/

# userinfo.bml
http://www.livejournal.com/userinfo.bml?userid=123&t=I sgn://livejournal.com/?pk=123
http://www.livejournal.com/userinfo.bml?userid=123     sgn://livejournal.com/?pk=123
http://www.livejournal.com/userinfo.bml?user=bob       sgn://livejournal.com/?ident=bob
http://www.livejournal.com/userinfo.bml?user=bob&mode=full  sgn://livejournal.com/?ident=bob

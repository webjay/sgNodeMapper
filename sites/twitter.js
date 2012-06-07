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

__END__

http://twitter.com/bob   sgn://twitter.com/?ident=bob
http://twitter.com/Bob   sgn://twitter.com/?ident=bob
http://twitter.com/Bob/   sgn://twitter.com/?ident=bob
http://twitter.com/#!/Bob/ sgn://twitter.com/?ident=bob

https://twitter.com/bob  sgn://twitter.com/?ident=bob
https://twitter.com/BOB/  sgn://twitter.com/?ident=bob
https://twitter.com/#!/Bob/  sgn://twitter.com/?ident=bob

http://explore.twitter.com/bob/with_friends  sgn://twitter.com/?ident=bob
http://greekshow.twitter.com/bob/with_friends  sgn://twitter.com/?ident=bob

profile(sgn://twitter.com/?ident=brad) http://twitter.com/brad
rss(sgn://twitter.com/?ident=brad) http://twitter.com/statuses/user_timeline/brad.rss
atom(sgn://twitter.com/?ident=brad) http://twitter.com/statuses/user_timeline/brad.atom

http://twitter.com/friends/foo  http://twitter.com/friends/foo
http://twitter.com/friends  http://twitter.com/friends

http://twitter.com/statuses/user_timeline/BRAD.rss  sgn://twitter.com/?ident=brad
http://twitter.com/statuses/user_timeline/1234.rss  sgn://twitter.com/?pk=1234

http://twitter.com/friends/ids/bradfitz.xml  sgn://twitter.com/?ident=bradfitz
http://twitter.com/friends/ids/BRADFITZ.json  sgn://twitter.com/?ident=bradfitz
http://twitter.com/friends/ids.xml?screen_name=lisaphillips sgn://twitter.com/?ident=lisaphillips
http://twitter.com/friends/ids.json?screen_name=lisaphillips sgn://twitter.com/?ident=lisaphillips

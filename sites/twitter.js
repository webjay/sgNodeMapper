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

nodemapper.registerDomain(
    "twitter.com",
    { httpsLikeHttp: 1,
      urlToGraphNode: nodemapper.createSlashUsernameHandler(
          "twitter.com",
          {slashAnything:1})});

nodemapper.addSimpleHandler("twitter.com", "ident_to_profile",
    "http://twitter.com/");
nodemapper.addSimpleHandler("twitter.com", "ident_to_rss",
    "http://twitter.com/statuses/user_timeline/", ".rss");
nodemapper.addSimpleHandler("twitter.com", "ident_to_atom",
    "http://twitter.com/statuses/user_timeline/", ".atom");

__END__

http://twitter.com/bob   sgn://twitter.com/?ident=bob
http://twitter.com/Bob   sgn://twitter.com/?ident=bob
http://twitter.com/Bob/   sgn://twitter.com/?ident=bob

https://twitter.com/bob  sgn://twitter.com/?ident=bob
https://twitter.com/BOB/  sgn://twitter.com/?ident=bob

http://explore.twitter.com/bob/with_friends  sgn://twitter.com/?ident=bob
http://greekshow.twitter.com/bob/with_friends  sgn://twitter.com/?ident=bob

profile(sgn://twitter.com/?ident=brad) http://twitter.com/brad
rss(sgn://twitter.com/?ident=brad) http://twitter.com/statuses/user_timeline/brad.rss
atom(sgn://twitter.com/?ident=brad) http://twitter.com/statuses/user_timeline/brad.atom

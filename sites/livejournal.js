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


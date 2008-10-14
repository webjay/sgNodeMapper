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

// $1: first slash word in URL
// $2: second part
var SLASH_WORD_MAYBEWORD = /^\/(\w+)(?:\/(\w+))?(?:\/|$)/;

var SLASH_PK_REGEXP = /\b(\d+\@Z\d\d)\b/;

var toSgn = function(url, host, path) {
  var m;
  if (m = SLASH_PK_REGEXP.exec(path)) {
    return  "sgn://zooomr.com/?pk=" + m[1];
  }
  if (!(m = SLASH_WORD_MAYBEWORD.exec(path))) {
    return url;
  }
  if (m[1] == "people" || m[1] == "photos") {
    if (!m[2]) {
      return url;
    }
    return "sgn://zooomr.com/?ident=" + m[2].toLowerCase();
  }
  if (!m[2]) {
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

__END__

# noop:
http://www.zooomr.com/photos http://www.zooomr.com/photos
http://www.zooomr.com/people/ http://www.zooomr.com/people/

http://www.zooomr.com/photos/jsmarr sgn://zooomr.com/?ident=jsmarr
http://www.zooomr.com/people/jsmarr sgn://zooomr.com/?ident=jsmarr
profile(sgn://zooomr.com/?ident=jsmarr) http://www.zooomr.com/people/jsmarr/
rss(sgn://zooomr.com/?ident=jsmarr) http://www.zooomr.com/services/feeds/public_photos/?id=jsmarr&format=rss_200
content(sgn://zooomr.com/?ident=jsmarr) http://www.zooomr.com/photos/jsmarr/

http://cn.zooomr.com/453@Z01/  sgn://zooomr.com/?pk=453@Z01
rss(sgn://zooomr.com/?pk=453@Z01)  http://www.zooomr.com/services/feeds/public_photos/?id=453@Z01&format=rss_200
profile(sgn://zooomr.com/?pk=453@Z01)  http://www.zooomr.com/people/453@Z01/

http://cn.zooomr.com/photos/jsmarr sgn://zooomr.com/?ident=jsmarr
http://de.zooomr.com/photos/jsmarr sgn://zooomr.com/?ident=jsmarr
http://es.zooomr.com/photos/jsmarr sgn://zooomr.com/?ident=jsmarr
http://it.zooomr.com/photos/jsmarr sgn://zooomr.com/?ident=jsmarr
http://jp.zooomr.com/photos/jsmarr sgn://zooomr.com/?ident=jsmarr
http://pt-br.zooomr.com/photos/jsmarr sgn://zooomr.com/?ident=jsmarr

http://cn.zooomr.com/anniebluesky sgn://zooomr.com/?ident=anniebluesky
http://de.zooomr.com/5uspect      sgn://zooomr.com/?ident=5uspect
http://de.zooomr.com/bear11       sgn://zooomr.com/?ident=bear11

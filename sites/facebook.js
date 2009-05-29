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

var FACEBOOK_ALT_DOMAINS = [
    "facebook.at",
    "facebook.ca",
    "facebook.de",
    "facebook.dk",
    "facebook.es",
    "facebook.jp",
    "facebook.no",
    "facebook.pl",
    "facebook.se",
    "facebook.vn"
];

var facebookHandler = function(url, host, path) {
  var m;
  var slashProfile = /^(?:\/home\.php\#)?\/profile\.php\?id=(\d+)/;
  if (m = slashProfile.exec(path)) {
    return "sgn://facebook.com/?pk=" + m[1];
  }
  var publicProfile = /^\/(?:p|people)\/([^\/]+\/(\d+))/;
  if (m = publicProfile.exec(path)) {
    return "sgn://facebook.com/?ident=" + m[1];
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
     ident_to_profile: function (ident) { return "http://www.facebook.com/people/" + ident },
     pk_to_profile: function (pk) { return "http://www.facebook.com/profile.php?id=" + pk; },
     pkRegexp: /^\d+$/,
     identRegexp: /^.+\/\d+$/,
     identCasePreserve: 1
     });

__END__

http://www.facebook.com/profile.php?id=500033387   sgn://facebook.com/?pk=500033387
http://fr.facebook.com/profile.php?id=500033387   sgn://facebook.com/?pk=500033387
http://fr.facebook.ca/profile.php?id=500033387   sgn://facebook.com/?pk=500033387
http://www.facebook.com/people/Brad_Fitzpatrick/500033387 sgn://facebook.com/?ident=Brad_Fitzpatrick/500033387
http://www.facebook.com/p/Brad_Fitzpatrick/500033387 sgn://facebook.com/?ident=Brad_Fitzpatrick/500033387
http://facebook.com/p/Brad_Fitzpatrick/500033387 sgn://facebook.com/?ident=Brad_Fitzpatrick/500033387

http://washington.facebook.com/profile.php?id=123&ref=np  sgn://facebook.com/?pk=123

profile(sgn://facebook.com/?pk=500033387)	http://www.facebook.com/profile.php?id=500033387
profile(sgn://facebook.com/?ident=Brad_Fitzpatrick/500033387)	http://www.facebook.com/people/Brad_Fitzpatrick/500033387

http://www.new.facebook.com/people/Foo_Bar/123  sgn://facebook.com/?ident=Foo_Bar/123
http://www.new.facebook.com/home.php#/profile.php?id=123 sgn://facebook.com/?pk=123

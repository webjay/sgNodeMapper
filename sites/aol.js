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
 * Regular expression for AOL's aim: URL scheme.
 *
 * @type RegExp
 */
var AIM_REGEX = /^aim:(?:goim\?screenname=)?([\w \+]+)/i;


nodemapper.registerNonHTTPHandler(function(url) {
  var m = AIM_REGEX.exec(url);
  if (m) {
    var screenname = m[1].toLowerCase().replace(/[\s\+]/g, "");
    return "sgn://aol.com/?ident=" + screenname;
  }
});


nodemapper.registerDomain("openid.aol.com", {
 urlToGraphNode: nodemapper.createSlashUsernameHandler("aol.com"),
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

__END__

aim:GoIM?screenname=fooBar			sgn://aol.com/?ident=foobar
aim:goim?Screenname=foo+Bar			sgn://aol.com/?ident=foobar
aim:fooBar					sgn://aol.com/?ident=foobar
aim:foo+Bar					sgn://aol.com/?ident=foobar
http://www.aimpages.com/foobar/profile.html	sgn://aol.com/?ident=foobar
http://www.aimpages.com//foobar/profile.html	sgn://aol.com/?ident=foobar
http://www.aimpages.com/foobar/		sgn://aol.com/?ident=foobar
http://www.aimpages.com/foo+bar/		sgn://aol.com/?ident=foobar
http://www.aimpages.com/foobar		sgn://aol.com/?ident=foobar
http://openid.aol.com/foobar			sgn://aol.com/?ident=foobar
http://openid.aol.com/foobar/		sgn://aol.com/?ident=foobar

openid(sgn://aol.com/?ident=foobar)		http://openid.aol.com/foobar
chat(sgn://aol.com/?ident=foobar)		aim:GoIM?screenname=foobar
profile(sgn://aol.com/?ident=foobar)		http://www.aimpages.com/foobar/profile.html

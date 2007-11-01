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

var AOL_RE = /^aim:(?:goim\?screenname=)?([\w \+]+)/i;

NodeMapper.registerNonHTTPHandler(function (url) {
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

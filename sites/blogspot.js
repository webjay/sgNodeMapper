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
 * Regular expression for blogspot domain names, with optional
 * "www." at front, and then blogname, then blogspot.com, capturing
 * the blog name.
 *
 * @type RegExp
 */
var BLOGSPOT_RE = /^(?:www\.)?([\w\-]+)\.blogspot\.com$/;

registerDomain("blogspot.com", {
  urlToGraphNode: createHostRegexpHandler("blogspot.com", BLOGSPOT_RE),
});

__END__

http://foo.blogspot.com/          sgn://blogspot.com/?ident=foo
http://www.foo.blogspot.com/      sgn://blogspot.com/?ident=foo
http://foo.blogspot.com/path/blah sgn://blogspot.com/?ident=foo

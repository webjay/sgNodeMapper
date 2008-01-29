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
var BLOGSPOT_REGEX = /^(?:www\.)?([\w\-]+)\.blogspot\.com$/;

nodemapper.registerDomain("blogspot.com", {
  urlToGraphNode: nodemapper.createHostRegexpHandler("blogspot.com",
                                                     BLOGSPOT_REGEX)
});

nodemapper.addSimpleHandler("blogspot.com", "ident_to_blog",
			    "http://", ".blogspot.com/");
nodemapper.addSimpleHandler("blogspot.com", "ident_to_content",
			    "http://", ".blogspot.com/");


__END__

http://foo.blogspot.com/          sgn://blogspot.com/?ident=foo
http://www.foo.blogspot.com/      sgn://blogspot.com/?ident=foo
http://foo.blogspot.com/path/blah sgn://blogspot.com/?ident=foo

content(sgn://blogspot.com/?ident=foo) http://foo.blogspot.com/
blog(sgn://blogspot.com/?ident=foo)    http://foo.blogspot.com/

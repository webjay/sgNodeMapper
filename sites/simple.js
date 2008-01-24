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
    "digg.com",
    {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
        "users",
        "digg.com")});

nodemapper.addSimpleHandler("digg.com", "ident_to_profile",
			    "http://digg.com/users/", "/");

nodemapper.registerDomain(
    "pownce.com",
    {urlToGraphNode: nodemapper.createSlashUsernameHandler(
        "pownce.com",
        { slashAnything: 1 })});

nodemapper.registerDomain(
    "jaiku.com",
    {urlToGraphNode: nodemapper.createUserIsSubdomainHandler("jaiku.com")});

nodemapper.registerDomain(
    "mugshot.org",
    {urlToGraphNode: nodemapper.createPathRegexpHandler(
        "mugshot.org",
        /^\/person\?who=(\w+)/,
        {casePreserve: 1})});

nodemapper.registerDomain(
    "linkedin.com",
    {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
        "in",
        "linkedin.com")});

nodemapper.registerDomain(
    "ma.gnolia.com",
    {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
        "people",
        "ma.gnolia.com")});

nodemapper.registerDomain(
    "ziki.com",
    {urlToGraphNode: nodemapper.createPathRegexpHandler(
        "ziki.com",
        /^\/\w\w\/people\/(\w+)\/?/)});

nodemapper.registerDomain(
    "wordpress.com",
    {urlToGraphNode: nodemapper.createHostRegexpHandler(
        "wordpress.com",
        /^(?:www\.)?([\w\-]+)\.wordpress\.com$/)});

__END__

http://digg.com/users/foobar	sgn://digg.com/?ident=foobar
http://digg.com/users/foobar/	sgn://digg.com/?ident=foobar
profile(sgn://digg.com/?ident=foobar)	http://digg.com/users/foobar/

http://pownce.com/a   sgn://pownce.com/?ident=a
http://pownce.com/A   sgn://pownce.com/?ident=a
http://pownce.com/A/   sgn://pownce.com/?ident=a
http://pownce.com/A/public/   sgn://pownce.com/?ident=a
http://pownce.com/A/public/with_friends   sgn://pownce.com/?ident=a

http://bradfitz.jaiku.com/   sgn://jaiku.com/?ident=bradfitz
http://BRADFITZ.JAIKU.COM/   sgn://jaiku.com/?ident=bradfitz

http://linkedin.com/in/foobar	sgn://linkedin.com/?ident=foobar
http://linkedin.com/in/foobar/	sgn://linkedin.com/?ident=foobar
http://www.linkedin.com/in/foobar/	sgn://linkedin.com/?ident=foobar

# TODO(bradfitz): pk URLs for these types:
# http://www.linkedin.com/pub/5/512/39a

http://ma.gnolia.com/people/daveman692	sgn://ma.gnolia.com/?ident=daveman692
http://ma.gnolia.com/people/daveman692/	sgn://ma.gnolia.com/?ident=daveman692

# case sensitive identifiers!
http://mugshot.org/person?who=7ACcH9gn7zv4YG  sgn://mugshot.org/?ident=7ACcH9gn7zv4YG

http://www.ziki.com/en/people/bob   sgn://ziki.com/?ident=bob
http://www.ziki.com/fr/people/bob/  sgn://ziki.com/?ident=bob
http://www.ziki.com/fr/people/bob/extrastuff sgn://ziki.com/?ident=bob

http://foo.wordpress.com/  sgn://wordpress.com/?ident=foo
http://www.foo.wordpress.com/  sgn://wordpress.com/?ident=foo

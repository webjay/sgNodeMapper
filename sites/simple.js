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
nodemapper.addSimpleHandler("digg.com", "ident_to_rss",
			    "http://digg.com/rss/", "/index2.xml");

nodemapper.registerDomain(
    "pownce.com",
    {urlToGraphNode: nodemapper.createSlashUsernameHandler(
        "pownce.com",
        { slashAnything: 1 })});
nodemapper.addSimpleHandler("pownce.com", "ident_to_profile", 
    "http://pownce.com/");

nodemapper.registerDomain(
    "jaiku.com",
    {urlToGraphNode: nodemapper.createUserIsSubdomainHandler("jaiku.com")});
nodemapper.addSimpleHandler("jaiku.com", "ident_to_profile", 
    "http://", ".jaiku.com/");
nodemapper.addSimpleHandler("jaiku.com", "ident_to_rss", 
    "http://", ".jaiku.com/feed/rss");

nodemapper.registerDomain(
    "mugshot.org",
    {urlToGraphNode: nodemapper.createPathRegexpHandler(
        "mugshot.org",
        /^\/person\?who=(\w+)/,
        {casePreserve: 1})});

nodemapper.addSimpleHandler("mugshot.org", "ident_to_profile",
			    "http://mugshot.org/person?who=", "");

nodemapper.registerDomain(
    "linkedin.com",
    {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
        "in",
        "linkedin.com")});

nodemapper.addSimpleHandler("linkedin.com", "ident_to_profile",
			    "http://www.linkedin.com/in/", "");

nodemapper.registerDomain(
    "ma.gnolia.com",
    {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
        "people",
        "ma.gnolia.com")});
nodemapper.addSimpleHandler("ma.gnolia.com", "ident_to_profile", 
    "http://ma.gnolia.com/people/");
nodemapper.addSimpleHandler("ma.gnolia.com", "ident_to_rss", 
    "http://ma.gnolia.com/rss/full/people/");

nodemapper.registerDomain(
    "ziki.com",
    {urlToGraphNode: nodemapper.createPathRegexpHandler(
        "ziki.com",
        /^\/\w\w\/people\/(\w+)\/?/)});

nodemapper.addSimpleHandler("ziki.com", "ident_to_profile",
			    "http://www.ziki.com/people/", "");

nodemapper.registerDomain(
    "wordpress.com",
    {urlToGraphNode: nodemapper.createHostRegexpHandler(
        "wordpress.com",
        /^(?:www\.)?([\w\-]+)\.wordpress\.com$/)});

nodemapper.addSimpleHandler("wordpress.com", "ident_to_blog",
			    "http://", ".wordpress.com/");

nodemapper.registerDomain(
    "picasaweb.google.com",
    {urlToGraphNode: nodemapper.createSlashUsernameHandler(
        "picasaweb.google.com")});
nodemapper.addSimpleHandler("picasaweb.google.com", "ident_to_profile", 
    "http://picasaweb.google.com/");
nodemapper.addSimpleHandler("picasaweb.google.com", "ident_to_rss", 
    "http://picasaweb.google.com/data/feed/base/user/", 
    "?kind=album&alt=rss&hl=en_US&access=public");

nodemapper.registerDomain(
    ["del.icio.us", "delicious.com"],
    {urlToGraphNode: nodemapper.createSlashUsernameHandler("del.icio.us")});
nodemapper.addSimpleHandler("del.icio.us", "ident_to_profile", 
    "http://del.icio.us/");
nodemapper.addSimpleHandler("del.icio.us", "ident_to_rss", 
    "http://del.icio.us/rss/");


nodemapper.registerDomain("community.webshots.com",
  {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler("user", 
      "webshots.com")});
nodemapper.addSimpleHandler("webshots.com", "ident_to_profile", 
    "http://community.webshots.com/user/");
nodemapper.addSimpleHandler("webshots.com", "ident_to_rss", 
    "http://community.webshots.com/rss?contentType=rss&type=user&value=");

nodemapper.registerDomain(
    "smugmug.com",
    {urlToGraphNode: nodemapper.createUserIsSubdomainHandler("smugmug.com")});
nodemapper.addSimpleHandler("smugmug.com", "ident_to_profile", 
    "http://", ".smugmug.com/");
nodemapper.addSimpleHandler("smugmug.com", "ident_to_atom", 
    "http://www.smugmug.com/hack/feed.mg?Type=nicknameRecentPhotos&Data=", 
    "&format=atom03");

nodemapper.registerDomain(
    "vox.com",
    {urlToGraphNode: nodemapper.createUserIsSubdomainHandler("vox.com")});
nodemapper.addSimpleHandler("vox.com", "ident_to_content", 
    "http://", ".vox.com/");
nodemapper.addSimpleHandler("vox.com", "ident_to_profile",
    "http://", ".vox.com/profile/");
nodemapper.addSimpleHandler("vox.com", "ident_to_rss",
    "http://", ".vox.com/library/rss-full.xml");
nodemapper.addSimpleHandler("vox.com", "ident_to_atom",
    "http://", ".vox.com/library/atom-full.xml");
nodemapper.addSimpleHandler("vox.com", "ident_to_foaf",
    "http://", ".vox.com/profile/foaf.rdf");

nodemapper.registerDomain(
    "tumblr.com",
    {urlToGraphNode: nodemapper.createUserIsSubdomainHandler("tumblr.com")});
nodemapper.addSimpleHandler("tumblr.com", "ident_to_profile", 
    "http://", ".tumblr.com/");
nodemapper.addSimpleHandler("tumblr.com", "ident_to_rss", 
    "http://", ".tumblr.com/rss");

nodemapper.registerDomain(
    "xanga.com",
    {urlToGraphNode: nodemapper.createSlashUsernameHandler(
        "xanga.com", { slashAnything: 1 })});
nodemapper.addSimpleHandler("xanga.com", "ident_to_profile", 
    "http://xanga.com/");
nodemapper.addSimpleHandler("xanga.com", "ident_to_rss", 
    "http://xanga.com/", "/rss");

nodemapper.registerDomain(
    "360.yahoo.com",
    {urlToGraphNode: nodemapper.createSlashUsernameHandler(
        "360.yahoo.com", { slashAnything: 1 })});
nodemapper.addSimpleHandler("360.yahoo.com", "ident_to_profile", 
    "http://360.yahoo.com/");
nodemapper.addSimpleHandler("360.yahoo.com", "ident_to_rss", 
    "http://blog.360.yahoo.com/");

nodemapper.registerDomain(
    "spaces.live.com",
    {urlToGraphNode: nodemapper.createUserIsSubdomainHandler(
        "spaces.live.com")});
nodemapper.addSimpleHandler("spaces.live.com", "ident_to_profile", 
    "http://", ".spaces.live.com");
nodemapper.addSimpleHandler("spaces.live.com", "ident_to_rss", 
    "http://", ".spaces.live.com/feed.rss");

nodemapper.registerDomain(
    "stumbleupon.com",
    {urlToGraphNode: nodemapper.createUserIsSubdomainHandler(
        "stumbleupon.com")});
nodemapper.addSimpleHandler("stumbleupon.com", "ident_to_profile", 
    "http://", ".stumbleupon.com");
nodemapper.addSimpleHandler("stumbleupon.com", "ident_to_rss", 
    "http://www.stumbleupon.com/syndicate.php?stumbler=");

nodemapper.registerDomain(
    "travelpod.com",
    {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
        "members", "travelpod.com")});
nodemapper.addSimpleHandler("travelpod.com", "ident_to_profile",
			    "http://travelpod.com/members/");
nodemapper.addSimpleHandler("travelpod.com", "ident_to_rss",
			    "http://travelpod.com/syndication/rss/");

nodemapper.registerDomain(
    "imageshack.us",
    {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
        "user", "imageshack.us")});
nodemapper.addSimpleHandler("imageshack.us", "ident_to_profile",
			    "http://profile.imageshack.us/user/");
nodemapper.addSimpleHandler("imageshack.us", "ident_to_rss",
			    "http://rss.imageshack.us/user/", "/rss/");

nodemapper.registerDomain("bloglines.com",
  {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
      "(?:blog|public)", "bloglines.com", {slashAnything: 1})});
nodemapper.addSimpleHandler("bloglines.com", "ident_to_profile", 
    "http://www.bloglines.com/blog/");
nodemapper.addSimpleHandler("bloglines.com", "ident_to_rss", 
    "http://www.bloglines.com/blog/", "/rss");

upcomingHandler = nodemapper.createSomethingSlashUsernameHandler("user", 
    "upcoming.yahoo.com", {keyName: "pk"});
nodemapper.registerDomain("upcoming.yahoo.com",
  {urlToGraphNode: upcomingHandler});
nodemapper.registerDomain("upcoming.org",
  {urlToGraphNode: upcomingHandler});
nodemapper.addSimpleHandler("upcoming.yahoo.com", "pk_to_profile", 
    "http://upcoming.yahoo.com/user/", "/");
nodemapper.addSimpleHandler("upcoming.yahoo.com", "pk_to_rss", 
    "http://upcoming.yahoo.com/syndicate/v2/my_events/");

nodemapper.registerDomain("socializr.com",
  {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
      "user", "socializr.com")});
nodemapper.addSimpleHandler("socializr.com", "ident_to_profile", 
    "http://www.socializr.com/user/");
nodemapper.addSimpleHandler("socializr.com", "ident_to_rss", 
    "http://www.socializr.com/rss/user/", "/rss.xml");

nodemapper.registerDomain("bebo.com",
  {urlToGraphNode: nodemapper.createPathRegexpHandler(
      "bebo.com", /^\/Profile.jsp\?MemberId=([^&]*)/)});
nodemapper.addSimpleHandler("bebo.com", "ident_to_profile", 
    "http://bebo.com/Profile.jsp?MemberId=");
nodemapper.addSimpleHandler("bebo.com", "ident_to_rss", 
    "http://bebo.com/api/BlogRss.jsp?MemberId=");

nodemapper.registerDomain("reddit.com",
  {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
      "user", "reddit.com", {slashAnything: 1})});
nodemapper.addSimpleHandler("reddit.com", "ident_to_profile", 
    "http://reddit.com/user/");
nodemapper.addSimpleHandler("reddit.com", "ident_to_rss", 
    "http://reddit.com/user/", "/submitted.rss");

nodemapper.registerDomain("ilike.com",
  {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
      "user", "ilike.com", {slashAnything: 1})});
nodemapper.addSimpleHandler("ilike.com", "ident_to_profile", 
    "http://www.ilike.com/user/");
nodemapper.addSimpleHandler("ilike.com", "ident_to_rss", 
    "http://www.ilike.com/user/", "/songs_ilike.rss");

nodemapper.registerDomain("zooomr.com",
  {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
      "(?:photos|people)", "zooomr.com", {slashAnything: 1})});
nodemapper.addSimpleHandler("zooomr.com", "ident_to_profile", 
    "http://www.zooomr.com/people/");
nodemapper.addSimpleHandler("zooomr.com", "ident_to_rss", 
    "http://www.zooomr.com/services/feeds/public_photos/?id=", 
    "&format=rss_200");

nodemapper.registerDomain(
    "multiply.com",
    {urlToGraphNode: nodemapper.createUserIsSubdomainHandler("multiply.com")});
nodemapper.addSimpleHandler("multiply.com", "ident_to_profile", 
    "http://", ".multiply.com/");
nodemapper.addSimpleHandler("multiply.com", "ident_to_rss", 
    "http://", ".multiply.com/feed.rss");

nodemapper.registerDomain(
    "dopplr.com",
    {urlToGraphNode: nodemapper.createSomethingSlashUsernameHandler(
        "traveller", "dopplr.com")});
nodemapper.addSimpleHandler("dopplr.com", "ident_to_profile",
			    "http://www.dopplr.com/traveller/", "");

__END__

http://digg.com/users/foobar	sgn://digg.com/?ident=foobar
http://digg.com/users/foobar/	sgn://digg.com/?ident=foobar
profile(sgn://digg.com/?ident=foobar)	http://digg.com/users/foobar/
rss(sgn://digg.com/?ident=foobar)	http://digg.com/rss/foobar/index2.xml

http://pownce.com/a   sgn://pownce.com/?ident=a
http://pownce.com/A   sgn://pownce.com/?ident=a
http://pownce.com/A/   sgn://pownce.com/?ident=a
http://pownce.com/A/public/   sgn://pownce.com/?ident=a
http://pownce.com/A/public/with_friends   sgn://pownce.com/?ident=a
profile(sgn://pownce.com/?ident=a) http://pownce.com/a

http://bradfitz.jaiku.com/   sgn://jaiku.com/?ident=bradfitz
http://BRADFITZ.JAIKU.COM/   sgn://jaiku.com/?ident=bradfitz
profile(sgn://jaiku.com/?ident=bradfitz) http://bradfitz.jaiku.com/
rss(sgn://jaiku.com/?ident=bradfitz) http://bradfitz.jaiku.com/feed/rss

http://linkedin.com/in/foobar	sgn://linkedin.com/?ident=foobar
http://linkedin.com/in/foobar/	sgn://linkedin.com/?ident=foobar
http://www.linkedin.com/in/foobar/	sgn://linkedin.com/?ident=foobar
http://www.linkedin.com/in/foobar	sgn://linkedin.com/?ident=foobar
profile(sgn://linkedin.com/?ident=foobar)  http://www.linkedin.com/in/foobar

# TODO(bradfitz): pk URLs for these types:
# http://www.linkedin.com/pub/5/512/39a

http://ma.gnolia.com/people/daveman692	sgn://ma.gnolia.com/?ident=daveman692
http://ma.gnolia.com/people/daveman692/	sgn://ma.gnolia.com/?ident=daveman692
profile(sgn://ma.gnolia.com/?ident=daveman692) http://ma.gnolia.com/people/daveman692
rss(sgn://ma.gnolia.com/?ident=daveman692) http://ma.gnolia.com/rss/full/people/daveman692

# case sensitive identifiers!
http://mugshot.org/person?who=7ACcH9gn7zv4YG  sgn://mugshot.org/?ident=7ACcH9gn7zv4YG
profile(sgn://mugshot.org/?ident=7ACcH9gn7zv4YG)  http://mugshot.org/person?who=7ACcH9gn7zv4YG

http://www.ziki.com/en/people/bob   sgn://ziki.com/?ident=bob
http://www.ziki.com/fr/people/bob/  sgn://ziki.com/?ident=bob
http://www.ziki.com/fr/people/bob/extrastuff sgn://ziki.com/?ident=bob
profile(sgn://ziki.com/?ident=bob)  http://www.ziki.com/people/bob

http://foo.wordpress.com/  sgn://wordpress.com/?ident=foo
http://www.foo.wordpress.com/  sgn://wordpress.com/?ident=foo
blog(sgn://wordpress.com/?ident=foo) http://foo.wordpress.com/

http://picasaweb.google.com/jsmarr	sgn://picasaweb.google.com/?ident=jsmarr
profile(sgn://picasaweb.google.com/?ident=jsmarr) http://picasaweb.google.com/jsmarr
rss(sgn://picasaweb.google.com/?ident=jsmarr) http://picasaweb.google.com/data/feed/base/user/jsmarr?kind=album&alt=rss&hl=en_US&access=public

http://del.icio.us/jsmarr	sgn://del.icio.us/?ident=jsmarr
http://delicious.com/jsmarr	sgn://del.icio.us/?ident=jsmarr
profile(sgn://del.icio.us/?ident=jsmarr)	http://del.icio.us/jsmarr
rss(sgn://del.icio.us/?ident=jsmarr)	http://del.icio.us/rss/jsmarr

http://community.webshots.com/user/bob sgn://webshots.com/?ident=bob
profile(sgn://webshots.com/?ident=bob) http://community.webshots.com/user/bob
rss(sgn://webshots.com/?ident=bob) http://community.webshots.com/rss?contentType=rss&type=user&value=bob

http://jsmarr.smugmug.com sgn://smugmug.com/?ident=jsmarr
profile(sgn://smugmug.com/?ident=jsmarr) http://jsmarr.smugmug.com/
atom(sgn://smugmug.com/?ident=jsmarr) http://www.smugmug.com/hack/feed.mg?Type=nicknameRecentPhotos&Data=jsmarr&format=atom03

http://bradfitz.tumblr.com/   sgn://tumblr.com/?ident=bradfitz
profile(sgn://tumblr.com/?ident=bradfitz) http://bradfitz.tumblr.com/
rss(sgn://tumblr.com/?ident=bradfitz) http://bradfitz.tumblr.com/rss

http://xanga.com/a/   sgn://xanga.com/?ident=a
profile(sgn://xanga.com/?ident=a) http://xanga.com/a
rss(sgn://xanga.com/?ident=a) http://xanga.com/a/rss

http://360.yahoo.com/a/   sgn://360.yahoo.com/?ident=a
profile(sgn://360.yahoo.com/?ident=a) http://360.yahoo.com/a
rss(sgn://360.yahoo.com/?ident=a) http://blog.360.yahoo.com/a

http://bradfitz.spaces.live.com/   sgn://spaces.live.com/?ident=bradfitz
profile(sgn://spaces.live.com/?ident=bradfitz) http://bradfitz.spaces.live.com
rss(sgn://spaces.live.com/?ident=bradfitz) http://bradfitz.spaces.live.com/feed.rss

http://bradfitz.stumbleupon.com/   sgn://stumbleupon.com/?ident=bradfitz
profile(sgn://stumbleupon.com/?ident=bradfitz) http://bradfitz.stumbleupon.com
rss(sgn://stumbleupon.com/?ident=bradfitz) http://www.stumbleupon.com/syndicate.php?stumbler=bradfitz

http://www.travelpod.com/members/foobar	sgn://travelpod.com/?ident=foobar
http://travelpod.com/members/foobar/	sgn://travelpod.com/?ident=foobar
profile(sgn://travelpod.com/?ident=foobar)	http://travelpod.com/members/foobar
rss(sgn://travelpod.com/?ident=foobar)	http://travelpod.com/syndication/rss/foobar

http://www.imageshack.us/user/foobar	sgn://imageshack.us/?ident=foobar
http://imageshack.us/user/foobar/	sgn://imageshack.us/?ident=foobar
profile(sgn://imageshack.us/?ident=foobar)	http://profile.imageshack.us/user/foobar
rss(sgn://imageshack.us/?ident=foobar)	http://rss.imageshack.us/user/foobar/rss/

http://www.bloglines.com/blog/jsmarr sgn://bloglines.com/?ident=jsmarr
http://www.bloglines.com/blog/jsmarr/rss sgn://bloglines.com/?ident=jsmarr
http://www.bloglines.com/public/jsmarr sgn://bloglines.com/?ident=jsmarr
profile(sgn://bloglines.com/?ident=jsmarr) http://www.bloglines.com/blog/jsmarr
rss(sgn://bloglines.com/?ident=jsmarr) http://www.bloglines.com/blog/jsmarr/rss

http://upcoming.yahoo.com/user/75587/ sgn://upcoming.yahoo.com/?pk=75587
# upcoming.org redirects to upcoming.yahoo.com but some ppl still use it
http://upcoming.org/user/75587/ sgn://upcoming.yahoo.com/?pk=75587
profile(sgn://upcoming.yahoo.com/?pk=75587) http://upcoming.yahoo.com/user/75587/
rss(sgn://upcoming.yahoo.com/?pk=75587) http://upcoming.yahoo.com/syndicate/v2/my_events/75587

http://www.socializr.com/user/jsmarr sgn://socializr.com/?ident=jsmarr
profile(sgn://socializr.com/?ident=jsmarr) http://www.socializr.com/user/jsmarr
rss(sgn://socializr.com/?ident=jsmarr) http://www.socializr.com/rss/user/jsmarr/rss.xml

http://bebo.com/Profile.jsp?MemberId=jsmarr sgn://bebo.com/?ident=jsmarr
profile(sgn://bebo.com/?ident=jsmarr) http://bebo.com/Profile.jsp?MemberId=jsmarr
rss(sgn://bebo.com/?ident=jsmarr) http://bebo.com/api/BlogRss.jsp?MemberId=jsmarr

http://reddit.com/user/jsmarr sgn://reddit.com/?ident=jsmarr
http://reddit.com/user/jsmarr/submitted.rss sgn://reddit.com/?ident=jsmarr
profile(sgn://reddit.com/?ident=jsmarr) http://reddit.com/user/jsmarr
rss(sgn://reddit.com/?ident=jsmarr) http://reddit.com/user/jsmarr/submitted.rss 

http://www.ilike.com/user/jsmarr sgn://ilike.com/?ident=jsmarr
http://ilike.com/user/jsmarr/songs_ilike.rss sgn://ilike.com/?ident=jsmarr
profile(sgn://ilike.com/?ident=jsmarr) http://www.ilike.com/user/jsmarr
rss(sgn://ilike.com/?ident=jsmarr) http://www.ilike.com/user/jsmarr/songs_ilike.rss 

http://www.zooomr.com/photos/jsmarr sgn://zooomr.com/?ident=jsmarr
http://www.zooomr.com/people/jsmarr sgn://zooomr.com/?ident=jsmarr
profile(sgn://zooomr.com/?ident=jsmarr) http://www.zooomr.com/people/jsmarr
rss(sgn://zooomr.com/?ident=jsmarr) http://www.zooomr.com/services/feeds/public_photos/?id=jsmarr&format=rss_200

http://bradfitz.multiply.com/   sgn://multiply.com/?ident=bradfitz
profile(sgn://multiply.com/?ident=bradfitz) http://bradfitz.multiply.com/
rss(sgn://multiply.com/?ident=bradfitz) http://bradfitz.multiply.com/feed.rss

http://btrott.vox.com/   sgn://vox.com/?ident=btrott
http://btrott.vox.com/profile/foaf.rdf   sgn://vox.com/?ident=btrott
http://btrott.vox.com/profile/ sgn://vox.com/?ident=btrott
http://btrott.vox.com/library/audio/6a00b8ea0714f01bc000e398d429800003.html sgn://vox.com/?ident=btrott

profile(sgn://vox.com/?ident=btrott)  http://btrott.vox.com/profile/
foaf(sgn://vox.com/?ident=btrott)  http://btrott.vox.com/profile/foaf.rdf
atom(sgn://vox.com/?ident=btrott)  http://btrott.vox.com/library/atom-full.xml
rss(sgn://vox.com/?ident=btrott)  http://btrott.vox.com/library/rss-full.xml

http://www.dopplr.com/traveller/bradfitz/           sgn://dopplr.com/?ident=bradfitz
http://dopplr.com/traveller/bradfitz/               sgn://dopplr.com/?ident=bradfitz
http://www.dopplr.com/traveller/bradfitz            sgn://dopplr.com/?ident=bradfitz
http://www.dopplr.com/traveller/bradfitz/something  sgn://dopplr.com/?ident=bradfitz

profile(sgn://dopplr.com/?ident=bradfitz) http://www.dopplr.com/traveller/bradfitz


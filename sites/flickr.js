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

function urlToGraphNode_Flickr(url, host, uri) {
  var flickerUriRE = /^\/(?:people|photos)\/(\d+@\w+)\/?$/;
  var m = flickerUriRE.exec(uri);
  return m ? "sgn://flickr.com/?pk=" + m[1] : uri;
};

registerDomain("flickr.com", {
 urlToGraphNode: commonPatternSomethingSlashUsername("(?:people|photos)",
                                                     "flickr.com", {
                                                    fallback_func: urlToGraphNode_Flickr,
                                                   }),
});

__END__

http://www.flickr.com/people/crucially		sgn://flickr.com/?ident=crucially
http://www.flickr.com/people/crucially/		sgn://flickr.com/?ident=crucially
http://www.flickr.com/photos/crucially		sgn://flickr.com/?ident=crucially
http://www.flickr.com/photos/crucially/		sgn://flickr.com/?ident=crucially

http://www.flickr.com/photos/15738836@N00/      sgn://flickr.com/?pk=15738836@N00
http://www.flickr.com/people/15738836@N00/ 	sgn://flickr.com/?pk=15738836@N00

profile(sgn://flickr.com/?ident=crucially)	http://www.flickr.com/people/crucially/
content(sgn://flickr.com/?ident=crucially)	http://www.flickr.com/photos/crucially/
addfriend(sgn://flickr.com/?ident=crucially)	http://www.flickr.com/people/crucially/relationship/

rss(sgn://flicker.com/?pk=15738836@N00)		http://api.flickr.com/services/feeds/photos_public.gne?id=15738836@N00&lang=en-us&format=rss_200
atom(sgn://flicker.com/?pk=15738836@N00)	http://api.flickr.com/services/feeds/photos_public.gne?id=15738836@N00&lang=en-us&format=atom

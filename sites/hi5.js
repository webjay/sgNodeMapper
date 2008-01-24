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


function urlToGraphNodeHi5(url, host, path) {
  return url;
}

nodemapper.registerDomain(
  "hi5.com", {
  urlToGraphNode: urlToGraphNodeHi5,
});

__END__

#KNOWN_FAILING:
#http://api.hi5.com/rest/profile/foaf/87628233   sgn://hi5.com/?pk=87628233

#KNOWN_FAILING:
#http://lindner.hi5.com/                         sgn://hi5.com/?ident=lindner

#KNOWN_FAILING:
#http://www.hi5.com/friend/profile/displayProfile.do?userid=127525866  sgn://hi5.com/?pk=127525866

#KNOWN_FAILING:
#http://lindner.hi5.com/friend/profile/displayJournal.do?viewother=true&ownerId=87628233  sgn://hi5.com/?pk=87628233
#KNOWN_FAILING:
#http://lindner.hi5.com/friend/photos/displayUserAlbum.do?viewother=true&ownerId=87628233 sgn://hi5.com/?pk=87628233
#http://bradfitz.hi5.com/friend/photos/displayUserAlbum.do?viewother=true&ownerId=87628233 sgn://hi5.com/?pk=87628233

#KNOWN_FAILING:
#http://lindner.hi5.com/friend/87628233--Paul--Profile-html  sgn://hi5.com/?pk=87628233
#http://bradfitz.hi5.com/friend/87628233--Paul--Profile-html  sgn://hi5.com/?pk=87628233

#KNOWN_FAILING:
#http://lindner.hi5.com/friend/87628233--Paul--Friends-html  sgn://hi5.com/?pk=87628233
#http://lindner.hi5.com/friend/profile/displayFriends.do?userid=87628233&offset=24  sgn://hi5.com/?pk=87628233
#http://bradfitz.hi5.com/friend/87628233--Paul--Friends-html  sgn://hi5.com/?pk=87628233

# Not lindner:
#KNOWN_FAILING:
#http://lindner.hi5.com/friend/30399640--Dan--Profile-html   sgn://hi5.com/?pk=30399640

#KNOWN_FAILING:
#foaf(sgn://hi5.com/?pk=87628233)     http://api.hi5.com/rest/profile/foaf/87628233


# when logged in:
#http://www.hi5.com/friend/profile/displaySameProfile.do?userid=87628233  sgn://hi5.com/?pk=87628233
#http://www.hi5.com/friend/profile/displayHi5URL.do?nickname=koolby   sgn://hi5.com/?ident=koolby

#http://www.hi5.com/friend/profile/displayHi5URL.do?nickname=bradfitz  sgn://hi5.com/?ident=bradfitz

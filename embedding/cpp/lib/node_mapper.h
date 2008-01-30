// Copyright 2007 Google Inc. All Rights Reserved.
// Author: bradfitz@google.com (Brad Fitzpatrick)
//

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
 */

#ifndef SOCIALGRAPH_NODE_MAPPER_H__
#define SOCIALGRAPH_NODE_MAPPER_H__

#include <string>

class JSRuntime;
class JSContext;
class JSObject;
class JSScript;

namespace sgnodemapper {

using std::string;

class NodeMapper {
 public:
  // Construct a NodeMapper using a custom path to
  // the javascript file.
  NodeMapper(const string& js_filename);

  ~NodeMapper();

  // Given a URL, puts cleaned up node identifier (or original URL)
  // into *output. currently always returns true if it doesn't
  // fail, but TODO(bradfitz): future will return false if no special
  // transformation was done. (although *output will still
  // contain then the original URL)
  bool GraphNodeFromURL(const string& url, string* output);

  // Given an sgn:// url and a url type (profile, rss, etc.), puts the 
  // canonical URL into *output. currently always returns true if it doesn't
  // fail, but TODO(bradfitz): future will return false if no special
  // transformation was done. (although *output will still
  // contain then the original URL)
  bool GraphNodeToURL(const string& sgnUrl, const string& type, string* output);

 private:
  NodeMapper();
  void Init(const string& javascript_source);

  JSRuntime* rt_;
  JSContext* cx_;
  JSObject* global_;
  JSObject* parent_;
  JSScript* jscript_;
  int num_functions_called_;
};

}  // namespace

#endif  // SOCIALGRAPH_NODE_MAPPER_H__

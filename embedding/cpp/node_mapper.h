// Copyright 2007 Google Inc. All Rights Reserved.
// Author: bradfitz@google.com (Brad Fitzpatrick)
//

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

// Copyright 2007 Google Inc. All Rights Reserved.
// Author: bradfitz@google.com (Brad Fitzpatrick)

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

#define XP_UNIX
extern "C" {
#include "jsapi.h"
}

#include "node_mapper.h"

#include <fstream>
#include <iostream>
#include <string>

namespace sgnodemapper {

using std::cerr;
using std::endl;
using std::ifstream;
using std::ios;

const unsigned int kMB = 0x100000;

static void OnError(JSContext *cx, const char *message,
                    JSErrorReport *report) {
  cerr << "Javascript error on line " <<
      report->lineno << ": " << message << endl;
}

static JSClass global_class = {
  "global", 0,
  JS_PropertyStub, JS_PropertyStub, JS_PropertyStub, JS_PropertyStub,
  JS_EnumerateStub, JS_ResolveStub, JS_ConvertStub,
  JS_FinalizeStub
};

void NodeMapper::Init(const string& javascript_source) {
  // create runtime and context and global object
  rt_ = JS_NewRuntime(kMB);
  assert(rt_);

  cx_ = JS_NewContext(rt_, 0x2000);  // 8 kB stack
  JS_SetErrorReporter(cx_, OnError);
  global_ = JS_NewObject(cx_, &global_class, NULL, NULL);
  JSBool builtins = JS_InitStandardClasses(cx_, global_);
  assert(builtins == JS_TRUE);

  // make a top-level alias for our entrypoint (which used to be the
  // default entrypoint), making it easier for us to call the
  // functions we care about from C++ world.
  string full_js = javascript_source +
      "\n URLToGraphNode = nodemapper.urlToGraphNode;" +
      "\n URLFromGraphNode = nodemapper.urlFromGraphNode;\n";

  // these just set the file/line that the JS compiler thinks
  // it's reading from.  used for its error reporting.
  const char* kFilenameForDebugOutput = "nodemapper.js";
  const int kStartingLineNumber = 1;

  jscript_ = JS_CompileScript(cx_, global_,
                              full_js.c_str(),
                              full_js.size(),
                              kFilenameForDebugOutput,
                              kStartingLineNumber);
  if (!jscript_) {
    cerr << "script did not compile" << endl;
    assert(0);
  }

  // execute a compiled script
  jsval rval;
  JSBool ok = JS_ExecuteScript(cx_, global_, jscript_, &rval);
  if (!ok) {
    cerr << "script execution failed" << endl;
    //assert(0);
  }
}

NodeMapper::NodeMapper()
    : num_functions_called_(0) {
}

NodeMapper::NodeMapper(const string& js_filename)
    : num_functions_called_(0) {
  ifstream infile(js_filename.c_str());
  string js_data;
  char buf[1024];
  do {
    infile.read(buf, 1024);
    std::streamsize n = infile.gcount();
    js_data.append(buf, n);
  } while (infile.good());
  Init(js_data);
}

NodeMapper::~NodeMapper() {
  JS_DestroyScript(cx_, jscript_);
  JS_DestroyContext(cx_);
  JS_DestroyRuntime(rt_);
}

bool NodeMapper::GraphNodeFromURL(const string& url, string* output) {
  // fast path: if input is already an sgn:// URL, then don't run it
  // through the (relatively slow) javascript mapper
  if (url.rfind("sgn://", 0) != string::npos) {
    *output = url;
    return true;
  }

  JSString* str;
  jsval rval;
  jsval args[1];
  args[0] = STRING_TO_JSVAL(JS_NewStringCopyZ(cx_, url.c_str()));
  JSBool ok = JS_CallFunctionName(cx_, global_, "URLToGraphNode",
                                  1, args, &rval);
  if (!ok) {
    cerr << "error calling URLToGraphNode" << endl;
    assert(0);
  }
  str = JS_ValueToString(cx_, rval);

  // char* from JS_GetStringBytes is GC'd by SpiderMonkey later:
  *output = JS_GetStringBytes(str);

  // free some memory every 1000 function calls
  if (++num_functions_called_ % 1000 == 0) {
    JS_GC(cx_);
  }

  return true;
}

bool NodeMapper::GraphNodeToURL(const string& sgnUrl, const string& type, string* output) {
  JSString* str;
  jsval rval;
  jsval args[2];
  args[0] = STRING_TO_JSVAL(JS_NewStringCopyZ(cx_, sgnUrl.c_str()));
  args[1] = STRING_TO_JSVAL(JS_NewStringCopyZ(cx_, type.c_str()));
  JSBool ok = JS_CallFunctionName(cx_, global_, "URLFromGraphNode",
                                  1, args, &rval);
  if (!ok) {
    cerr << "error calling URLFromGraphNode" << endl;
    assert(0);
  }
  str = JS_ValueToString(cx_, rval);

  // char* from JS_GetStringBytes is GC'd by SpiderMonkey later:
  *output = JS_GetStringBytes(str);

  // free some memory every 1000 function calls
  if (++num_functions_called_ % 1000 == 0) {
    JS_GC(cx_);
  }

  return true;
}

}  // namespace

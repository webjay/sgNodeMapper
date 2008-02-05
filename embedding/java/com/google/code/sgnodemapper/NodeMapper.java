/*

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

*/

package com.google.code.sgnodemapper;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

import java.io.InputStreamReader;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.io.IOException;

public class NodeMapper {

  private final Scriptable scope;
  private final Function urlToGraphNodeFunction;
  private final Function urlFromGraphNodeFunction;

  public NodeMapper(String nodeMapperJavaScript) {
    Context context = Context.enter();
    scope = context.initStandardObjects();

    // The entrypoint we want to use is appended in the root namespace,
    // to make it easier to lookup:
    nodeMapperJavaScript +=
        "\n URLToGraphNode = nodemapper.urlToGraphNode;\n";
    nodeMapperJavaScript +=
        "\n URLFromGraphNode = nodemapper.urlFromGraphNode;\n";

    context.evaluateString(
        scope, nodeMapperJavaScript, "nodemapper.js", 1, null);
    urlToGraphNodeFunction = (Function) scope.get("URLToGraphNode", scope);
    urlFromGraphNodeFunction = (Function) scope.get("URLFromGraphNode", scope);
    context.exit();
  }

  /**
   * Returns an sgn:// URL, if possible, for the given url,
   * else returns the provided URL back.
   *
   * @arg url URL to try and map to sgn:// node
   * @returns an sgn:// URL, if the provided url was recognized
   *          as a supported type, else returns the provided url
   *          back.
   */
  public String urlToGraphNode(String url) {
    if (url == null) {
      return null;
    }
    Context context = Context.enter();
    Object functionArgs[] = { url };
    Object objResult = urlToGraphNodeFunction.call(
        context, scope, scope, functionArgs);
    String result = Context.toString(objResult);
    context.exit();
    return result;
  }

  /**
   * Returns an URL, if possible, for the provided sgn URL and URL
   * Type.  For instance, return an 'rss' or 'atom' URL (presumably
   * http) from an sgn:// URL.
   *
   * @param sgnUrl sgn:// URL
   * @param urlType a URL type defined by sgnodemapper (e.g. 'content',
   *        'profile', 'rss', 'atom', 'foaf', 'openid', etc)
   * @return either a URL, or null, if urlType is unknown or sgnUrl
   *     is not a URL of scheme "sgn"
   */
  public String urlFromGraphNode(String sgnUrl, String urlType) {
    if (sgnUrl == null || urlType == null || !sgnUrl.startsWith("sgn://")) {
      return null;
    }
    Context context = Context.enter();
    Object functionArgs[] = { sgnUrl, urlType };
    Object objResult = urlFromGraphNodeFunction.call(
        context, scope, scope, functionArgs);
    String result = Context.toString(objResult);
    context.exit();
    if (result != null && result.length() == 0) {
      return null;
    }
    return result;
  }
}

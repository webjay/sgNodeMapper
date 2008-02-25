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

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TestRunner {

  private final NodeMapper nodeMapper;

  private String readInFile(String fileName) throws IOException {
    StringBuilder sb = new StringBuilder();
    BufferedReader br = new BufferedReader(new FileReader(fileName));
    String input = null;
    while (null != (input = br.readLine())) {
      sb.append(input + "\n");
    }
    return sb.toString();
  }
  
  public TestRunner() throws IOException {
    this.nodeMapper = new NodeMapper(readInFile("nodemapper.js"));
  }
  
  private void runTests(Pattern testsToRunPattern) throws IOException {
    String expectedData = readInFile("nodemapper_expected.dat");
    List<String> errors = new ArrayList<String>();
    List<String> warnings = new ArrayList<String>();
    for (String line : expectedData.split("\n")) {
      if (line.matches("^\\s*#.*") || line.trim().length() == 0) {
        continue;
      }
      
      //Split on one or more spaces
      String[] urls = line.split("\\s+");
      String input = urls[0];
      String expectedUrl = urls[1];
      if (!testsToRunPattern.matcher(input).matches() 
          && !testsToRunPattern.matcher(expectedUrl).matches()) {
        continue;
      }

      String actualUrl, testName;
      Pattern compiledInputPattern = Pattern.compile("^(\\w+)\\((.+)\\)");
      Matcher inputMatcher = compiledInputPattern.matcher(input);
      if (inputMatcher.matches()) {
        String urlType = inputMatcher.group(1);
        String sgnNode = inputMatcher.group(2);
        
        actualUrl = nodeMapper.urlFromGraphNode(sgnNode, urlType);
        testName = "URL of " + urlType +"(" + sgnNode + ")";
        
        //verify the round-tripping from the url back to the sgn node
        if (actualUrl.equals(expectedUrl)) {
          String sgnNodeCreatedFromUrl = nodeMapper.urlToGraphNode(expectedUrl);
          if (!sgnNodeCreatedFromUrl.equals(sgnNode)) {
            warnings.add(createWarningMessage(expectedUrl, urlType, sgnNode));
          }
        }
      } else {
        actualUrl = nodeMapper.urlToGraphNode(input);
        testName = "Mapping " + input;
      }
      
      if (!actualUrl.equals(expectedUrl)) {
        errors.add(createErrorMessage(input, expectedUrl, actualUrl));
      }
    }
    
    printStatus(errors, warnings);
  }

  private String createErrorMessage(String input, String expectedUrl, 
      String actualUrl) {
    return "\n" + input + "\n     GOT:    " + actualUrl 
        + "\n     WANTED: " + expectedUrl + "\n";
  }

  private String createWarningMessage(String expectedUrl, String urlType, 
      String sgnNode) {
    String warning = urlType + "(" + sgnNode + ") doesn't round-trip on URL: " 
      + expectedUrl;
    return warning;
  }
  
  private void printStatus(List<String> errors, List<String> warnings) {
    for (String warning : warnings) {
      System.err.println(warning);
    }
    if (!warnings.isEmpty()) {
      System.err.println("There were " + warnings.size() + " warnings");
    }
    
    
    if (errors.isEmpty()) {
      System.err.println("tests passed");
    } else {
      for(String error : errors) {
        System.err.println(error);
      }
      System.err.println("There were " + errors.size() + " errors");
    }
  }

  public static void main(String[] args) throws Exception {
    String testsToRunPattern = ".*";
    if (args.length >= 1) {
      testsToRunPattern = args[1];
    }
    
    Pattern compiledPattern = Pattern.compile(testsToRunPattern);
    
    TestRunner tr = new TestRunner();
    tr.runTests(compiledPattern);
  }
}

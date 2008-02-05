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
      if (line.matches("^\\s*#.*") || line.trim().isEmpty()) {
        continue;
      }
      
      //Split on one or more spaces
      String[] urls = line.split("\\s+");
      String input = urls[0];
      String expected = urls[1];
      if (!testsToRunPattern.matcher(input).matches() 
          && !testsToRunPattern.matcher(expected).matches()) {
        continue;
      }

      String actual, testName;
      Pattern compiledInputPattern = Pattern.compile("^(\\w+)\\((.+)\\)");
      Matcher inputMatcher = compiledInputPattern.matcher(input);
      if (inputMatcher.matches()) {
        String urlType = inputMatcher.group(1);
        String sgnNode = inputMatcher.group(2);
        
        actual = nodeMapper.urlFromGraphNode(sgnNode, urlType);
        testName = "URL of " + urlType +"(" + sgnNode + ")";
        
        //verify the round-tripping from the url back to the sgn node
        if (actual.equals(expected)) {
          String sgnNodeCreatedFromUrl =  nodeMapper.urlToGraphNode(expected);
          if (!sgnNodeCreatedFromUrl.equals(sgnNode)) {
            warnings.add(createWarningMessage(expected, urlType, sgnNode));
          }
        }
      } else {
        actual = nodeMapper.urlToGraphNode(input);
        testName = "Mapping " + input;
      }
      
      if (!actual.equals(expected)) {
        errors.add(createErrorMessage(input, expected, actual));
      }
    }
    
    printStatus(errors, warnings);
  }

  private String createErrorMessage(String input, String expected, 
      String actual) {
    return "\n" + input + "\n     GOT: " + actual 
        + "\n     WANTED: " + expected + "\n";
  }

  private String createWarningMessage(String expected, String urlType, 
      String sgnNode) {
    String warning = urlType + "(" + sgnNode + ") doesn't round-trip on URL: " 
      + expected;
    return warning;
  }

  
  
  private void printStatus(List<String> errors, List<String> warnings) {
    for (String warning : warnings) {
      System.err.println(warning);
    }
    
    if (errors.isEmpty()) {
      System.err.println("tests passed");
    } else {
      for(String error : errors) {
        System.err.println(error);
      }
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

package com.google.code.sgnodemapper;

import static org.junit.Assert.fail;

import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.Before;
import org.junit.Test;

public class NodeMapperTest {
  private NodeMapper nodeMapper;
  
  @Before
  public void setUp() throws IOException {
    this.nodeMapper = new NodeMapper("nodemapper.js");
  }
  
  @Test
  public void runTests() throws IOException {
    String testsToRunPattern = ".*";    
    Pattern compiledPattern = Pattern.compile(testsToRunPattern);
    
    String expectedData = FileUtils.getClasspathResourceAsString("nodemapper_expected.dat");
    
    for (String line : expectedData.split("\n")) {
      if (line.matches("^\\s*#.*") || line.trim().length() == 0) {
        continue;
      }
      
      //Split on one or more spaces
      String[] urls = line.split("\\s+");
      if (urls.length < 2) {
        continue;
      }

      String input = urls[0];
      String expectedUrl = urls[1];
      if (!compiledPattern.matcher(input).matches() 
          && !compiledPattern.matcher(expectedUrl).matches()) {
        continue;
      }

      String actualUrl;
      Pattern compiledInputPattern = Pattern.compile("^(\\w+)\\((.+)\\)");
      Matcher inputMatcher = compiledInputPattern.matcher(input);
      if (inputMatcher.matches()) {
        String urlType = inputMatcher.group(1);
        String sgnNode = inputMatcher.group(2);
        actualUrl = nodeMapper.urlFromGraphNode(sgnNode, urlType);
        
        //verify the round-tripping from the url back to the sgn node
        if (actualUrl != null && actualUrl.equals(expectedUrl)) {
          String sgnNodeCreatedFromUrl = nodeMapper.urlToGraphNode(expectedUrl);
          if (!sgnNodeCreatedFromUrl.equals(sgnNode)) {
            fail("sgn node: "+sgnNodeCreatedFromUrl+" created from url: "+expectedUrl+" does not equal: "+sgnNode);
          }
        }
      } else {
        actualUrl = nodeMapper.urlToGraphNode(input);
      }
      
      if (actualUrl != null && !actualUrl.equals(expectedUrl)) {
        fail("Actual url: "+actualUrl+" does not equal expected url: "+expectedUrl);
      }
    }
  }
}

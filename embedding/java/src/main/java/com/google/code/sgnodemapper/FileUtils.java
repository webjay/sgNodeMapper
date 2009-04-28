package com.google.code.sgnodemapper;

import java.io.IOException;
import java.io.InputStream;

/**
 * Utility with helper IO methods, such as getting a classpath resource.
 */
public class FileUtils {

  /**
   * Utility method to read a classpath resource to a string.
   * 
   * Uses ClassLoader.getSystemResourceAsStream() to get the resource.
   * 
   * @param filePath
   * @return
   * @throws IOException
   */
  public static String getClasspathResourceAsString(String resourcePath) throws IOException {
    InputStream in = ClassUtils.getDefaultClassLoader().getResourceAsStream(resourcePath);
    StringBuffer out = new StringBuffer();
    
    byte[] b = new byte[4096];
    for (int n; (n = in.read(b)) != -1;) {
      out.append(new String(b, 0, n));
    }
    
    return out.toString();
  }
  
}

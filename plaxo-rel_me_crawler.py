#!/usr/bin/python2.3

###
# Semantically-aware focused crawler for rel="me" links.
# Given a starting URL, returns all the claimed and verified links to other URLs.
# This code is available by Plaxo as free and open-source code (see below for details).
# Initial release: 2007-08-29
# @see http://opensocialgraph.plaxo.com for more info and a working demo
#
# @author Joseph Smarr (joseph@plaxo.com) - Primary Contact
# @author Glenn Dixon 
#
# This code is covered by a BSD license (http://opensource.org/licenses/bsd-license.php)
#
# Copyright (c) 2007-2008, Plaxo, Inc.
# 
# All rights reserved.
# 
# Redistribution and use in source and binary forms, with or without modification, 
# are permitted provided that the following conditions are met:
# 
#  * Redistributions of source code must retain the above copyright notice, 
#    this list of conditions and the following disclaimer.
#  * Redistributions in binary form must reproduce the above copyright notice, 
#    this list of conditions and the following disclaimer in the documentation 
#    and/or other materials provided with the distribution.
#  * Neither the name of Plaxo nor the names of its contributors may be used to 
#    endorse or promote products derived from this software without specific 
#    prior written permission.
# 
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
# CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
# EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
# PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
# PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
# LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
# NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
###

# TODO: 
# - multi-thread crawler
# - use shorter timeouts when crawling sites?
# - enforce max crawl depth to avoid run-away crawls?

import re
import string
import sys
import urllib
import urlparse
from xml.sax import saxutils

import simplejson

# whether to print debug output to stderr
g_debug = False

# storage for the data we find while crawling
urlQueue = [] # array of [url, referer] pairs
foundUrls = {} # URL -> int (have we already reported this URL)
crawledUrls = {} # URL -> int (have we already crawled this URL)
foundClaims = {} # URL -> [array of URLs that this URL links to with rel="me"]
reverseClaims = {} # URL -> [array of URLs that link into this URL with rel="me", i.e. back-links]
verifiedUrls = {} # URL -> 1 iff we've found a cycle of claims to the URL we started with
exhaustedUrls = {} # URL -> 1 iff we've exhaustively explored this node's subnodes looking for cycles

def lookupFeeds(startingUrl, output=None, verbose=False):
    """ Main crawler function to find and print URLs linked from startingUrl with rel="me" 
        Results are printed to stdout
        @param startingUrl the URL to start looking for rel="me links in the crawl
        @param output None for text output, or "xml" or "json" for structured output
        @param verbose whether to also print out verbose logging to stdout while crawling 
    """
    global g_debug
    if verbose:
      g_debug = True 

    if g_debug:
      print ">>", "NOTE: verbose debugging is on (debug lines start with >>)"

    # canonicalize starting URL
    startingUrl = canonicalizeUrl(startingUrl)

    # start crawling from the initial URL supplied
    if g_debug:
      print ">>", "*** Crawling identity graph starting at %s ***" %startingUrl
    urlQueue.append([startingUrl, ""]) # start the queue
    matchUrl(startingUrl)

    # breadth-first search of URLs, which will get added to the queue as we crawl
    while len(urlQueue) > 0:
      urls = urlQueue.pop(0)
      processUrl(urls[0], urls[1])

    # find cycles in the link-graph to determine which claims can be verified
    if g_debug:
      print ">>", "*** Done crawling -> analyzing graph for verified cycles ***"
    verifiedUrls[startingUrl] = 1 # starting point is trivially verifiable
    if foundClaims.keys():
      markVerifiedUrls(startingUrl)

    # print the final results
    if g_debug:
      print ">>", "*** Done! Here's what we found:"
      print 
    printResults(startingUrl, output)

def canonicalizeUrl(url):
    """ Returns a canonical version of the given URL (lowercase protocol and host name, no trailing slash) """

    # add http:// if no protocol was specified (relative URLs should have been resolved above)
    if not re.compile('^[A-Za-z]+:').match(url):
      url = "http://" + url

    # trim trailing slash (if there's a query string, look for the slash before the ?)
    qIndex = url.find('?')
    if qIndex == -1: 
      # no query string -> trim trailing slash (if any)
      if url.endswith('/'):
        url = url[0:-1]
    elif url[qIndex - 1] == '/':
      # slash before ? -> keep everything before and after the slash
      url = url[0:qIndex-1] + url[qIndex:]

    # lowercase the protocol and domain (e.g. HTTP://MYDOMAIN.COM/MYPAGE -> http://mydomain.com/MYPAGE)
    (urlType, urlRest) = urllib.splittype(url)
    (urlHost, urlPath) = urllib.splithost(urlRest)
    if not urlHost:
      urlHost = '' # can't do lower() on null host, e.g. aim:josephsmarr
    url = "%s:%s%s%s" %(urlType.lower(), urlRest.startswith('//') and '//' or '', urlHost.lower(), urlPath)

    return url

def processUrl(url, referer):
    """ Crawls the given URL looking for rel="me" links (referer is just for logging) """
    global crawledUrls

    # see if we've already crawled this URL
    url = canonicalizeUrl(url) # make sure we match equivalent URLs
    if url in crawledUrls:
      if g_debug:
        print ">>", "(already crawled %s -> ignoring)" %url
      return
    if g_debug:
      print ">>", "Crawling %s, referer = %s" %(url, referer)
    sys.stdout.flush() # show output as we get it

    # download the contents of this URL
    try: 
      f = urllib.urlopen(url)

      # don't crawl this URL again
      crawledUrls[url] = 1

      # look for rel="me" links at this URL
      foundLink = processHtml(url, string.rstrip(f.read()))

      f.close()

      if g_debug and not foundLink:
        print ">>", " - no rel=\"me\" links found"

    # skip errors and continue crawling other sites
    except Exception:
      if g_debug:
        print ">>", " - unable to crawl URL -> skipping"

def processHtml(curUrl, html):
  """ Looks for a rel="me" link in the given HTML pulled from the given URL """
  relme_re = re.compile('<(?:a|link) ([^>]*\\brel=(?:me\\b|"(?:[^">]* )?me(?: [^">]*)?")[^>]*)>', re.IGNORECASE)
  href_re = re.compile('href="([^"]*)"', re.IGNORECASE)

  # TODO: ignore link from LinkedIn profile to work home page? (it uses rel="me", but really shouldn't)
  foundLink = False
  iter = relme_re.finditer(html) # find <a> tags with rel="me"
  for relme_m in iter:
    href = relme_m.group(1)
    if href:
      href_m = href_re.search(href) # pull out URL
      if href_m:
        url = urlparse.urljoin(curUrl, href_m.group(1)) # resolve relative url, if any
        processLink(curUrl, url)
        foundLink = True

  # optionally, get additional links that don't use rel="me" but should (from known sites)
  links = getSiteSpecificLinks(curUrl, html)
  for url in links:
    processLink(curUrl, url)
    foundLink = True

  return foundLink

def processLink(curUrl, url):
  """ Stores info on the rel="me" link found from curUrl to url """
  global urlQueue

  url = canonicalizeUrl(url) # make sure we match equivalent URLs

  # ignore self-links
  if url == curUrl:
    return 

  addClaim(curUrl, url, foundClaims) # record the claim edge we just found
  addClaim(url, curUrl, reverseClaims, True) # also record the reverse-link so we can find cycles later
  matchUrl(url) # record that we found this URL
  urlQueue.append([url, curUrl]) # recursively look for URLs there too

def addClaim(fromUrl, toUrl, claimMap, reverse = False):
  """ Stores the link between fromUrl and toUrl (can be recorded in both directions) """
  if fromUrl not in claimMap:
    claimMap[fromUrl] = []
  if toUrl not in claimMap[fromUrl]:
    if g_debug and not reverse:
      print ">>", " - found rel=\"me\" claim: ", fromUrl, " -> ", toUrl
    claimMap[fromUrl].append(toUrl)

def matchUrl(url):
  """ Records that we've found a rel="me" link to the given URL """
  global foundUrls
  if url in foundUrls:
    return

  #print ">>", "# %s" %url
  foundUrls[url] = 1

def getSiteSpecificLinks(curUrl, html):
  """ Allows us to look for profile-URL links on known sites that don't use rel="me" """
  # TODO: add more site-specific regexes based on curUrl, and also tell these sites to add rel="me"! :)

  links = []

  # yelp, e.g. http://www.yelp.com/user_details?userid=Dk2IkchUjADbrC05sdsAVQ
  # home page url in profile:
  # <p><a rel="nofollow" href="http://www.yelp.com/redir?url=http%3a%2f%2fjosephsmarr.com" onclick="externallinks(this);">josephsmarr.com</a></p>
  if (re.compile("^http://(?:www\.)?yelp\.com/user_details", re.IGNORECASE).search(curUrl)):
    m = re.compile("href=\"http://www.yelp.com/redir\?url=([^&\"]*)\".*external", re.IGNORECASE).search(html)
    if m:
      if g_debug:
        print ">>", " - found yelp profile url: ", urllib.unquote(m.group(1))
      links.append(urllib.unquote(m.group(1)))

  # del.icio.us, e.g. http://del.icio.us/jsmarr
  # home page url in profile:
  # <span id="hdr-profile">by&nbsp;<a href="http://josephsmarr.com" rel="nofollow">Joseph Smarr</a></span></h1>
  if (re.compile("^http://del\.icio\.us/", re.IGNORECASE).search(curUrl)):
    m = re.compile("<span id=\"hdr-profile\">by&nbsp;<a href=\"([^&\"]*)\"", re.IGNORECASE).search(html)
    if m:
      if g_debug:
        print ">>", " - found del.icio.us profile url:", urllib.unquote(m.group(1))
      links.append(urllib.unquote(m.group(1)))

  # upcoming, e.g. http://upcoming.yahoo.com/user/75587/
  # home page url in profile:
  # <div class="url"><a href="http://www.josephsmarr.com">http://www.josephsmarr.com</a></div>
  if (re.compile("^http://(?:www\.)?upcoming\.(?:yahoo\.com|org)/user/", re.IGNORECASE).search(curUrl)):
    m = re.compile("<div class=\"url\"><a href=\"([^&\"]*)\"", re.IGNORECASE).search(html)
    if m:
      if g_debug:
        print ">>", " - found upcoming profile url:", urllib.unquote(m.group(1))
      links.append(urllib.unquote(m.group(1)))

  # bloglines, e.g. http://www.bloglines.com/blog/jsmarr
  # home page url in profile:
  # <th>Homepage:</th>
  # <td><a href="http://www.josephsmarr.com">www.josephsmarr.com</a></td>
  if (re.compile("^http://(?:www\.)?bloglines\.com/blog/", re.IGNORECASE).search(curUrl)):
    m = re.compile("<th>Homepage:</th>\s*\n\s*<td><a href=\"([^&\"]*)\"", re.IGNORECASE).search(html)
    if m:
      if g_debug:
        print ">>", " - found bloglines profile url:", urllib.unquote(m.group(1))
      links.append(urllib.unquote(m.group(1)))

  # digg, e.g. http://www.digg.com/users/jsmarr/profile
  # home page url in profile:
  # <dt>My Website:</dt>
  # <dd><a href="http://josephsmarr.com">http://josephsmarr.com</a></dd>
  if (re.compile("^http://(?:www\.)?digg\.com/users/", re.IGNORECASE).search(curUrl)):
    m = re.compile("<dt>My Website:</dt>\s*\n\s*<dd><a href=\"([^&\"]*)\"", re.IGNORECASE).search(html)
    if m:
      if g_debug:
        print ">>", " - found digg profile url:", urllib.unquote(m.group(1))
      links.append(urllib.unquote(m.group(1)))

  # socializr, e.g. http://www.socializr.com/user/jsmarr
  # home page url in profile:
  # <th>Homepage:</th>
  #  <td>
  #   <a target="_blank" href="http://josephsmarr.com">josephsmarr.com</a>
  if (re.compile("^http://(?:www\.)?socializr\.com/user/", re.IGNORECASE).search(curUrl)):
    m = re.compile("<th>Homepage:</th>[\n\s]*<td>[\n\s]*<a [^>]*href=\"([^&\"]*)\"", re.IGNORECASE).search(html)
    if m:
      if g_debug:
        print ">>", " - found socializr profile url:", urllib.unquote(m.group(1))
      links.append(urllib.unquote(m.group(1)))

  # youtube, e.g. http://www.youtube.com/jsmarr
  # home page url in profile:
  # <span class="smallText">Website:</span> <b><a href="http://josephsmarr.com" name="&lid=ProfileWebsiteLink&lpos=Profile" rel="nofollow">http://josephsmarr.com</a></b><br>
  if (re.compile("^http://(?:www\.)?youtube\.com/", re.IGNORECASE).search(curUrl)):
    m = re.compile("Website:</span> *<b><a [^>]*href=\"([^&\"]*)\"", re.IGNORECASE).search(html)
    if m:
      if g_debug:
        print ">>", " - found youtube profile url:", urllib.unquote(m.group(1))
      links.append(urllib.unquote(m.group(1)))

  return links

def markVerifiedUrls(url):
  """ Recursively finds all urls with two-way rel="me" link chains to the starting URL.
      Because all nodes in the graph are descendants of the startingUrl, they're all known to 
      have downstream paths, so all nodes that also have an upstream path are verified links. """
  if g_debug:
    print ">>", "markVerifiedUrls: ", url
  exhaustedUrls[url] = 1 # don't crawl this url again
  if url in reverseClaims:
    for inUrl in reverseClaims[url]:
      if inUrl not in verifiedUrls:
        verifiedUrls[inUrl] = 1
        markVerifiedUrls(inUrl) # also recursively verify links into this node

def printResults(startingUrl, output):
  """ Prints the URLs we found as text/xml/json """
  urls = foundUrls.keys()
  if startingUrl in urls:
    urls.remove(startingUrl) # no need to report a self-link
  urls.sort()

  # FIXME: ensure tighter consistency between XML and JSON output schemas
  if output == 'json':
    printJson(startingUrl, urls)
  elif output == 'xml':
    printXml(startingUrl, urls)
  else:
    # normal (text) output
    print startingUrl
    for url in urls:
      print (url in verifiedUrls and "     is:" or " claims:"),
      print url

def printJson(startingUrl, urls):
  """ Prints the URLs we found as JSON """
  claims = []
  for url in urls:
    claim = {}
    if url in verifiedUrls:
      claim['verified'] = 1
    claim['url'] = url
    claims.append(claim)

  json = { 'identity': { 'source': startingUrl, 'claim': claims } }
  print simplejson.dumps(json, sort_keys=True, indent=2)

def xmlEscape(str):
  """ Returns the given string escaped for XML as UTF-8 """
  str = saxutils.escape(str)
  try:
    str = str.encode('UTF-8')
  except UnicodeDecodeError:
    # bad chars in the input -> pass it along raw so the client can see this
    if g_debug:
      print ">>", "WARNING: unable to encode string as UTF-8:", str
  return str

def printXml(startingUrl, urls):
  """ Prints the URLs we found as XML """
  print '<?xml version="1.0" encoding="UTF-8"?>'
  print '<identity source="%s">' %xmlEscape(startingUrl)
  for url in urls:
    if url in verifiedUrls:
      print ' <claim verified="1">'
    else:
      print ' <claim>'
    print '  <url>%s</url>' %xmlEscape(url)
    print ' </claim>'
  print '</identity>';

# this script can be run from the command line, or other python code can call lookupFeeds
if __name__ == '__main__':
    if len(sys.argv) <= 1:
      print>>sys.stderr, "Usage: rel_me_crawler.py startingurl [verbose] [output]"
      print>>sys.stderr, "       verbose=1 for extra logging, output = xml/json for structured output"
      sys.exit(1)

    startingUrl = sys.argv[1]

    verbose = False
    if len(sys.argv) > 2:
      verbose = sys.argv[2]

    output = None
    if len(sys.argv) > 3:
      output = sys.argv[3]

    lookupFeeds(startingUrl, output, verbose)

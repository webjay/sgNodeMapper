<?php 

/**
 * Copyright 2008 Plaxo Inc.
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

/* Contact: Joseph Smarr (joseph@plaxo.com) */

array_shift($argv); // skip cmd name

$nodeMapper = new SGNodeMapper("../../nodemapper.js"); 
foreach ($argv as $url) {
  echo "URL: $url\n";

  $sgnUrl = $nodeMapper->graphNodeFromURL($url);
  echo " -> SGN: $sgnUrl\n";

  $profileUrl = $nodeMapper->graphNodeToURL($sgnUrl, "profile");
  echo " -> Profile: $profileUrl\n";
}

// test pairToGraphNode
$host = "twitter.com";
$account = "jsmarr";
$sgnUrl = $nodeMapper->pairToGraphNode($host, $account);
echo "\npairToGraphNode: $host + $account = $sgnUrl\n";

?>

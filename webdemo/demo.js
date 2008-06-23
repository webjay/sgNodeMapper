function $(name) {
  return document.getElementById(name);
}

function setStatus(text) {
  $("status").innerHTML += "<div>" + text + "</div>";
}

function XHR() {
  if (typeof(XMLHttpRequest) != "undefined") {
    return new XMLHttpRequest();
  }
  var xhr;
  var ex;
  try {
    xhr = new ActiveXObject("Msxml2.XMLHTTP.4.0");
  } catch (ex) {
    try {
      xhr = new ActiveXObject("Msxml2.XMLHTTP");
    } catch (ex) {
    }
  }
  return xhr;
}

function loadNodeMapper() {
  setStatus("Loading...");
  var request = XHR();
  var sites_to_load = 0;
  request.onreadystatechange = function() {
    if (request.readyState != 4) return;
    if (request.status != 200) {
      setStatus("Error: " + request.responseText);
      return;
    }
    setStatus("Parsing base rules.");
    try {
      eval(request.responseText);
    } catch (error) {
      setStatus("Error parsing nodemapper-base.js: " + error);
      return;
    }
    setStatus("Parsed base.");
    getSiteList(function (sites) {
      sites_to_load = sites.length;
      setStatus("Sites to load: " + sites_to_load);
      var onSiteLoaded = function(site) {
        sites_to_load--;
        setStatus("Sites to load: " + sites_to_load);
        if (sites_to_load == 0) {
          $("status").innerHTML = "";
          setStatus("Done loading <a href='../nodemapper-base.js'>nodemapper-base.js</a> & " + sites.length + " <a href='../sites/'>site rule files</a>.");
        }
      };
      // kick off the loads of each site rule files
      for (var i = 0; i < sites.length; ++i) {
        startLoadingSiteRules(sites[i], onSiteLoaded);
      }
    });
  };
  request.open("GET", "../nodemapper-base.js", true);
  request.send(null);
}

function startLoadingSiteRules(site, callback) {
  var request = XHR();
  request.onreadystatechange = function() {
    if (request.readyState != 4) return;
    if (request.status != 200) {
      alert("Error loading " + site + ": " + request.responseText);
    }
    // need to split the __END__ block (of tests) away
    setStatus("Size = " + request.responseText.length);
    var splits = request.responseText.split("__END__");
    var jsCode = splits[0];
    var testData = splits[1];
    try {
      eval(jsCode);
      setStatus("Tests for " + site + ": " + testData);
      callback();
    } catch (error) {
      setStatus("Parsing " + site + " failed: " + error);
    }
  };
  request.open("GET", "../sites/" + site, true);
  request.send(null);
}

function getSiteList(callback) {
  setStatus("Loading site list...");
  var request = XHR();
  request.onreadystatechange = function() {
    if (request.readyState != 4) return;
    if (request.status != 200) {
      setStatus("Error getting /sites/: " + request.responseText);
      return;
    }
    var sites = []
    var siteRE = /a href="([\w-]+\.js)"/ig;
    var matches;
    while ((matches = siteRE.exec(request.responseText)) != null) {
      sites.push(matches[1]);
    }
    callback(sites);
  };
  request.open("GET", "../sites/", true);
  request.send(null);
}

function convertToSgn() {
  var input = $("tosgn").value;
  var output = nodemapper.urlToGraphNode(input);
  if (output == input) {
    $("tosgn_output").innerHTML = "No known conversion for " + output;
    return false;
  }
  $("tosgn_output").innerHTML = "Converted to: <b>" + output + "</b> (from " + input + ")";
  $("fromsgn").value = output;
  convertFromSgn();
  return false;
}

function convertFromSgn() {
  var input = $("fromsgn").value;
  var types = ["profile", "content", "atom", "rss", "blog", "openid", "foaf", "addfriend"];
  var output = "";
  for (var typeIdx in types) {
    var http = nodemapper.urlFromGraphNode(input, types[typeIdx]);
    if (!http) {
      http = "<i>none</i>";
    }
    output += "<b>" + types[typeIdx] + "</b>: " + http + "<br>";
  }
  if (output.length == 0) {
    output = "<i>No known mappings to HTTP.</i>";
  }
  $("fromsgn_output").innerHTML = output;
  return false;
}

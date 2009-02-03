// Use Google's  AJAX Libraries API to load jQuery only required for this demo)
// We use jQuery (http://jquery.com) for the XMLHttpRequest calling
// and the DOM manipulation.
var useDebug = false;
var effects = -1;
var queryString;
google.load("jquery", "1");
google.setOnLoadCallback(function() {
  queryString = getQueryString();
  useDebug = queryString.debug == "1";
  $("#settings_debug").click(function() {
    toggleDebug();
  });
  toggleDebug(useDebug);
  if (queryString.effects) {
    effects = isNaN(queryString.effects) ? queryString.effects :
        parseInt(queryString.effects);
    if(effects == 0)
      effects--;
  }
  if (queryString.q) {
    $("#tosgn_input").val(unescape(queryString.q));
  }
  if (queryString.sgn) {
    $("#fromsgn_input").val(unescape(queryString.sgn));
  }
  if (useDebug) {
    setStatus("Loading nodemapper-base");
    $.getScript("../nodemapper-base.js", function() {
      setStatus("nodemapper-base loaded.");
      $.get("../sites/", function(data) {
        var sites = findSites(data);
        var sites_to_load = sites.length;
        setStatus("Loading rules for " + sites_to_load + " sites");
        var onSiteLoaded = function() {
          sites_to_load--;
          setStatus("Sites to load: " + sites_to_load);
          if (sites_to_load == 0) {
            $("#status").empty();
            setStatus("Done loading <a href=\"../nodemapper-base.js\">" +
                "nodemapper-base.js</a> & " + sites.length +
                " <a href=\"../sites/\">site rule files</a>.");
            nodemapperReady();
          }
        };
        $.each(sites, function() {
          var site = this;
          $.get("../sites/" + site, function(data) {
            var splits = data.split("__END__");
            var jsCode = splits[0];
            var testData = splits[1];
            try {
              eval(jsCode);
              setStatus("Loaded " + site + ".");
              onSiteLoaded();
            } catch (error) {
              if (error instanceof Error) {
                var more = "";
                for (var k in error) {
                  more += " [" + k + " == " + error[k] + "] ";
                }
                setStatus("Parsing " + site + " failed: " + more +
                    " on content: " + "<pre>" + jsCode + "</pre>");
              } else {
                setStatus("Parsing " + site + " failed: " + error);
              }
            }
          });
        });
      });
    });
  } else {
    setStatus("Loading nodemapper");
    $.getScript("../autogen/nodemapper.js", function() {
      $("#status").empty();
      setStatus("Done loading <a href=\"../autogen/nodemapper.js\">" +
          "nodemapper.js</a>");
      nodemapperReady();
    });
  }
});

function toggleDebug(newDebug) {
  var oldUseDebug = useDebug;
  useDebug = newDebug != undefined ? newDebug : !useDebug;
  if (oldUseDebug != newDebug)
    window.location = getPermalink();
  var textbox;
  if (useDebug)
    textbox = "Leave debug mode";
  else
    textbox = "Enter debug mode";
  $("#settings_debug").val(textbox);
}

function getPermalink() {
  var url = window.location.href;
  url = url.indexOf("?") == -1 ? url : url.substring(0, url.indexOf("?"));
  var params = {};
  if (useDebug)
    params.debug = 1;
  if (effects != -1)
    params.effects=effects;
  if ($("#tosgn_input").val() != "")
    params.q = $("#tosgn_input").val();
  if ($("#fromsgn_input").val() != "" && !params.q)
    params.sgn = $("#fromsgn_input").val();
  var paramsCompile = $.param(params);
  if (paramsCompile.length > 0)
    url+="?"+paramsCompile;
  return url;
}

function getQueryString() {
  var q = new Object();
  $.each(location.search.substring(1).split("&"), function(i) {
    if (this == "")
      return false;
    var pair = this.split("=");
    q[pair[0]] = pair[1];
  });
  return q;
}

function nodemapperReady() {
  $("#tosgn_form").submit(function() {
    convertToSgn();
    return false;
  });
  $("#fromsgn_form").submit(function() {
    convertFromSgn();
    return false;
  });
  if (queryString.q) {
    convertToSgn();
  } else if (queryString.sgn) {
    convertFromSgn();
  }
  $("#settings_permalink").click(function() {
    var url = getPermalink();
    $("#permalink_output").hide(effects).html("<a href='" + url + "'>" + url +
        "</a>").show(effects);
  });
}

function parseHtml(data, regex) {
  var sites = [];
  while ((matches = regex.exec(data)) != null) {
    sites.push(matches[1]);
  }
  return sites;
}

function findSites(data) {
  var regex = [
  // This works on code.google.com and Apache:
  /a href="([\w-]+\.js)"/ig,
  // If we got nothing, though, this regexp works for Camino,
  // whose HTML for a directory listing isn't even HTML,
  // even though it renders as such;
  /201: ([\w-]+\.js) /ig
  ];
  var sites = [];
  $.each(regex, function() {
    sites = parseHtml(data, this);
    //we got results, so we  return false, to break out of the $.each loop
    if (sites.length > 0)
      return false;
  });
  if (sites.length == 0)
    setStatus("Error: Can't load sitelist with content: " + data);
  return sites;
}

function setStatus(text) {
  $("<div>" + text + "</div>").hide().appendTo("#status").show(effects);
}

function convertToSgn() {
  var input = $("#tosgn_input").val();
  var output = nodemapper.urlToGraphNode(input);
  if (output == input) {
    $("#tosgn_output").hide(effects).html("No known conversion for " +
        output).show(effects);
  }else {
    $("#tosgn_output").hide(effects).html("Converted to: <b>" + output +
        "</b> (from " + input + ")").show(effects, function() {
      $("#fromsgn_input").val(output);
      convertFromSgn();
    });
  }
}

function convertFromSgn() {
  var input = $("#fromsgn_input").val();
  var types = ["profile", "content", "atom", "rss", "blog", "openid", "foaf",
      "addfriend"];
  var output = "";
  for (var typeIdx in types) {
    var link = nodemapper.urlFromGraphNode(input, types[typeIdx]);
    if (!link) {
      output += "<b>" + types[typeIdx] + "</b>: <i>none</i><br>";
    } else {
      output += "<b>" + types[typeIdx] + "</b>: " +
          "<a href=\"" + link + "\">" + link + "</a><br>";
    }
  }
  if (output.length == 0) {
    output = "<i>No known mappings to HTTP.</i>";
  }
  $("#fromsgn_output").hide(effects).html(output).show(effects);
}
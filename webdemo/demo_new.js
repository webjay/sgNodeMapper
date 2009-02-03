// Use Google's  AJAX Libraries API to load jQuery only required for this demo)
// We use jQuery (http://jquery.com) for the XMLHttpRequest calling
// and the DOM manipulation.
google.load("jquery", "1");
google.setOnLoadCallback(function() {
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
          setStatus("Done loading <a href='../nodemapper-base.js'>" +
              "nodemapper-base.js</a> & " + sites.length +
              " <a href='../sites/'>site rule files</a>.");
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
});

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
    //we got results, so we use return false, to break out of the $.each loop
    if(sites.length > 0)
      return false;
  });
  if (sites.length == 0)
    setStatus("Error: Can't load sitelist with content: " + data);
  return sites;
}

function setStatus(text) {
  $("#status").append("<div>" + text + "</div>");
}

function convertToSgn() {
  var input = $("#tosgn").val();
  var output = nodemapper.urlToGraphNode(input);
  if (output == input) {
    $("#tosgn_output").html("No known conversion for " + output);
    return false;
  }
  $("#tosgn_output").html("Converted to: <b>" + output + "</b> (from " +
      input + ")");
  $("#fromsgn").val(output);
  convertFromSgn();
  return false;
}

function convertFromSgn() {
  var input = $("#fromsgn").val();
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
  $("#fromsgn_output").html(output);
  return false;
}
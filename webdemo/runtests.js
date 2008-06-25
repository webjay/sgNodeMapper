function runNodeMapperTests(divName) {
    var div = document.getElementById(divName);
    if (!div) {
        alert("Div " + divName + " not found.");
        return;
    }
    if (!nodemapper_tests) {
        div.innerHTML = "Global 'nodemapper_tests' not found.";
        return;
    }
    var testCount = nodemapper_tests.length;
    var testsRun = 0;
    var testsPassed = 0;
    var testFailures = "";

    var updateStatus = function() {
        div.innerHTML = testsRun + "/" + testCount + " tests run, " + testsPassed +
            " passed.<br>" + testFailures;
    };
    var onPass = function() {
        testsRun++;
        testsPassed++;
        updateStatus();
    };
    var onFail = function(test, actual) {
        testsRun++;
        testFailures += "<b>failure: </b> for " + test + ", got: "
        + "<font color='red'>" + actual + "</font><br>";
        updateStatus();
    };
    var onResult = function(test, actual) {
        var expected = test[test.length - 1];
        if (actual == expected) {
            onPass();
        } else {
            onFail(test, actual);
        }
    };

    for (var i = 0; i < testCount; ++i) {
        var test = nodemapper_tests[i];
        if (test[0] == "to_sgn") {
            var actual = nodemapper.urlToGraphNode(test[1]);
            onResult(test, actual);
            continue;
        }
        if (test[0] == "from_sgn") {
            var actual = nodemapper.urlFromGraphNode(test[2], test[1]);
            onResult(test, actual);
            // TODO: test round-tripping as well.
            continue;
        }
        if (test[0] == "pair") {
            var actual = nodemapper.pairToGraphNode(test[1], test[2]);
            onResult(test, actual);
            continue;
        }

    }

}

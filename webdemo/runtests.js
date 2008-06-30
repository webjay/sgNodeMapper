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
    var testsFailed = 0;
    var testFailures = "";
    var debugOutput;
    window.debug = function (msg) {
        debugOutput += msg + "<br>\n";
    };

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
        testsFailed++;
        testFailures += "<b>failure: </b> for " + test + ", got: "
        + "<font color='red'>" + actual + "</font><br>";
        if (debugOutput) {
            testFailures += "<div style='margin: 0.5em 0 0.5em 3em'>" + debugOutput + "</div>";
        }
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
        debugOutput = "";
        var test = nodemapper_tests[i];
	var method = test[0];
	var expected = test[test.length - 1];
	var args = test.slice(1, test.length - 1);
	var actual = nodemapper[method].apply(nodemapper, args);
	onResult(test, actual);
    }
}

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
    for (var i = 0; i < testCount; ++i) {
        var test = nodemapper_tests[i];
        div.innerHTML += "Test: " + test + "<br>";
    }
    div.innerHTML += "<b>Done running tests.</b>";
}
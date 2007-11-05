nodemapper.js: build.pl nodemapper-base.js sites/*.js
	./build.pl

test: nodemapper.js
	./test.pl

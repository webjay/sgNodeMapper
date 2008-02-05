nodemapper.js: build.pl nodemapper-base.js sites/*.js
	./build.pl

test: nodemapper.js
	./test.pl

testjava: nodemapper.js
	./test-java.sh

# To get this target to work, unzip http://jsdoctoolkit.org/ to
# the directory 'jsdoc_toolkit'
docs: nodemapper.js
	cd jsdoc_toolkit && java -jar app/js.jar app/run.js \
		--template=templates/sweet --allfunctions \
		--directory=../docs/ \
		../nodemapper-base.js ../sites/*.js

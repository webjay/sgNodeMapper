#!/bin/sh

rm -rf javabin
mkdir -p javabin
javac embedding/java/com/google/code/sgnodemapper/TestRunner.java embedding/java/com/google/code/sgnodemapper/NodeMapper.java -cp embedding/java/lib/js.jar -d javabin
java -cp javabin:embedding/java/lib/js.jar com.google.code.sgnodemapper.TestRunner

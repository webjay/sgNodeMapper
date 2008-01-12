sgnodemapper_util: sgnodemapper_util.cc node_mapper.cc node_mapper.h
	g++  -lsmjs -o sgnodemapper_util sgnodemapper_util.cc node_mapper.cc

sgnodemapper.o: node_mapper.cc node_mapper.h
	g++ -shared -lsmjs node_mapper.cc -o sgnodemapper.so




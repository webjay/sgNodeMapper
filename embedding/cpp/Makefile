# change based on your platform
JS_ROOT=../../../js

JS_CFLAGS=-I$(JS_ROOT)/src -I$(JS_ROOT)/src/Linux_All_DBG.OBJ
JS_LIBS=-L$(JS_ROOT)/src/Linux_All_DBG.OBJ -ljs

# for debian
JS_CFLAGS += -I/usr/include/smjs

SGNLIB=libsgnodemapper.so

all: $(SGNLIB) sgnodemapper_util

$(SGNLIB): node_mapper.cc node_mapper.h
	g++ $(JS_CFLAGS) -shared -o $(SGNLIB) node_mapper.cc 

sgnodemapper_util: sgnodemapper_util.cc $(SGNLIB)
	g++ -o sgnodemapper_util $(JS_CFLAGS) $(JS_LIBS) $(SGNLIB) sgnodemapper_util.cc 

clean:
	rm -f sgnodemapper_util $(SGNLIB)


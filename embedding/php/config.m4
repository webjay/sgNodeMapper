PHP_ARG_ENABLE(sgnodemapper, whether to enable social graph node mapper support,
[ --enable-sgnodemapper   Enable social graph node mapper support])

AC_ARG_WITH([sm-obj], [AS_HELP_STRING([--with-sm-obj=dir], [location of Mozilla's spidermonkey system specific object directory])], [], [with_sm_obj=no])

if test "${with_sm_obj}" = no; then
  AC_MSG_ERROR([Spidermonkey directories not specified. Get it http://ftp.mozilla.org/pub/mozilla.org/js/older-packages/js-1.5.tar.gz/ and then run: ./configure --with-sm-src=dir_to_spidermonkey_src --with-sm-obj=dir_to_spidermonkey_objects ])
fi

if test "$PHP_SGNODEMAPPER" = "yes"; then
  AC_DEFINE(HAVE_SGNODEMAPPER, 1, [Whether you have social graph node mapper])
  PHP_NEW_EXTENSION(sgnodemapper, php_sgnodemapper.cc, $ext_shared, , -I../cpp/lib)
  PHP_REQUIRE_CXX()
  PHP_ADD_LIBRARY_WITH_PATH(sgnodemapper, ../cpp/lib, SGNODEMAPPER_SHARED_LIBADD)

  # Use this line to link dynamically with libjs, since linking with the .a may not be portable
  #PHP_ADD_LIBRARY_WITH_PATH(js, ${with_spidermonkey}/src/Linux_All_DBG.OBJ, SGNODEMAPPER_SHARED_LIBADD)
  
  # Use this line to link statically with libjs
  SGNODEMAPPER_SHARED_LIBADD="${SGNODEMAPPER_SHARED_LIBADD} ${with_sm_obj}/libjs.a"
  PHP_SUBST(SGNODEMAPPER_SHARED_LIBADD)
fi


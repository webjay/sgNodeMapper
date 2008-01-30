dnl Process this file with autoconf to produce a configure script.
AC_INIT([libsgnodemapper], [0.1], [joseph@plaxo.com])
AM_INIT_AUTOMAKE([dist-bzip2])

AC_CONFIG_SRCDIR(lib/node_mapper.cc)

AC_PROG_CXX
AC_PROG_LIBTOOL

AC_ARG_WITH([sm-src], [AS_HELP_STRING([--with-sm-src=dir], [location of Mozilla's spidermonkey src directory])], [], [with_sm_src=no])
AC_ARG_WITH([sm-obj], [AS_HELP_STRING([--with-sm-obj=dir], [location of Mozilla's spidermonkey system specific object directory])], [], [with_sm_obj=no])

if test "${with_sm_src}" = no; then
  AC_MSG_ERROR([Spidermonkey directories not specified. Get it http://ftp.mozilla.org/pub/mozilla.org/js/older-packages/js-1.5.tar.gz/ and then run: ./configure --with-sm-src=dir_to_spidermonkey_src --with-sm-obj=dir_to_spidermonkey_objects ])
fi

if test "${with_sm_obj}" = no; then
  AC_MSG_ERROR([Spidermonkey directories not specified. Get it http://ftp.mozilla.org/pub/mozilla.org/js/older-packages/js-1.5.tar.gz/ and then run: ./configure --with-sm-src=dir_to_spidermonkey_src --with-sm-obj=dir_to_spidermonkey_objects ])
fi

AC_SUBST([SM_SRC_DIR], ${with_sm_src})
AC_SUBST([SM_OBJ_DIR], ${with_sm_obj})
AC_OUTPUT(Makefile lib/Makefile util/Makefile)


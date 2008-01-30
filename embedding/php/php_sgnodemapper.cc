/**
 * Copyright 2008 Plaxo Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * For questions/comments, contact: Joseph Smarr (joseph@plaxo.com)
 */

#ifdef HAVE_CONFIG_H
#include "config.h"
#endif

#include "php.h"
#include "php_sgnodemapper.h"
#include "zend_exceptions.h"
#include "node_mapper.h"

#define PHP_SGNODEMAPPER_RES_NAME "NodeMapper"
//#define SGTRACE

using namespace sgnodemapper;

zend_module_entry SGNodeMapper_module_entry = {
#if ZEND_MODULE_API_NO >= 20010901
  STANDARD_MODULE_HEADER,
#endif
  PHP_SGNODEMAPPER_EXTNAME,
  NULL,
  PHP_MINIT(SGNodeMapper),
  NULL,
  NULL,
  NULL,
  NULL,
#if ZEND_MODULE_API_NO >= 20010901
  PHP_SGNODEMAPPER_VERSION,
#endif
    STANDARD_MODULE_PROPERTIES
};


/* decalre the class entry */
static zend_class_entry *SGNodeMapper_ce;

/* list entry for NodeMapper resource */
static int SGNodeMapper_le;


void SGNodeMapper_destruction_handler(zend_rsrc_list_entry *rsrc TSRMLS_DC) {
  NodeMapper *nm = (NodeMapper *) rsrc->ptr;
#ifdef SGTRACE
  php_printf("deleteing nm: 0x%x\n", nm);
#endif
  delete nm;
}


#ifdef COMPILE_DL_SGNODEMAPPER
ZEND_GET_MODULE(SGNodeMapper)
#endif

PHP_METHOD(SGNodeMapper, __construct)
{
  char *path;
  int path_len;

#ifdef SGTRACE
  php_printf("__construct start\n");
#endif

  if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "s", &path, &path_len) == FAILURE) {
    zend_throw_exception(zend_get_error_exception(), "Invalid arguments", -1 TSRMLS_CC);
    return;
  }

#ifdef SGTRACE
  php_printf("file name: %s\n", path);
#endif

  NodeMapper *nm = new NodeMapper(path);

#ifdef SGTRACE
  php_printf("c++ object created: 0x%x\n", nm);
#endif

  zval *znm;
  ALLOC_INIT_ZVAL(znm);
  ZEND_REGISTER_RESOURCE(znm, nm, SGNodeMapper_le); 
  zend_update_property(EG(scope), getThis(), "nm", sizeof("nm") - 1, znm);

#ifdef SGTRACE
  php_printf("__construct done\n");
#endif
}


PHP_METHOD(SGNodeMapper, __destruct) {
#ifdef SGTRACE
  php_printf("__destruct start\n");
#endif

  zval *znm =  zend_read_property(EG(scope), getThis(), "nm", sizeof("nm") - 1, 1 TSRMLS_CC);

#ifdef SGTRACE
  php_printf("zval: 0x%x\n", znm);
#endif

  if (znm)
    zend_list_delete(Z_LVAL_P(znm));

#ifdef SGTRACE
  php_printf("__destruct done\n");
#endif
}


PHP_METHOD(SGNodeMapper, graphNodeFromURL)
{
  char *URL;
  int URL_len;

  if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "s", &URL, &URL_len) == FAILURE) {
    zend_throw_exception(zend_get_error_exception(), "Invalid arguments", -1 TSRMLS_CC);
    return;
  }

#ifdef SGTRACE
  php_printf("url: %s\n", URL);
#endif

  zval *znm =  zend_read_property(EG(scope), getThis(), "nm", sizeof("nm") - 1, 1 TSRMLS_CC);

#ifdef SGTRACE
  php_printf("zval: 0x%x\n", znm);
#endif

  if (!znm) {
    zend_throw_exception(zend_get_error_exception(), "Internal error: NodeMapper zval is NULL", -1 TSRMLS_CC);
    return;
  }

  NodeMapper *nm = (NodeMapper *) zend_fetch_resource(&znm TSRMLS_CC, -1, PHP_SGNODEMAPPER_RES_NAME, NULL, 1, SGNodeMapper_le);
  if (!nm) {
    zend_throw_exception(zend_get_error_exception(), "Internal error: NodeMapper object is NULL", -1 TSRMLS_CC);
    return;
  }
  
  std::string output;
  nm->GraphNodeFromURL(URL, &output);

#ifdef SGTRACE
  php_printf("output: %s\n", output.c_str());
#endif

  RETURN_STRING((char *) output.c_str(), 1);
}

PHP_METHOD(SGNodeMapper, graphNodeToURL)
{
  char *sgnURL, *type;
  int sgnURL_len, type_len;

  if (zend_parse_parameters(ZEND_NUM_ARGS() TSRMLS_CC, "ss", &sgnURL, &sgnURL_len, &type, &type_len) == FAILURE) {
    zend_throw_exception(zend_get_error_exception(), "Invalid arguments", -1 TSRMLS_CC);
    return;
  }

#ifdef SGTRACE
  php_printf("sgnURL: %s\n", sgnURL);
  php_printf("type: %s\n", type);
#endif

  zval *znm =  zend_read_property(EG(scope), getThis(), "nm", sizeof("nm") - 1, 1 TSRMLS_CC);

#ifdef SGTRACE
  php_printf("zval: 0x%x\n", znm);
#endif

  if (!znm) {
    zend_throw_exception(zend_get_error_exception(), "Internal error: NodeMapper zval is NULL", -1 TSRMLS_CC);
    return;
  }

  NodeMapper *nm = (NodeMapper *) zend_fetch_resource(&znm TSRMLS_CC, -1, PHP_SGNODEMAPPER_RES_NAME, NULL, 1, SGNodeMapper_le);
  if (!nm) {
    zend_throw_exception(zend_get_error_exception(), "Internal error: NodeMapper object is NULL", -1 TSRMLS_CC);
    return;
  }
  
  std::string output;
  nm->GraphNodeToURL(sgnURL, type, &output);

#ifdef SGTRACE
  php_printf("output: %s\n", output.c_str());
#endif

  RETURN_STRING((char *) output.c_str(), 1);
}


ZEND_BEGIN_ARG_INFO(SGNodeMapper_graphNodeFromURL_arginfo, 0) 
  ZEND_ARG_INFO      (0, URL)
ZEND_END_ARG_INFO()

ZEND_BEGIN_ARG_INFO(SGNodeMapper_graphNodeToURL_arginfo, 0) 
  ZEND_ARG_INFO      (0, sgnURL)
  ZEND_ARG_INFO      (1, type)
ZEND_END_ARG_INFO()


zend_function_entry SGNodeMapper_methods[] = { 
  PHP_ME(SGNodeMapper, __construct, NULL, ZEND_ACC_PUBLIC) 
  PHP_ME(SGNodeMapper, __destruct, NULL, ZEND_ACC_PUBLIC) 
  PHP_ME(SGNodeMapper, graphNodeFromURL, NULL, ZEND_ACC_PUBLIC) 
  PHP_ME(SGNodeMapper, graphNodeToURL, NULL, ZEND_ACC_PUBLIC) 
  { NULL, NULL, NULL } 
}; 


/* {{{ PHP_MINIT_FUNCTION(SGNodeMapper) */
PHP_MINIT_FUNCTION(SGNodeMapper)
{
  zend_class_entry ce;

  INIT_CLASS_ENTRY(ce, "SGNodeMapper", SGNodeMapper_methods);
  SGNodeMapper_ce = zend_register_internal_class(&ce TSRMLS_CC);

  SGNodeMapper_le = zend_register_list_destructors_ex(SGNodeMapper_destruction_handler, SGNodeMapper_destruction_handler, PHP_SGNODEMAPPER_RES_NAME, module_number);

  /* If you have INI entries, uncomment these lines 
        ZEND_INIT_MODULE_GLOBALS(SGNodeMapper, php_SGNodeMapper_init_globals, NULL);
        REGISTER_INI_ENTRIES();
  */
  return SUCCESS;
}
/* }}} */

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

#ifndef PHP_SGNODEMAPPER_H
#define PHP_SGNODEMAPPER_H 1

#define PHP_SGNODEMAPPER_VERSION "1.0"
#define PHP_SGNODEMAPPER_EXTNAME "SGNodeMapper"

#ifdef ZTS 
# include "TSRM.h" 
#endif



extern zend_module_entry SGNodeMapper_module_entry;
#define phpext_SGNodeMapper_ptr &SGNodeMapper_module_entry

PHP_MINIT_FUNCTION(SGNodeMapper);
PHP_MSHUTDOWN_FUNCTION(SGNodeMapper);
PHP_RINIT_FUNCTION(SGNodeMapper);
PHP_RSHUTDOWN_FUNCTION(SGNodeMapper);
PHP_MINFO_FUNCTION(SGNodeMapper);


#endif

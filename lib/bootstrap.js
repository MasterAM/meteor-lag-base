/* global baseConfigurator:true */

'use strict';
// initialize the package configuration
baseConfigurator = new BaseConfigurator('base');
baseConfigurator.initConfig();
baseConfigurator.currentConfig.cacheCollection(baseConfigurator.getCollection());
/* global baseConfigurator:true */

'use strict';
// wrap Meteor.methods
var _methods = Meteor.methods;

Meteor.methods = function (methods) {
  return _methods.call(this, Lag.wrapMethods(methods));
};

// rewrite currently registered methods
Meteor.server.method_handlers = baseConfigurator.wrapMethods(Meteor.server.method_handlers);

// initialize the package configuration
baseConfigurator = new BaseConfigurator('base');
baseConfigurator.initConfig();
baseConfigurator.currentConfig.cacheCollection(baseConfigurator.getCollection());
/* global ConfigCache:true */

'use strict';

/**
 * create a configuration cache for a certain config level (e.g, base, method or publication)
 * @param level The config level
 * @constructor
 */
ConfigCache = function(level) {
  this.level = level;
  this.dict = new ReactiveDict();
};

_.extend(ConfigCache.prototype, {

  /**
   * Listen to changes in the collection and cache the current value.
   * @param {Meteor.Collection} collection
   */
  cacheCollection: function (collection) {
    var self = this;
    collection.find({type: 'config', level: this.level}).observe({
      added: function (attributes) {
        self.dict.set(attributes.name, attributes);
      },
      changed: function (attributes) {
        self.dict.set(attributes.name, attributes);
      }
    });
  },

  setDefault: function (config, val) {
    return this.dict.setDefault(config, val);
  },

  /**
   * Get the value for the given config option
   * @param {String}  config the config name
   * @returns {*|any} The value, if set (and active, when appropriate)
   */
  get: function (config) {
    var data = this.getRaw(config);
    if (typeof data === 'object') {
      if (typeof data.isActive === "undefined" || data.isActive === true) {
        return data.value;
      }
    }
  },

  getRaw: function(config) {
    return this.dict.get(config);
  }
});
/* global Lag:true */

'use strict';
BaseConfigurator = function (type) {
  this.type = type;
  this.currentConfig = new ConfigCache(type);
  //noinspection JSCheckFunctionSignatures
  this.namesCollection = new Mongo.Collection(null);
};

_.extend(BaseConfigurator.prototype, {
  /**
   * Default configuration options for the package.
   * Some of those will be overridden and some will be merged.
   */
  defaultConfigs: {
    "disable": false,
    "persist": false,
    "defaultDelay": 2000,
    "log": false,
    "unblock": true
  },

  /**
   * Names of the "primitive' configuration options.
   * They can be more easily cached on the server.
   */
  basicConfigNames: [
    'disable',
    'persist',
    'defaultDelay',
    'log',
    'unblock'
  ],

  /**
   * A configuration cache used for retrieving the current config
   */
  //currentConfig: null,

  /**
   * Configurator objects that were registered
   */
  knownConfigurators: {},

  /**
   * Register a configurator instance.
   * @param {Configurator} cfg
   */
  registerConfigurator: function (cfg) {
    this.knownConfigurators[cfg.type] = cfg;
  },

  /**
   * Retrieve a known configurator
   * @param   {String} type
   * @returns {Configurator}
   */
  getConfigurator: function (type) {
    return this.knownConfigurators[type];
  },

  /**
   * Sets whether the target can be unblocked.
   * @param {String}  name          target name
   * @param {boolean} forceBlocking the setting value
   */
  setForceBlocking: function (name, forceBlocking) {
    this.getCollection().upsert({type: this.type, name: name}, {$set: {isBlocking: forceBlocking}});
  },

  setInitialized: function () {
    this.getCollection().upsert({type: 'state', name: 'initialized', level: this.type}, {$set: {value: true}});
  },

  initConfig: function(){
    //apply meteor settings, if set
    var configs = this._getConfigOptions();
    var actualCollectionName = null;

    configs = this.applyDefaults(configs);

    //set default config values in the dict
    this.initializeDict(configs);
    if (configs.persist) {
      actualCollectionName = this.collectionName;
    }

    this.setCollection(new Mongo.Collection(actualCollectionName));

    if (!configs.persist || !this.isInitialized()) {
      // only apply settings if not persistent or if this is the first time a persistent state is set
      this.applySettings(configs);
    } else if (typeof configs.disable === "boolean") {
      // if persistent and initialized, but the `disable` property is explicitly set,
      // it is applied so that it will be fairly easy to enable/disable the package
      // without using the shell or front end control UI
      this.applySettings({disable: configs.disable});
    }
    this.setInitialized();
  },

  _getConfigOptions: function() {
    return this._resolve(Meteor, 'settings.lagConfig.base') || {};
  },

  /**
   * Resolve a path within an object
   * from http://stackoverflow.com/a/22129960/268093
   * @param path
   * @param obj
   * @returns {*}
   */
  _resolve: function (obj, path) {
    return path.split('.').reduce(function(prev, curr) {
      return prev ? prev[curr] : undefined;
    }, obj || self)
  },

  isInitialized: function() {
    return !!this.getCollection().findOne({type: 'state', name: 'initialized', value: true, level: this.type});
  },

  /**
   * Initializes the configuration dictionary with the basic configuration options
   * @param configs
   */
  initializeDict: function (configs) {
    var self = this;
    _.each(this.basicConfigNames, function (name) {
      self.currentConfig.setDefault(name, configs[name]);
    });
  },

 /**
   * convenience method for processing the data from a json settings file.
   * @param  {Object} config configuration options
   * @return {[type]}          [description]
   */
  applySettings: function (config) {
    //set simple properties.
    var self = this;
    var configCollection = this.getCollection();
    _.each(this.basicConfigNames, function(propName) {
      if (config.hasOwnProperty(propName)) {
        self.setConfigOption(propName, config[propName]);
      }
    });
  },

  /**
   * Get the value of one of the configuration options.
   * @param {String} optionName the name of the configuration option
   * @returns {*}    the current value associated with the option
   */
  getConfigOption: function(optionName) {
    var record;
    if (_.contains(this.basicConfigNames, optionName)) {
      return this.currentConfig.get(optionName);
    }
    record = this.getCollection().findOne({type: 'config', name: optionName, level: this.type});
    if (record) {
      return record.value;
    }
    console.warn('lag-base: attempted to get an option that was not set: ', optionName);
    return this.defaultConfigs[optionName];
  },

  setConfigOption: function (propName, value) {
    this.getCollection().upsert(
      {
        type: 'config',
        name: propName,
        level: this.type
      },
      {
        $set:
        {
          value: value
        }
      }
    );
  },

  /**
   * Apply defaults to the config object.
   * @param {Object} config the config object to extend
   * @returns {Object}      the extended config object
   */
  applyDefaults: function(config) {
    //add default configuration options
    return _.extend({}, this.defaultConfigs, config);
  },

  /**
   * Gets the configuration collection
   * @returns {Mongo.Collection} the collection
   */
  getCollection: function () {
    return this.collection;
  },

  setCollection: function (collection) {
    this.collection = collection;
  },

  /**
   * Gets the target names collection
   * @returns {Mongo.Collection} the collection
   */
  getNamesCollection: function () {
    return this.namesCollection;
  }

});


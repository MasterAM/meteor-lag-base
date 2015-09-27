'use strict';

/**
 * A configurator abstraction that can be configured to handle both methods and publications
 * @param {String}            type the type of this configurator
 * @param {BaseConfigurator}  base the base configurator instance
 * @param {Object} options    various configuration options, including exclusion list, custom delays and
 *                            forced blocking targets
 * @constructor
 */
Configurator = function (type, base, options) {
  this.type = type;
  this.currentConfig = new ConfigCache(type);
  this.base = base;
  this.initDefaultConfigs(options);
  this.initConfig();
  this.initCache();
};

_.extend(Configurator.prototype, {
  /**
   * Default configuration options for the package.
   * Some of those will be overridden and some will be merged.
   */
  defaultBasicConfigs: {
    "usePredefinedExcludes": true
  },

  /**
   * Those configs also exist in the base configurator.
   * Therefore, they may be either set in this level or not.
   * If set (and therefore appear in the collection with `isActive: true`),
   * they are taken into account when calculating the config value.
   */
  secondLevelConfigs: [
    'disable'
  ],

  /**
   * A configuration cache used for retrieving the current config
   * @property {ConfigCache}
   */
  //currentConfig: null,

  /**
   * Names of the "primitive' configuration options.
   * They can be more easily cached on the server.
   */
  basicConfigNames: [
    'disable',
    'usePredefinedExcludes'
  ],

  /**
   * Names of the "complex" configuration options.
   */
  customConfigNames: [
    'delays',
    'exclude',
    'forceBlocking'
  ],

  /**
   * Initialize the default configs
   * @param options Default options fo the parameters in this.customConfigNames
   */
  initDefaultConfigs: function(options) {
    this.defaultConfigs = _.extend(
      {},
      this.defaultBasicConfigs,
      {
        delays: {},
        exclude: [],
        forceBlocking: []
      },
      _.pick(options, this.customConfigNames)
    );
  },

  /**
   * Get the delay for a given name. If no delay is set, returns the default delay.
   * @param  {String} name the target name
   * @return {Number}      the delay for the given target
   */
  getDelay: function(name) {
    var target, delay, isDisabled;

    isDisabled = this.isDisabled();

    if (isDisabled) {
      return 0;
    }

    delay = this.getConfigOption('defaultDelay');

    target = this.getCollection().findOne({type: this.type, name: name});
    if (target) {
      if (target.isExcluded) {
        delay = 0;
      } else if ("number" == typeof target.delay) {
        delay = target.delay;
      }
    }
    return delay;
  },

  /**
   * Is delay for the current type disabled?
   * If either the main disable option of the overriden disable option are set to true,
   * the current type will not be delayed.
   * @returns {boolean} whether the current type is disabled
   */
  isDisabled: function () {
    // get the local 'disable' config option, if set.
    var local = this.currentConfig.get('disable');

    // it is disabled if the config option is set to true
    return !!(local || this.base.getConfigOption('disable'));
  },

  /**
   * Gets the value of a second level config option if it is set and active.
   * This scenario should generally be handled by the cache.
   * @param name the configuration name
   */
  getActiveConfig: function(name) {
    var record = this.getCollection().find({type: 'config', name: 'disable', isActive: true});
    return record && record.value;
  },

  /**
   * Whether or not to unblock targetName.
   * @param {String} targetName the target name
   * @returns {Boolean} Whether the target should be unblocked
   */
  shouldUnblock: function(targetName) {
    return this.base.getConfigOption('unblock') && !this.isBlocking(targetName);
  },

  /**
   * Wheter or not the given target is configured not to use `unblock`.
   * @param {String} name the target name
   * @returns {boolean} true if we should not call unblock() before delaying the target.
   */
  isBlocking: function(name) {
    var target = this.getCollection().findOne({type: this.type, name: name});

    if (!target) {
      return false;
    }
    return !!(target.isBlocking);
  },

  /**
   * Sets a delay for a given target name.
   * @param {String} name  target name
   * @param {Number} delay delay in ms
   */
  addDelay: function(name, delay) {
    check(name, String);
    check(delay, Number);
    this.getCollection().upsert({type: this.type, name: name}, {$set: {delay: delay}});
  },

  /**
   * Clears any delay for a given target name.
   * @param {String} name  target name
   */
  clearDelay: function(name) {
    check(name, String);
    this.getCollection().upsert({type: this.type, name: name}, {$unset: {delay: 1}});
  },

  exclude: function(name, doExclude) {
    this.getCollection().upsert({type: this.type, name: name}, {$set: {isExcluded: doExclude}});
  },

  setForceBlocking: function (name, forceBlocking) {
    this.getCollection().upsert({type: this.type, name: name}, {$set: {isBlocking: forceBlocking}});
  },

  setInitialized: function () {
    this.getCollection().upsert({type: 'state', name: 'initialized'}, {$set: {value: true}});
  },

  initConfig: function(){
    //apply meteor settings, if set
    var actualCollectionName = null;
    var configs = this._getConfigOptions();

    configs = this.applyDefaults(configs);

    if (configs.persist) {
      actualCollectionName = this.collectionName;
    }

    if (!configs.persist || !this.isInitialized()) {
      // only apply settings if not persistent or if this is the first time a persistent state is set
      this.applySettings(configs);
    } else if (typeof configs.disable === "boolean") {
      // or if the `disabled` property is explicitly set
      this.applySettings({disable: configs.disable});
    }
    this.setInitialized();
  },

  _getConfigOptions: function() {
    return this.base._resolve(Meteor, 'settings.lagConfig.' + this.type) || {};
  },

  initCache: function () {
    this.currentConfig.cacheCollection(this.getCollection())
  },

  isInitialized: function() {
    return !!this.getCollection().findOne({type: 'state', name: 'initialized', level: this.type, value: true});
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

        var modifier = {$set: {value: config[propName]}};
        if (_.contains(self.secondLevelConfigs, propName)) {
          modifier.$set.isActive = true;
        }
        configCollection.upsert({type: 'config', name: propName, level: self.type}, modifier);
      }
    });

    if (config.hasOwnProperty('exclude')) {
      // include all existing targets
      configCollection.update({type: this.type}, {$set:{excluded: false}}, {multi: true});
      //and exclude selected
      _.each(config.exclude, function (targetName) {
        self.exclude(targetName, true);
      });
    }

    if (config.hasOwnProperty('delays')) {
      //unset all delays
      configCollection.update({type: this.type}, {$unset: {delay: 1}}, {multi: true});
      //and set only the relevant ones
      _.each(config.delays, function (delay, targetName) {
        self.addDelay(targetName, delay);
      });
    }

    if (config.hasOwnProperty('forceBlocking')) {
      //unset all
      configCollection.update({type: this.type}, {$unset: {isBlocking: 1}}, {multi: true});
      //and set only the relevant ones
      _.each(config.forceBlocking, function (targetName) {
        self.setForceBlocking(targetName, true);
      });
    }
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
    return this.base.getConfigOption(optionName);
  },

  /**
   * Apply defaults to the config object.
   * @param {Object} config the config object to extend
   * @returns {Object}      the extended config object
   */
  applyDefaults: function(config) {

    //add default configuration options
    config = _.extend(
      _.omit(this.defaultConfigs, ['exclude', 'forceBlocking']),
      config
    );

    //merge excludes
    if (this.base.getConfigOption('usePredefinedExcludes')) {
      config.exclude = _.union(config.exclude || [], this.defaultConfigs.exclude);
    }

    //and forced blocking
    config.forceBlocking = _.union(config.forceBlocking || [], this.defaultConfigs.forceBlocking);

    return config;
  },
  getCollection: function () {
    return this.base.getCollection();
  },

  /**
   * Gets the mongo collection that contains the target names
   * @returns {Mongo.Collection} the collection
   */
  getNamesCollection: function () {
    return this.base.getNamesCollection();
  }
});


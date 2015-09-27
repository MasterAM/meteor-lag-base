/* global API:true */

'use strict';

/**
 * The lag-methods configurator.
 * It is exported and may be used for changing the lag settings from the server code of shell
 * @type {Object}
 */
API = {
  /**
   * Gets the current default delay
   * @returns {Number} current delay, in ms
   */
  getDefaultDelay: function () {
    return baseConfigurator.getConfigOption("defaultDelay");
  },

  /**
   * Set the default delay for methods.
   * @example
   * //sets the default delay to 1500 ms
   * LagMethods.setDefaultDelay(1500);
   * @param  {Number} delay the default delay to set (in ms)
   * @return {Number}       the previous delay value
   */
  setDefaultDelay: function(delay) {
    check(delay, Number);
    var old_delay = this.getDefaultDelay();
    baseConfigurator.setConfigOption("defaultDelay", delay);
    return old_delay;
  },

  /**
   * Get the delay for a given target name (or the default delay if it is not explicitly set).
   * @param   {String} type the type of target (publication/method)
   * @param   {String} name the target name
   * @returns {Number}      the delay, in ms
   */
  getDelayFor: function(type, name) {
    return baseConfigurator.getConfigurator(type).getDelay(name);
  },

  /**
   * Set the delays for specific methods.
   * Specify the delays in an object which keys are method names:
   * @example
   * LagMethods.setDelaysFor('method', {
    *   'baz': 1500,
    *   ...
    * });
   * @param {String}  type    the target type
   * @param {Object}  delays  a key-value collection of method names and delays
   */
  setDelaysFor: function(type, delays) {
    var name;
    var configurator = baseConfigurator.getConfigurator(type);

    for (name in delays) if (delays.hasOwnProperty(name)) {
      configurator.addDelay(name, delays[name]);
    }
  },

  /**
   * Set the delays for specific targets.
   * Specify the delays in an object which keys are method names:
   * @example
   * // prevent delay for methods 'foo' and 'bar'
   * LagMethods.setExcludeForMethods('method', [
   *   'foo',
   *   'bar'
   * ], true);
   * @param {String}  type      the target type
   * @param {Array}   names     an array of method names
   * @param {Boolean} doExclude whether or not to replace exclude given methods
   */
  setExclude: function(type, names, doExclude) {
    var configurator = baseConfigurator.getConfigurator(type);

    _.each(names, function(name) {
      configurator.exclude(name, doExclude);
    });
  },

  /**
   * Sets the config options to those specified.
   * @param {Object} configs a configuration object, as the one in the json config file
   */
  setConfigOptions: function(configs) {
    baseConfigurator.applySettings(configs);
  },

  /**
   * Gets the configuration collection.
   * @returns {Mongo.Collection}
   * @private
   */
  _getLagCollection: function () {
    return baseConfigurator.getCollection();
  },

  /**
   * Returns the target names collection.
   * @returns {Mongo.Collection}
   * @private
   */
  _getNamesCollection: function () {
    return baseConfigurator.getNamesCollection();
  },

  /**
   * Returns the base configurator.
   * @returns {BaseConfigurator}
   * @private
   */
  _getBaseConfigurator: function () {
    return baseConfigurator;
  }
};

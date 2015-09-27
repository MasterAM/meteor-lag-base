/**
 *
 * @param {Configurator} configurator
 * @constructor
 */
Wrapper = function (configurator) {
  this.type = configurator.type;
  this.configurator = configurator;
};

_.extend(Wrapper.prototype, {

  /**
   * Wrap a target (method/publication) with a delayed version.
   * @param  {String}   name of the target
   * @param  {Function} fn   the original handler (as passed to Meteor.method or Meteor.publish)
   * @return {Function}      The wrapped function
   */
  wrap: function(name, fn) {
    var cfg = this.configurator;
    this.configurator.getNamesCollection().insert({name: name, type: this.type});

    return function() {
      var delay = cfg.getDelay(name);

      if (cfg.getConfigOption('log')) {
        console.log('[alon:lag-%ss] (delay: %d ms) %s: %s', cfg.type, delay, cfg.type, name);
      }

      if (delay > 0) {
        if (cfg.shouldUnblock(name)) {
          this.unblock();
        }
        Meteor._sleepForMs(delay);
      }
      return fn.apply(this, arguments);
    }
  },

  /**
   * A convenience method for generating a list of wrapped targets out of an existing one.
   * @param  {Object} targets a dictionary of targets
   * @return {Object}         a dictionary of wrapped targets
   */
  wrapArray: function(targets) {
    var name;

    for (name in targets) if (targets.hasOwnProperty(name)) {
      targets[name] = this.wrap(name, targets[name]);
    }

    return targets;
  }
});
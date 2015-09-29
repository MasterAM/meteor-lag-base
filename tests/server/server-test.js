//Test API:
//test.isFalse(v, msg)
//test.isTrue(v, msg)
//test.equal(actual, expected, message, not)
//test.length(obj, len)
//test.include(s, v)
//test.isNaN(v, msg)
//test.isUndefined(v, msg)
//test.isNotNull
//test.isNull
//test.throws(func)
//test.instanceOf(obj, klass)
//test.notEqual(actual, expected, message)
//test.runId()
//test.exception(exception)
//test.expect_fail()
//test.ok(doc)
//test.fail(doc)
//test.equal(a, b, msg)


Meteor.settings = Meteor.settings || {};
Meteor.settings.lagConfig = Meteor.settings.lagConfig || {};

var api = Package['alon:lag-base'].API;
var Configurator = Package['alon:lag-base'].Configurator;
var Wrapper = Package['alon:lag-base'].Wrapper;
var configCollection = api._getConfigCollection();

var setConfig = function (configName, value, level) {
  configCollection.upsert({type: 'config', name: configName, level: level}, {$set: {value: value}})
};

Tinytest.add('make sure that the exports are available', function (test) {
  test.isTrue(typeof api === 'object', 'the API is available');
  test.isTrue(typeof Configurator === 'function', 'the configurator is available');
  test.isTrue(typeof Wrapper === 'function', 'the wrapper is available');
});

Tinytest.add("setting delay", function (test) {
  var base = api._getBaseConfigurator();
  var delay = 5000;
  test.equal(api.setDefaultDelay(delay), base.defaultConfigs.defaultDelay, 'default delay returned from setter');
  test.equal(api.setDefaultDelay(base.defaultConfigs.defaultDelay), delay, 'default delay successfully set');
});

Tinytest.add("setting disable", function (test) {
  var base = api._getBaseConfigurator();
  test.equal(base.getConfigOption('disable'), false);
  base.setConfigOption('disable', true);
  test.equal(base.getConfigOption('disable'), true);
  base.setConfigOption('disable', false);
});

Tinytest.add("derived configurator", function (test) {
  var base = api._getBaseConfigurator();
  var cfg = new Configurator('foo', base, {
    disable: true,
    delays: {
      'bar': 500,
      'baz': 300
    },
    exclude: [
      'me'
    ]
  });

  test.isTrue(cfg.getConfigOption('disable'), 'sub is disabled according to config object');

  test.isTrue(cfg.isDisabled(), 'sub is disabled by own config');

  test.equal(api.getDelayFor('foo', 'foo'), 0);
  test.equal(api.getDelayFor('foo', 'bar'), 0);
  test.equal(api.getDelayFor('foo', 'baz'), 0);
  test.equal(api.getDelayFor('foo', 'me'), 0);

  setConfig('disable', false, 'foo');

  test.isFalse(cfg.isDisabled(), 'sub is enabled');

  test.equal(api.getDelayFor('foo', 'foo'), base.defaultConfigs.defaultDelay);
  test.equal(api.getDelayFor('foo', 'bar'), 500);
  test.equal(api.getDelayFor('foo', 'baz'), 300);
  test.equal(api.getDelayFor('foo', 'me'), 0);

  base.setConfigOption('disable', true);

  test.isTrue(cfg.isDisabled(), 'sub is disabled by main config');

  test.equal(api.getDelayFor('foo', 'foo'), 0);
  test.equal(api.getDelayFor('foo', 'bar'), 0);
  test.equal(api.getDelayFor('foo', 'baz'), 0);
  test.equal(api.getDelayFor('foo', 'me'), 0);

  base.setConfigOption('disable', false);

});

Tinytest.add("derived configurator from json", function (test) {
  var base = api._getBaseConfigurator();

  Meteor.settings.lagConfig.bars = {
    disable: true,
    delays: {
      'bar': 500,
      'baz': 300
    },
    exclude: [
      'me'
    ]
  };

  var cfg = new Configurator('bar', base);

  test.isTrue(cfg.getConfigOption('disable'), 'sub is disabled according to config object');

  test.isTrue(cfg.isDisabled(), 'sub is disabled by own config');

  test.equal(api.getDelayFor('bar', 'foo'), 0);
  test.equal(api.getDelayFor('bar', 'bar'), 0);
  test.equal(api.getDelayFor('bar', 'baz'), 0);
  test.equal(api.getDelayFor('bar', 'me'), 0);

  setConfig('disable', false, 'bar');

  test.isFalse(cfg.isDisabled(), 'sub is enabled');

  test.equal(api.getDelayFor('bar', 'foo'), base.defaultConfigs.defaultDelay);
  test.equal(api.getDelayFor('bar', 'bar'), 500);
  test.equal(api.getDelayFor('bar', 'baz'), 300);
  test.equal(api.getDelayFor('bar', 'me'), 0);

  base.setConfigOption('disable', true);

  test.isTrue(cfg.isDisabled(), 'sub is disabled by main config');

  test.equal(api.getDelayFor('bar', 'foo'), 0);
  test.equal(api.getDelayFor('bar', 'bar'), 0);
  test.equal(api.getDelayFor('bar', 'baz'), 0);
  test.equal(api.getDelayFor('bar', 'me'), 0);

  base.setConfigOption('disable', false);

});
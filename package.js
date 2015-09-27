Package.describe({
  name: 'alon:lag-base',
  summary: 'A base package for simulating network lag.',
  version: '1.0.0',
  git: 'https://github.com/MasterAM/meteor-lag-base',
  documentation: 'README.md',
  debugOnly: true
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.1');
  api.use(['check', 'underscore', 'reactive-dict', 'mongo']);
  api.addFiles([
    'lib/globals.js',
    'lib/caching.js',
    'lib/wrapper.js',
    'lib/base_configurator.js',
    'lib/configurator.js',
    'lib/api.js',
    'lib/bootstrap.js'
  ], 'server');
  api.export(['API', 'Configurator', 'Wrapper'], 'server');
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('alon:lag-methods');
  api.addFiles('tests/server/configs.js', 'server');
  api.addFiles('tests/server/server-test.js', 'server');
  api.addFiles('tests/client/client-test.js', 'client');
});

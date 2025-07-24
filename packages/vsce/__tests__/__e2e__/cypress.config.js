const { defineConfig } = require('cypress');

module.exports = defineConfig({
  fixturesFolder: 'fixtures',
  e2e: {
    setupNodeEvents(on, config) {
      return require('./plugins/index.js')(on, config);
    },
    experimentalStudio: true,
    specPattern: 'integration/**/*.spec.js',
    supportFile: 'support/index.js',
  },
});

import { defineConfig } from "cypress";

module.exports = defineConfig({
  fixturesFolder: false,
  e2e: {
    experimentalStudio: true,
    specPattern: 'integration/**/*.spec.ts',
    supportFile: 'support/index.ts',
  },
});

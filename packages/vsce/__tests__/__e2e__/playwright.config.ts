import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./specs/",
  fullyParallel: false,
  reporter: "list",
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  retries: 2,

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

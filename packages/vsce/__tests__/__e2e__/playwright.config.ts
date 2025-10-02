/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 */

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
      use: { ...devices["Desktop Chrome"], permissions: ["clipboard-read"] },
    },
  ],
});

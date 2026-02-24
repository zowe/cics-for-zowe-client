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

import { Config } from "jest";

const baseConfig: Config = {
  maxWorkers: "100%",
  testTimeout: 600000,
  displayName: "CICS for Zowe Client",
  clearMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!**/__tests__/**",
    "!**/index.ts",
    "!**/main.ts"
  ],
  coverageDirectory: "__tests__/__results__/unit/coverage",
  coveragePathIgnorePatterns: [
    "<rootDir>/__tests__/__e2e__"
  ],
  coverageProvider: "v8",
  coverageReporters: [
    "json",
    "lcov",
    "text",
    "cobertura"
  ],
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "json"
  ],
  modulePathIgnorePatterns: [
    "__tests__/__snapshots__/"
  ],
  reporters: [
    "default",
    ["jest-junit", {
      outputFile: "__tests__/__results__/unit/junit.xml",
      ancestorSeparator: " > ",
      classNameTemplate: "unit.{classname}",
      title: "{title}"
    }],
  ],
  testEnvironment: "node",
  testPathIgnorePatterns: [
    "<rootDir>/__tests__/__results__",
    ".*/__system__/.*",
    "<rootDir>/__tests__/__e2e__"
  ],
  testRegex: "(test|spec)\\.ts$",
  transform: {
    ".(ts|tsx)": "ts-jest"
  },
  transformIgnorePatterns: [
    "^.+\\.cjs$",
    "^.+\\.js$",
    "^.+\\.json$"
  ],
};

module.exports = baseConfig;

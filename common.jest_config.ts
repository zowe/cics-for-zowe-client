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

import type { Config } from 'jest';

// Extracted from @jest/types
export declare interface ConfigGlobals {
  [K: string]: unknown;
}

export function createConfig(testType: string, title: string): Config {
  const isUnit = testType.toLowerCase() === "unit";
  return {
    maxWorkers: isUnit ? "100%" : 1,
    testTimeout: 600000,
    displayName: title,
    modulePathIgnorePatterns: ["__tests__/__snapshots__/"],
    transform: { ".(ts)": "ts-jest" },
    transformIgnorePatterns: [ "^.+\\.js$", "^.+\\.json$" ],
    testRegex: "(test|spec)\\.ts$",
    moduleFileExtensions: ["ts", "js", "json"],
    testPathIgnorePatterns: ["<rootDir>/__tests__/__results__", `.*/__${isUnit ? "system" : "unit"}__/.*`],
    testEnvironment: "node",
    collectCoverage: isUnit,
    coverageReporters: ["json", "lcov", "text", "cobertura"],
    coverageDirectory: `__tests__/__results__/${testType}/coverage`,
    collectCoverageFrom: [
      "src/**/*.ts",
      "!**/__tests__/**",
      "!**/index.ts",
      "!**/main.ts"
    ],
    reporters: [
      "default",
      ["jest-junit", {
        outputFile: `__tests__/__results__/${testType}/junit.xml`,
        ancestorSeparator: " > ",
        classNameTemplate: `${testType}.{classname}`,
        title: "{title}"
      }],
      ["jest-stare", {
        resultDir: `__tests__/__results__/${testType}/jest-stare`,
        coverageLink: "../coverage/lcov-report/index.html",
        resultHtml: "index.html"
      }],
      ["jest-html-reporter", {
        pageTitle: title,
        outputPath: `__tests__/__results__/${testType}/results.html`,
        includeFailureMsg: true
      }],
    ],
  };
}
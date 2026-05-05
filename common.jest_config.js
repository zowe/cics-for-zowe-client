"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConfig = void 0;
function createConfig(testType, title) {
    var isUnit = testType.toLowerCase() === "unit";
    return {
        maxWorkers: isUnit ? "100%" : 1,
        testTimeout: 600000,
        displayName: title,
        modulePathIgnorePatterns: ["__tests__/__snapshots__/"],
        transform: { ".(ts|tsx)": "ts-jest" },
        transformIgnorePatterns: ["^.+\\.cjs$", "^.+\\.js$", "^.+\\.json$"],
        testRegex: "(test|spec)\\.ts$",
        moduleFileExtensions: ["ts", "tsx", "js", "json"],
        testPathIgnorePatterns: ["<rootDir>/__tests__/__results__", ".*/__".concat(isUnit ? "system" : "unit", "__/.*"), "<rootDir>/__tests__/__e2e__"],
        testEnvironment: "node",
        collectCoverage: isUnit,
        coverageReporters: ["json", "lcov", "text", "cobertura"],
        coverageDirectory: "__tests__/__results__/".concat(testType, "/coverage"),
        coveragePathIgnorePatterns: ["<rootDir>/__tests__/__e2e__"],
        collectCoverageFrom: [
            "src/**/*.ts",
            "!**/__tests__/**",
            "!**/index.ts",
            "!**/main.ts"
        ],
        reporters: [
            "default",
            ["jest-junit", {
                    outputFile: "__tests__/__results__/".concat(testType, "/junit.xml"),
                    ancestorSeparator: " > ",
                    classNameTemplate: "".concat(testType, ".{classname}"),
                    title: "{title}"
                }],
            ["jest-stare", {
                    resultDir: "__tests__/__results__/".concat(testType, "/jest-stare"),
                    coverageLink: "../coverage/lcov-report/index.html",
                    resultHtml: "index.html"
                }],
            ["jest-html-reporter", {
                    pageTitle: title,
                    outputPath: "__tests__/__results__/".concat(testType, "/results.html"),
                    includeFailureMsg: true
                }],
        ],
    };
}
exports.createConfig = createConfig;

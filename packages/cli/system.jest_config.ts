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

const baseConfig = require("../../jest.config.ts");

const conf: Config = {
    ...baseConfig,
    displayName: "Zowe CICS CLI System Tests",
    maxWorkers: 1,
    collectCoverage: false,
    coverageDirectory: "__tests__/__results__/system/coverage",
    testPathIgnorePatterns: [
        "<rootDir>/__tests__/__results__",
        ".*/__unit__/.*",
        "<rootDir>/__tests__/__e2e__"
    ],
    reporters: [
        "default",
        ["jest-junit", {
            outputFile: "__tests__/__results__/system/junit.xml",
            ancestorSeparator: " > ",
            classNameTemplate: "system.{classname}",
            title: "{title}"
        }],
    ],
}

module.exports = conf;

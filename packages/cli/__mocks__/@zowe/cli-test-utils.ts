/*
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 */

const original = jest.requireActual("@zowe/cli-test-utils") as any;
const nodePath = require("path");
original.PROJECT_ROOT_DIR = nodePath.join(__dirname, "..", "..");
original.TEST_RESOURCE_DIR = nodePath.join(original.PROJECT_ROOT_DIR, "__tests__", "__resources__") + "/";
original.TEST_RESULT_DIR = nodePath.join(original.PROJECT_ROOT_DIR, "__tests__", "__results__") + "/";
original.TEST_RESULT_DATA_DIR = nodePath.join(original.TEST_RESULT_DIR, "data") + "/";
module.exports = original;

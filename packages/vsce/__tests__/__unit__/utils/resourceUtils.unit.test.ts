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

import type { Extension } from "vscode";
import * as vscode from "vscode";

const getExtSpy = jest.spyOn(vscode.extensions, "getExtension");

import { buildUserAgentHeader } from "../../../src/utils/resourceUtils";

describe("Resource Utils", () => {

  it("should build user agent string", () => {
    getExtSpy.mockReturnValue({
      packageJSON: {
        version: "1.2.3",
      }
    } as Extension<any>);

    const userAgent = buildUserAgentHeader();
    expect(userAgent).toEqual({ "User-Agent": "zowe.cics-extension-for-zowe/1.2.3 zowe.vscode-extension-for-zowe/1.2.3" });
  });
});

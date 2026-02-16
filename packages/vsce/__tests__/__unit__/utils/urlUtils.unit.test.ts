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

import * as vscode from "vscode";
import { openDocumentation } from "../../../../vsce/src/utils/urlUtils";
const uriParseSpy = jest.spyOn(vscode.Uri, "parse");
const openExternalSpy = jest.spyOn(vscode.env, "openExternal");

describe("Test suite for UrlUtils - openDocumentation", () => {
  const BASE_PATH = "/docs/en/SSJL4D_6.x/reference-system-programming/commands-spi";
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should open documentation for 'program' resource with correct URL", async () => {
    await openDocumentation("program");
    expect(openExternalSpy).toHaveBeenCalledTimes(1);
    expect(uriParseSpy).toHaveBeenCalledTimes(1);
    expect(openExternalSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        authority: "www.ibm.com",
        path: `${BASE_PATH}/dfha8_setprogram.html`,
        scheme: "https",
        fragment: "dfha8fq__title__6",
      })
    );
  });

  it("should open documentation for 'bundle' resource with correct URL", async () => {
    await openDocumentation("bundle");
    expect(openExternalSpy).toHaveBeenCalledTimes(1);
    expect(uriParseSpy).toHaveBeenCalledTimes(1);
    expect(openExternalSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        authority: "www.ibm.com",
        path: `${BASE_PATH}/dfha8_setbundle.html`,
        scheme: "https",
        fragment: "dfha8_setbundle__title__6",
      })
    );
  });

  it("should open documentation for 'tsqueue' resource with correct URL", async () => {
    await openDocumentation("tsqueue");
    expect(openExternalSpy).toHaveBeenCalledTimes(1);
    expect(uriParseSpy).toHaveBeenCalledTimes(1);
    expect(openExternalSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        authority: "www.ibm.com",
        path: `${BASE_PATH}/dfha8_settsqueue.html`,
        scheme: "https",
        fragment: "dfha8gg__title__6",
      })
    );
  });

  it("should open documentation for 'transaction' resource with correct URL", async () => {
    await openDocumentation("transaction");
    expect(openExternalSpy).toHaveBeenCalledTimes(1);
    expect(uriParseSpy).toHaveBeenCalledTimes(1);
    expect(openExternalSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        authority: "www.ibm.com",
        path: `${BASE_PATH}/dfha8_settransaction.html`,
        scheme: "https",
        fragment: "dfha8gf__title__6",
      })
    );
  });
});

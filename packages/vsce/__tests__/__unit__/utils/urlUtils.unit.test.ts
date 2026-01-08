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
  const BASE_URL = "https://www.ibm.com/docs/en/cics-ts/6.x";
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should open documentation for 'program' resource with correct URL", async () => {
    await openDocumentation("program");
    expect(openExternalSpy).toHaveBeenCalledTimes(1);
    expect(uriParseSpy).toHaveBeenCalledWith(BASE_URL);
    expect(openExternalSpy).toHaveBeenCalledWith(
      expect.objectContaining({ authority: "www.ibm.com", path: "/docs/en/cics-ts/6.x", scheme: "https", query: "topic=sc-set-program" })
    );
  });

  it("should open documentation for 'bundle' resource with correct URL", async () => {
    await openDocumentation("bundle");
    expect(openExternalSpy).toHaveBeenCalledTimes(1);
    expect(uriParseSpy).toHaveBeenCalledWith(BASE_URL);
    expect(openExternalSpy).toHaveBeenCalledWith(
      expect.objectContaining({ authority: "www.ibm.com", path: "/docs/en/cics-ts/6.x", scheme: "https", query: "topic=sc-set-bundle" })
    );
  });

  it("should open documentation for 'tsqueue' resource with correct URL", async () => {
    await openDocumentation("tsqueue");
    expect(openExternalSpy).toHaveBeenCalledTimes(1);
    expect(uriParseSpy).toHaveBeenCalledWith(BASE_URL);
    expect(openExternalSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        authority: "www.ibm.com",
        path: "/docs/en/cics-ts/6.x",
        scheme: "https",
        query: "topic=commands-set-tsqueue-tsqname",
      })
    );
  });

  it("should open documentation for 'transaction' resource with correct URL", async () => {
    await openDocumentation("transaction");
    expect(openExternalSpy).toHaveBeenCalledTimes(1);
    expect(uriParseSpy).toHaveBeenCalledWith(BASE_URL);
    expect(openExternalSpy).toHaveBeenCalledWith(
      expect.objectContaining({ authority: "www.ibm.com", path: "/docs/en/cics-ts/6.x", scheme: "https", query: "topic=commands-set-transaction" })
    );
  });

  it("should open default documentation if resourcetype is undefined", async () => {
    await openDocumentation();
    expect(openExternalSpy).toHaveBeenCalledWith(
      expect.objectContaining({ authority: "www.ibm.com", path: "/docs/en/cics-ts/6.x", scheme: "https" })
    );
    expect(uriParseSpy).toHaveBeenCalledWith(BASE_URL);
  });
});

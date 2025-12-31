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

jest.mock("vscode", () => {
  const createMockUri = (url: string): any => ({
    _url: url,
    with: jest.fn((change: any): any => {
      if (change.query) {
        return createMockUri(`${url}?${change.query}`);
      }
      return createMockUri(url);
    }),
  });

  return {
    env: {
      openExternal: jest.fn().mockResolvedValue(true),
    },
    l10n: {
      t: jest.fn((message: string) => message),
    },
    Uri: {
      parse: jest.fn((url: string) => createMockUri(url)),
    },
  };
});

describe("Test suite for UrlUtils - openDocumentation", () => {
  const BASE_URL = "https://www.ibm.com/docs/en/cics-ts/6.x";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should open documentation for 'program' resource with correct URL", async () => {
    await openDocumentation("program");

    expect(vscode.env.openExternal).toHaveBeenCalledTimes(1);
    expect(vscode.Uri.parse).toHaveBeenCalledWith(BASE_URL);

    const calledUri = (vscode.env.openExternal as jest.Mock).mock.calls[0][0];
    expect(calledUri._url).toBe(`${BASE_URL}?topic=sc-set-program`);
  });

  it("should open default documentation if resourcetype is undefined", async () => {
    await openDocumentation();

    const calledUri = (vscode.env.openExternal as jest.Mock).mock.calls[0][0];
    expect(vscode.Uri.parse).toHaveBeenCalledWith(BASE_URL);
    expect(calledUri._url).toBe(BASE_URL);
  });
});

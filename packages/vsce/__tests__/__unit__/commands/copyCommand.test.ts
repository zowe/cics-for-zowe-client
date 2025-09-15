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

jest.spyOn(vscode.extensions, "getExtension").mockReturnValue({
  packageJSON: {
    version: "1.2.3",
  }
} as Extension<any>);

jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {},
}));


import { copyUserAgentHeaderToClipboard, copyResourceNameToClipboard } from "../../../src/commands/copyCommand";
import { CICSRegionTree, CICSResourceContainerNode, CICSSessionTree, CICSTree } from "../../../src/trees";
import { IProgram, ProgramMeta } from "../../../src/doc";
import { CICSSession } from "@zowe/cics-for-zowe-sdk";
import { CICSProfileMock } from "../../__utils__/globalMocks";

let mockedClipboard = ``;
jest.spyOn(vscode.env.clipboard, "writeText").mockImplementation(async (v: string) => { mockedClipboard = v; });

describe("Test suite for copy commands", () => {

  beforeEach(() => {
    mockedClipboard = ``;
  });

  it("should copy user agent string to clipboard", async () => {
    const expectedHeader = "zowe.cics-extension-for-zowe/1.2.3 zowe.vscode-extension-for-zowe/1.2.3";
    expect(mockedClipboard).toEqual("");

    const returnedValue = copyUserAgentHeaderToClipboard();

    expect(returnedValue).toEqual(expectedHeader);
    expect(mockedClipboard).toEqual(expectedHeader);
  });

  it("should copy resource name to clipboard", async () => {

    const cicsSessionMock = new CICSSession({ ...CICSProfileMock, host: "MY.HOST" });

    const sessionTree = new CICSSessionTree({ name: "MYPROF", profile: CICSProfileMock }, {
      _onDidChangeTreeData: { fire: () => jest.fn() },
    } as unknown as CICSTree);
    const regionTree = new CICSRegionTree("REG", {}, sessionTree, undefined, sessionTree);

    const mockedResourceNode = new CICSResourceContainerNode<IProgram>(
      "MOCK",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "",
        regionName: "REG",
        parentNode: regionTree,
        session: cicsSessionMock,
      },
      {
        meta: ProgramMeta,
        resource: {
          attributes: {
            program: "PROG1",
            status: "ENABLED",
            newcopycnt: "0",
            eyu_cicsname: "MYREG",
            enablestatus: "ENABLED",
            progtype: "PROGRAM",
            library: "MYLIB",
            librarydsn: "MYLIBDSN",
          },
        },
      }
    );

    expect(mockedClipboard).toEqual("");
    const expectedName = "PROG1";

    const returnedValue = copyResourceNameToClipboard(mockedResourceNode);

    expect(returnedValue).toEqual(expectedName);
    expect(mockedClipboard).toEqual(expectedName);
  });
});

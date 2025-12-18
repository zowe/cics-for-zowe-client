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

import { IProgram } from "@zowe/cics-for-zowe-explorer-api";
import { env } from "vscode";
import { copyResourceNameToClipboard, copyUserAgentHeaderToClipboard } from "../../../src/commands/copyCommand";
import { ProgramMeta } from "../../../src/doc";
import { CICSRegionTree, CICSResourceContainerNode, CICSSessionTree, CICSTree } from "../../../src/trees";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import { profile } from "../../__mocks__";

jest.spyOn(PersistentStorage, "getCriteria").mockReturnValue(undefined);

let mockedClipboard = ``;
jest.spyOn(env.clipboard, "writeText").mockImplementation(async (v: string) => {
  mockedClipboard = v;
});

describe("Test suite for copy commands", () => {
  beforeEach(() => {
    mockedClipboard = ``;
  });

  it("should copy user agent string to clipboard", async () => {
    const expectedHeader = "zowe.cics-extension-for-zowe/3.15.0 zowe.vscode-extension-for-zowe/3.15.0";
    expect(mockedClipboard).toEqual("");

    const returnedValue = copyUserAgentHeaderToClipboard();

    expect(returnedValue).toEqual(expectedHeader);
    expect(mockedClipboard).toEqual(expectedHeader);
  });

  it("should copy resource name to clipboard", async () => {
    const tree = new CICSTree();
    const sessionTree = new CICSSessionTree(profile, tree);
    const regionTree = new CICSRegionTree("REG", {}, sessionTree, undefined, sessionTree);

    const mockedResourceNode = new CICSResourceContainerNode<IProgram>(
      "MOCK",
      {
        profile,
        cicsplexName: "",
        regionName: "REG",
        parentNode: regionTree,
      },
      {
        meta: ProgramMeta,
        resource: {
          attributes: {
            program: "PROG1",
            status: "ENABLED",
            newcopycnt: "0",
            eyu_cicsname: "MYREG",
            progtype: "PROGRAM",
            library: "MYLIB",
            librarydsn: "MYLIBDSN",
            usecount: "0",
            language: "COBOL",
            jvmserver: "EYUCMCIJ",
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

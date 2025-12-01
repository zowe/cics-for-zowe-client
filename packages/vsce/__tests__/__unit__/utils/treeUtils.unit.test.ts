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

import { CICSRegionTree, CICSResourceContainerNode, CICSSessionTree, CICSTree } from "../../../src/trees";
import { evaluateTreeNodes } from "../../../src/utils/treeUtils";
import { ProgramMeta } from "../../../src/doc";
import { IProfileLoaded } from "@zowe/imperative";
import { ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import { IProgram } from "@zowe/cics-for-zowe-explorer-api";

jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {},
}));
jest.spyOn(PersistentStorage, "getNumberOfResourcesToFetch").mockReturnValue(250);
jest.spyOn(PersistentStorage, "getDefaultResourceFilter").mockReturnValue("Program=A*");

const CICSProfileMock = {
  host: "hostname",
  port: "123",
  user: "a",
  password: "b",
  rejectUnauthorized: false,
  protocol: "http",
};
const profile: IProfileLoaded = { profile: CICSProfileMock, failNotFound: false, message: "", type: "cics", name: "MYPROF" };

const cicsTree = { _onDidChangeTreeData: { fire: () => jest.fn() }, refresh: () => { } } as unknown as CICSTree;

const sessionTree = new CICSSessionTree(profile, cicsTree);
const regionTree = new CICSRegionTree("REG", {}, sessionTree, undefined, sessionTree);
const parentNode = new CICSResourceContainerNode(
  "Programs",
  {
    parentNode: regionTree,
    profile,
    regionName: "REG"
  },
  undefined,
  [ProgramMeta]
);
const prog: IProgram = {
  eyu_cicsname: "REG",
  library: "",
  librarydsn: "",
  newcopycnt: "1",
  program: "APROG",
  progtype: "",
  status: "ENABLED",
  usecount: "0",
  language: "COBOL",
  jvmserver: "EYUCMCIJ"
};

describe("Tree Utils tests", () => {

  let resourceNode: CICSResourceContainerNode<IProgram>;

  beforeEach(() => {
    resourceNode = new CICSResourceContainerNode(
      "APROG1",
      {
        parentNode,
        profile,
        regionName: "REG"
      },
      {
        meta: ProgramMeta,
        resource: { attributes: prog }
      },
      [ProgramMeta]
    );

    jest.resetAllMocks();
  });

  it("should do nothing if no record is returned", () => {

    const apiResp: ICMCIApiResponse = {
      response: {
        records: [],
        resultsummary: { api_response1: "", api_response2: "", displayed_recordcount: "0", recordcount: "0" }
      }
    };
    const updateItemSpy = jest.spyOn(CICSResourceContainerNode.prototype, "updateStoredItem");
    evaluateTreeNodes(resourceNode, apiResp, ProgramMeta);

    expect(updateItemSpy).not.toHaveBeenCalled();
  });

  it("should update the record in the resource node", () => {

    const updatedProgram = { ...prog, newcopycnt: 2 };
    const apiResp: ICMCIApiResponse = {
      response: {
        records: {
          cicsprogram: updatedProgram
        },
        resultsummary: { api_response1: "", api_response2: "", displayed_recordcount: "0", recordcount: "0" }
      }
    };
    const updateItemSpy = jest.spyOn(CICSResourceContainerNode.prototype, "updateStoredItem");
    evaluateTreeNodes(resourceNode, apiResp, ProgramMeta);

    expect(updateItemSpy).toHaveBeenCalledTimes(1);
    expect(updateItemSpy).toHaveBeenCalledWith({ meta: ProgramMeta, resource: { attributes: updatedProgram } });
  });

});
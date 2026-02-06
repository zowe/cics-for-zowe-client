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

import { IProgram, IResource, ITSQueue } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciRestClient, ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { RestClientError } from "@zowe/imperative";
import { TreeView, commands, l10n, window } from "vscode";
import { deleteTSQueueCommand, getDeleteTSQueueCommand } from "../../../src/commands/deleteTSQueueCommand";
import { ProgramMeta, SharedTSQueueMeta, TSQueueMeta } from "../../../src/doc";
import { CICSErrorHandler } from "../../../src/errors/CICSErrorHandler";
import { Resource } from "../../../src/resources";
import { CICSResourceContainerNode } from "../../../src/trees/CICSResourceContainerNode";
import { CICSTree } from "../../../src/trees/CICSTree";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import * as cmdUtils from "../../../src/utils/commandUtils";
import { profile } from "../../__mocks__";

jest.spyOn(PersistentStorage, "getCriteria").mockReturnValue(undefined);
jest.spyOn(PersistentStorage, "setCriteria").mockImplementation((cxt: string, crit?: string) => Promise.resolve());

describe("Delete TS Queue Command tests", () => {
  const removeStoredItemMock = jest.fn();
  const errSpy = jest.spyOn(window, "showErrorMessage");
  const l10nSpy = jest.spyOn(l10n, "t");
  const cicsTree = new CICSTree();
  const treeviewMock = { selection: [] as CICSResourceContainerNode<IResource>[] } as unknown as TreeView<CICSResourceContainerNode<IResource>>;
  const mockedParentNode = { removeStoredItem: removeStoredItemMock } as unknown as CICSResourceContainerNode<IResource>;
  const nodeMock = new CICSResourceContainerNode<ITSQueue>(
    "MYQUEUE1",
    {
      profile,
      regionName: "MYREG",
      parentNode: mockedParentNode,
    },
    {
      meta: TSQueueMeta,
      resource: new Resource({
        eyu_cicsname: "MYREG",
        hexname: "HEXNAME1",
        location: "ASD",
        name: "MYQUEUE1",
        numitems: "1",
        quelength: "100",
        expiryint: "0",
        transid: "TRANS1",
        tsmodel: "MODEL1",
      }),
    }
  );

  it("should return if no nodes are selected", async () => {
    // @ts-ignore - cannot be undefined
    await deleteTSQueueCommand(cicsTree, treeviewMock, undefined);

    expect(l10nSpy).toHaveBeenCalledWith(
      `No CICS {0} or {1} selected`,
      TSQueueMeta.humanReadableNameSingular,
      SharedTSQueueMeta.humanReadableNameSingular
    );
    expect(errSpy).toHaveBeenCalledWith("No CICS TS Queue or Shared TS Queue selected");
  });

  it("should return if non-tsqueue nodes are selected", async () => {
    await deleteTSQueueCommand(
      {} as CICSTree,
      treeviewMock,
      // @ts-ignore - cannot be a program node
      { getContainedResource: () => ({ meta: ProgramMeta }) } as CICSResourceContainerNode<IProgram>
    );

    expect(l10nSpy).toHaveBeenCalledWith(
      `No CICS {0} or {1} selected`,
      TSQueueMeta.humanReadableNameSingular,
      SharedTSQueueMeta.humanReadableNameSingular
    );
    expect(errSpy).toHaveBeenCalledWith("No CICS TS Queue or Shared TS Queue selected");
  });

  it("should cancel action if confirmation is cancelled", async () => {
    jest.spyOn(cmdUtils, "getConfirmationForAction").mockReturnValueOnce(Promise.resolve(undefined));
    const deleteReqSpy = jest.spyOn(CicsCmciRestClient, "deleteExpectParsedXml");

    await deleteTSQueueCommand({} as CICSTree, treeviewMock, nodeMock);

    expect(deleteReqSpy).not.toHaveBeenCalled();
  });

  it("should call deleteExpectParsedXml for node", async () => {
    jest.spyOn(cmdUtils, "getConfirmationForAction").mockReturnValueOnce(Promise.resolve("Delete"));

    const deleteReqSpy = jest.spyOn(CicsCmciRestClient, "deleteExpectParsedXml");
    deleteReqSpy.mockReturnValueOnce(
      Promise.resolve({
        response: {
          resultsummary: {
            api_response1: "1024",
          },
        },
      } as ICMCIApiResponse)
    );

    await deleteTSQueueCommand(cicsTree, treeviewMock, nodeMock);

    expect(deleteReqSpy).toHaveBeenCalledWith(
      expect.objectContaining({ regionName: "MYREG" }),
      "/CICSSystemManagement/CICSTSQueue/MYREG?CRITERIA=(HEXNAME%3DHEXNAME1)",
      [{ "User-Agent": "zowe.cics-extension-for-zowe/3.15.0 zowe.vscode-extension-for-zowe/3.15.0" }]
    );
  });

  it("should error calling deleteExpectParsedXml", async () => {
    removeStoredItemMock.mockReset();
    jest.spyOn(cmdUtils, "getConfirmationForAction").mockReturnValueOnce(Promise.resolve("Delete"));

    const deleteReqSpy = jest.spyOn(CicsCmciRestClient, "deleteExpectParsedXml");
    deleteReqSpy.mockImplementationOnce(() => {
      throw new RestClientError({ msg: "DELETE FAILED", source: "http" });
    });

    const node = new CICSResourceContainerNode<ITSQueue>(
      "MYQUEUE1",
      {
        profile,
        regionName: "MYREG",
        parentNode: mockedParentNode,
      },
      {
        meta: TSQueueMeta,
        resource: new Resource({
          eyu_cicsname: "MYREG",
          hexname: "HEXNAME1",
          location: "ASD",
          name: "MYQUEUE1",
          numitems: "1",
          quelength: "100",
          expiryint: "0",
          transid: "TRANS1",
          tsmodel: "MODEL1",
        }),
      }
    );

    const errorSpy = jest.spyOn(CICSErrorHandler, "handleCMCIRestError");

    await deleteTSQueueCommand(cicsTree, treeviewMock, node);

    expect(deleteReqSpy).toHaveBeenCalledWith(
      expect.objectContaining({ regionName: "MYREG" }),
      "/CICSSystemManagement/CICSTSQueue/MYREG?CRITERIA=(HEXNAME%3DHEXNAME1)",
      [{ "User-Agent": "zowe.cics-extension-for-zowe/3.15.0 zowe.vscode-extension-for-zowe/3.15.0" }]
    );
    expect(mockedParentNode.removeStoredItem).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it("should return vscode command", () => {
    const registerSpy = jest.spyOn(commands, "registerCommand");
    getDeleteTSQueueCommand({} as CICSTree, {} as TreeView<CICSResourceContainerNode<IResource>>);
    expect(registerSpy).toHaveBeenCalledWith("cics-extension-for-zowe.deleteTSQueue", expect.any(Function));
  });
});

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

jest.mock("@zowe/zowe-explorer-api", () => ({
  Gui: jest.fn(),
  ZoweVsCodeExtension: {
    getZoweExplorerApi: jest.fn().mockReturnValue({
      getExplorerExtenderApi: jest.fn().mockReturnValue({
        getProfilesCache: jest.fn()
      })
    })
  },
  imperative: {
    RestClientError: RestClientError
  }
}));

import { IProgram, IResource, ITSQueue } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciRestClient, ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { IProfileLoaded, RestClientError } from "@zowe/imperative";
import { TreeView } from "vscode";
import { deleteTSQueueCommand, getDeleteTSQueueCommand } from "../../../src/commands/deleteTSQueueCommand";
import { IContainedResource, ProgramMeta, SharedTSQueueMeta, TSQueueMeta } from "../../../src/doc";
import { CICSErrorHandler } from "../../../src/errors/CICSErrorHandler";
import { Resource } from "../../../src/resources";
import { CICSResourceContainerNode } from "../../../src/trees/CICSResourceContainerNode";
import { CICSTree } from "../../../src/trees/CICSTree";
import * as cmdUtils from "../../../src/utils/commandUtils";
import * as resUtils from "../../../src/utils/resourceUtils";
import { CICSLogger } from "../../../src/utils/CICSLogger";

describe("Delete TS Queue Command tests", () => {

  let errSpy: jest.SpyInstance;
  let l10nSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetAllMocks();

    errSpy = jest.spyOn(vscode.window, "showErrorMessage");
    l10nSpy = jest.spyOn(vscode.l10n, "t");
  });

  it("should return if no nodes are selected", async () => {
    // @ts-ignore - cannot be undefined
    await deleteTSQueueCommand({} as CICSTree, { selection: [] as CICSResourceContainerNode<IResource>[] } as TreeView<CICSResourceContainerNode<IResource>>, undefined);

    expect(l10nSpy).toHaveBeenCalledWith(`No CICS {0} or {1} selected`, TSQueueMeta.humanReadableNameSingular, SharedTSQueueMeta.humanReadableNameSingular);
    expect(errSpy).toHaveBeenCalledWith("No CICS TS Queue or Shared TS Queue selected");
  });

  it("should return if non-tsqueue nodes are selected", async () => {
    l10nSpy.mockReturnValue("No CICS TS Queue or Shared TS Queue selected");

    await deleteTSQueueCommand(
      {} as CICSTree,
      { selection: [] as CICSResourceContainerNode<IResource>[] } as TreeView<CICSResourceContainerNode<IResource>>,
      // @ts-ignore - cannot be a program node
      { getContainedResource: () => ({ meta: ProgramMeta }) } as CICSResourceContainerNode<IProgram>);

    expect(l10nSpy).toHaveBeenCalledWith(`No CICS {0} or {1} selected`, TSQueueMeta.humanReadableNameSingular, SharedTSQueueMeta.humanReadableNameSingular);
    expect(errSpy).toHaveBeenCalledWith("No CICS TS Queue or Shared TS Queue selected");
  });

  it("should cancel action if confirmation is cancelled", async () => {
    jest.spyOn(cmdUtils, "getConfirmationForAction").mockReturnValueOnce(Promise.resolve(undefined));
    const deleteReqSpy = jest.spyOn(CicsCmciRestClient, "deleteExpectParsedXml");

    await deleteTSQueueCommand(
      {} as CICSTree,
      { selection: [] as CICSResourceContainerNode<IResource>[] } as TreeView<CICSResourceContainerNode<IResource>>,
      { getContainedResource: () => ({ meta: TSQueueMeta }) } as CICSResourceContainerNode<ITSQueue>);

    expect(deleteReqSpy).not.toHaveBeenCalled();
  });

  it("should call deleteExpectParsedXml for node", async () => {
    jest.spyOn(resUtils, "buildUserAgentHeader").mockReturnValueOnce({ "User-Agent": "HEADER" });
    jest.spyOn(cmdUtils, "getConfirmationForAction").mockReturnValueOnce(Promise.resolve("Delete"));

    const deleteReqSpy = jest.spyOn(CicsCmciRestClient, "deleteExpectParsedXml");
    deleteReqSpy.mockReturnValueOnce(Promise.resolve({
      response: {
        resultsummary: {
          api_response1: "1024"
        }
      }
    } as ICMCIApiResponse));

    const profile: IProfileLoaded = { failNotFound: false, message: "", type: "cics", name: "MYPROF1", profile: { host: "ASD", regionName: "MYREG1" } };
    const mockedParentNode = { removeStoredItem: (c: IContainedResource<IResource>) => { } } as CICSResourceContainerNode<IResource>;

    const node = new CICSResourceContainerNode<ITSQueue>(
      "MYQUEUE1",
      {
        profile,
        regionName: "MYREG1",
        parentNode: mockedParentNode,
      },
      {
        meta: TSQueueMeta,
        resource: new Resource({ eyu_cicsname: "MYREG1", hexname: "HEXNAME1", location: "ASD", name: "MYQUEUE1", numitems: "1" })
      },
    );

    const refreshMock = jest.fn();

    await deleteTSQueueCommand(
      { refresh: refreshMock } as unknown as CICSTree,
      { selection: [] as CICSResourceContainerNode<IResource>[] } as TreeView<CICSResourceContainerNode<IResource>>,
      node,
    );

    expect(deleteReqSpy).toHaveBeenCalledWith(
      expect.objectContaining({ regionName: "MYREG1" }),
      "/CICSSystemManagement/CICSTSQueue/MYREG1?CRITERIA=(HEXNAME%3DHEXNAME1)",
      [{ "User-Agent": "HEADER" }]
    );
    expect(refreshMock).toHaveBeenCalledWith(mockedParentNode);
  });

  it("should error calling deleteExpectParsedXml", async () => {
    jest.spyOn(resUtils, "buildUserAgentHeader").mockReturnValueOnce({ "User-Agent": "HEADER" });
    jest.spyOn(cmdUtils, "getConfirmationForAction").mockReturnValueOnce(Promise.resolve("Delete"));
    jest.spyOn(CICSLogger, "error").mockImplementation(() => { });
    jest.spyOn(CICSErrorHandler, "handleCMCIRestError").mockReturnValue(Promise.resolve(""));

    const deleteReqSpy = jest.spyOn(CicsCmciRestClient, "deleteExpectParsedXml");
    deleteReqSpy.mockImplementationOnce(() => {
      throw new RestClientError({ msg: "DELETE FAILED", source: "http" });
    });

    const restoreItemMock = jest.fn().mockImplementation((c: IContainedResource<IResource>) => { });
    const profile: IProfileLoaded = { failNotFound: false, message: "", type: "cics", name: "MYPROF1", profile: { host: "ASD", regionName: "MYREG1" } };
    const mockedParentNode = { removeStoredItem: restoreItemMock } as unknown as CICSResourceContainerNode<IResource>;

    const node = new CICSResourceContainerNode<ITSQueue>(
      "MYQUEUE1",
      {
        profile,
        regionName: "MYREG1",
        parentNode: mockedParentNode,
      },
      {
        meta: TSQueueMeta,
        resource: new Resource({ eyu_cicsname: "MYREG1", hexname: "HEXNAME1", location: "ASD", name: "MYQUEUE1", numitems: "1" })
      },
    );

    const errorSpy = jest.spyOn(CICSErrorHandler, "handleCMCIRestError");
    const refreshMock = jest.fn();

    await deleteTSQueueCommand(
      { refresh: refreshMock } as unknown as CICSTree,
      { selection: [] as CICSResourceContainerNode<IResource>[] } as TreeView<CICSResourceContainerNode<IResource>>,
      node,
    );

    expect(deleteReqSpy).toHaveBeenCalledWith(
      expect.objectContaining({ regionName: "MYREG1" }),
      "/CICSSystemManagement/CICSTSQueue/MYREG1?CRITERIA=(HEXNAME%3DHEXNAME1)",
      [{ "User-Agent": "HEADER" }]
    );
    expect(mockedParentNode.removeStoredItem).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    expect(refreshMock).toHaveBeenCalledWith(mockedParentNode);
  });

  it("should return vscode command", () => {
    const registerSpy = jest.spyOn(vscode.commands, "registerCommand");
    getDeleteTSQueueCommand({} as CICSTree, {} as TreeView<CICSResourceContainerNode<IResource>>);
    expect(registerSpy).toHaveBeenCalledWith("cics-extension-for-zowe.deleteTSQueue", expect.any(Function));
  });
});
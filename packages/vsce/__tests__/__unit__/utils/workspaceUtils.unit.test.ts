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

const openDocumentMock = jest.fn();
const showTextDocumentMock = jest.fn();
const getExtensionMock = jest.fn().mockReturnValue({
  packageJSON: {
    version: "1.2.3",
  },
});
const showInfoMsgMock = jest.fn().mockReturnValue(Promise.resolve("Open Settings"));
const executeCommandMock = jest.fn();

const configMap = new Map<string, boolean>();
configMap.set("Program", true);
configMap.set("Local File", false);
const getConfigurationMock = jest.fn().mockReturnValue(configMap);

jest.mock("vscode", () => {
  return {
    workspace: {
      openTextDocument: openDocumentMock,
      getConfiguration: getConfigurationMock,
    },
    window: {
      showTextDocument: showTextDocumentMock,
      showInformationMessage: showInfoMsgMock,
    },
    extensions: {
      getExtension: getExtensionMock,
    },
    commands: {
      executeCommand: executeCommandMock,
    },
    l10n: {
      t: (key: string, def?: string) => def ?? key,
    },
  };
});

import { join } from "path";
import * as workspaceUtils from "../../../src/utils/workspaceUtils";

describe("Workspce Utils", () => {
  it("should open config file", async () => {
    expect(openDocumentMock).toHaveBeenCalledTimes(0);
    expect(showTextDocumentMock).toHaveBeenCalledTimes(0);
    await workspaceUtils.openConfigFile(join("my", "path", "zowe.config.json"));
    expect(openDocumentMock).toHaveBeenCalledTimes(1);
    expect(showTextDocumentMock).toHaveBeenCalledTimes(1);
  });

  it("should get ZE version", async () => {
    expect(getExtensionMock).toHaveBeenCalledTimes(0);
    const version = workspaceUtils.getZoweExplorerVersion();
    expect(getExtensionMock).toHaveBeenCalledTimes(1);
    expect(getExtensionMock).toHaveBeenCalledWith("zowe.vscode-extension-for-zowe");
    expect(version).toEqual("1.2.3");
  });

  it("should return true for opening settings for resources", async () => {
    const shouldOpen = workspaceUtils.openSettingsForHiddenResourceType("Resources Not Visible", "Program");
    expect(shouldOpen).toBeTruthy();
  });

  it("should return false for opening settings for resources", async () => {
    executeCommandMock.mockReset();
    showInfoMsgMock.mockReset();
    showInfoMsgMock.mockReturnValue(Promise.resolve("Open Settings"));

    expect(executeCommandMock).toHaveBeenCalledTimes(0);
    expect(showInfoMsgMock).toHaveBeenCalledTimes(0);
    const shouldOpen = await workspaceUtils.openSettingsForHiddenResourceType("Resources Not Visible", "Local File");
    expect(shouldOpen).toBeFalsy();
    expect(showInfoMsgMock).toHaveBeenCalledTimes(1);
    expect(showInfoMsgMock).toHaveBeenCalledWith("Resources Not Visible", "Open Settings", "Cancel");
    expect(executeCommandMock).toHaveBeenCalledTimes(1);
    expect(executeCommandMock).toHaveBeenCalledWith("workbench.action.openSettings", "zowe.cics.resources");
  });

  it("should return false for opening settings for resources and cancel settings", async () => {
    executeCommandMock.mockReset();
    showInfoMsgMock.mockReset();
    showInfoMsgMock.mockReturnValue(Promise.resolve("Cancel"));

    expect(executeCommandMock).toHaveBeenCalledTimes(0);
    expect(showInfoMsgMock).toHaveBeenCalledTimes(0);
    const shouldOpen = await workspaceUtils.openSettingsForHiddenResourceType("Resources Not Visible", "Local File");
    expect(shouldOpen).toBeFalsy();
    expect(showInfoMsgMock).toHaveBeenCalledTimes(1);
    expect(showInfoMsgMock).toHaveBeenCalledWith("Resources Not Visible", "Open Settings", "Cancel");
    expect(executeCommandMock).toHaveBeenCalledTimes(0);
  });
});

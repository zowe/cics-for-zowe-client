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

import { join } from "path";
import { extensions, TextDocument, TextEditor, window, workspace } from "vscode";
import * as workspaceUtils from "../../../src/utils/workspaceUtils";
import { showInfoMessageMock, vscodeExecuteCommandMock } from "../../__mocks__";

const openDocumentSpy = jest.spyOn(workspace, "openTextDocument").mockResolvedValue({} as TextDocument);
const showDocumentSpy = jest.spyOn(window, "showTextDocument").mockResolvedValue({} as TextEditor);
const getExtensionSpy = jest.spyOn(extensions, "getExtension");

describe("Workspce Utils", () => {
  it("should open config file", async () => {
    expect(openDocumentSpy).toHaveBeenCalledTimes(0);
    expect(showDocumentSpy).toHaveBeenCalledTimes(0);
    await workspaceUtils.openConfigFile(join("my", "path", "zowe.config.json"));
    expect(openDocumentSpy).toHaveBeenCalledTimes(1);
    expect(showDocumentSpy).toHaveBeenCalledTimes(1);
  });

  it("should get ZE version", async () => {
    expect(getExtensionSpy).toHaveBeenCalledTimes(0);
    const version = workspaceUtils.getZoweExplorerVersion();
    expect(getExtensionSpy).toHaveBeenCalledTimes(1);
    expect(getExtensionSpy).toHaveBeenCalledWith("zowe.vscode-extension-for-zowe");
    expect(version).toEqual("3.15.0");
  });

  it("should return true for opening settings for resources", async () => {
    const shouldOpen = workspaceUtils.openSettingsForHiddenResourceType("Resources Not Visible", "Program");
    expect(shouldOpen).toBeTruthy();
  });

  it("should return false for opening settings for resources", async () => {
    showInfoMessageMock.mockReset();
    showInfoMessageMock.mockResolvedValue("Open Settings");

    expect(vscodeExecuteCommandMock).toHaveBeenCalledTimes(0);
    expect(showInfoMessageMock).toHaveBeenCalledTimes(0);
    const shouldOpen = workspaceUtils.openSettingsForHiddenResourceType("Resources Not Visible", "Local File");
    expect(shouldOpen).toBeFalsy();
    expect(showInfoMessageMock).toHaveBeenCalledTimes(1);
    expect(showInfoMessageMock).toHaveBeenCalledWith("Resources Not Visible", "Open Settings", "Cancel");
  });

  it("should return false for opening settings for resources and cancel settings", async () => {
    vscodeExecuteCommandMock.mockReset();
    showInfoMessageMock.mockReset();
    showInfoMessageMock.mockResolvedValue("Cancel");

    expect(vscodeExecuteCommandMock).toHaveBeenCalledTimes(0);
    expect(showInfoMessageMock).toHaveBeenCalledTimes(0);
    const shouldOpen = workspaceUtils.openSettingsForHiddenResourceType("Resources Not Visible", "Local File");
    expect(shouldOpen).toBeFalsy();
    expect(showInfoMessageMock).toHaveBeenCalledTimes(1);
    expect(showInfoMessageMock).toHaveBeenCalledWith("Resources Not Visible", "Open Settings", "Cancel");
    expect(vscodeExecuteCommandMock).toHaveBeenCalledTimes(0);
  });
});

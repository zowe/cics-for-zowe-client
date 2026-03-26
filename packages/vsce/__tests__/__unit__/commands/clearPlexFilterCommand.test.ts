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

import { commands, window } from "vscode";
import { getClearPlexFilterCommand } from "../../../src/commands/clearPlexFilterCommand";
import { CICSTree } from "../../../src/trees/CICSTree";
import { CICSRegionsContainer } from "../../../src/trees/CICSRegionsContainer";
import { CICSPlexTree } from "../../../src/trees/CICSPlexTree";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { imperative } from "@zowe/zowe-explorer-api";

jest.mock("vscode");
jest.mock("../../../src/trees/CICSTree");
jest.mock("../../../src/trees/CICSRegionsContainer");
jest.mock("../../../src/trees/CICSPlexTree");
jest.mock("../../../src/trees/CICSRegionTree");

describe("clearPlexFilterCommand", () => {
  let mockTree: any;
  let mockNode: any;
  let mockPlex: any;
  let mockProfile: imperative.IProfileLoaded;
  let mockRegion: any;
  let mockResourceContainer: any;
  let commandCallback: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProfile = {
      name: "testProfile",
      type: "cics",
      profile: {
        host: "test.com",
        port: 1234,
        regionName: "TESTRGN",
        cicsPlex: "TESTPLEX",
      },
      message: "",
      failNotFound: false,
    } as imperative.IProfileLoaded;

    mockResourceContainer = {
      clearCriteria: jest.fn(),
    };

    mockRegion = {
      getIsActive: jest.fn().mockReturnValue(true),
      children: [mockResourceContainer],
    };

    mockPlex = {
      getProfile: jest.fn().mockReturnValue(mockProfile),
    };

    mockNode = {
      getParent: jest.fn().mockReturnValue(mockPlex),
      filterRegions: jest.fn(),
      children: [mockRegion],
    };

    mockTree = {
      _onDidChangeTreeData: {
        fire: jest.fn(),
      },
    };

    (commands.registerCommand as jest.Mock) = jest.fn((cmd, callback) => {
      commandCallback = callback;
      return { dispose: jest.fn() };
    });
  });

  it("should register the command", () => {
    getClearPlexFilterCommand(mockTree);
    expect(commands.registerCommand).toHaveBeenCalledWith(
      "cics-extension-for-zowe.clearPlexFilter",
      expect.any(Function)
    );
  });

  it("should show quick pick with 'All Resources' when profile has regionName and cicsPlex", async () => {
    (window.showQuickPick as jest.Mock) = jest.fn().mockResolvedValue("All Resources");

    getClearPlexFilterCommand(mockTree);
    await commandCallback(mockNode);

    expect(window.showQuickPick).toHaveBeenCalledWith(["All Resources"]);
  });

  it("should show quick pick with 'Regions' and 'All Resources' when profile lacks regionName", async () => {
    mockProfile.profile!.regionName = undefined;
    (window.showQuickPick as jest.Mock) = jest.fn().mockResolvedValue("All Resources");

    getClearPlexFilterCommand(mockTree);
    await commandCallback(mockNode);

    expect(window.showQuickPick).toHaveBeenCalledWith(["Regions", "All Resources"]);
  });

  it("should show quick pick with 'Regions' and 'All Resources' when profile lacks cicsPlex", async () => {
    mockProfile.profile!.cicsPlex = undefined;
    (window.showQuickPick as jest.Mock) = jest.fn().mockResolvedValue("All Resources");

    getClearPlexFilterCommand(mockTree);
    await commandCallback(mockNode);

    expect(window.showQuickPick).toHaveBeenCalledWith(["Regions", "All Resources"]);
  });

  it("should return early if no resource is selected", async () => {
    (window.showQuickPick as jest.Mock) = jest.fn().mockResolvedValue(undefined);

    getClearPlexFilterCommand(mockTree);
    await commandCallback(mockNode);

    expect(mockNode.filterRegions).not.toHaveBeenCalled();
  });

  it("should filter regions with '*' when resource is selected", async () => {
    (window.showQuickPick as jest.Mock) = jest.fn().mockResolvedValue("All Resources");

    getClearPlexFilterCommand(mockTree);
    await commandCallback(mockNode);

    expect(mockNode.filterRegions).toHaveBeenCalledWith("*", mockTree);
  });

  it("should return early if 'Regions' is selected", async () => {
    mockProfile.profile!.regionName = undefined;
    (window.showQuickPick as jest.Mock) = jest.fn().mockResolvedValue("Regions");

    getClearPlexFilterCommand(mockTree);
    await commandCallback(mockNode);

    expect(mockNode.filterRegions).toHaveBeenCalledWith("*", mockTree);
    expect(mockResourceContainer.clearCriteria).not.toHaveBeenCalled();
  });

  it("should clear criteria for all active regions when 'All Resources' is selected", async () => {
    (window.showQuickPick as jest.Mock) = jest.fn().mockResolvedValue("All Resources");

    getClearPlexFilterCommand(mockTree);
    await commandCallback(mockNode);

    expect(mockResourceContainer.clearCriteria).toHaveBeenCalled();
    expect(mockTree._onDidChangeTreeData.fire).toHaveBeenCalledWith(mockRegion);
  });

  it("should skip inactive regions", async () => {
    mockRegion.getIsActive.mockReturnValue(false);
    (window.showQuickPick as jest.Mock) = jest.fn().mockResolvedValue("All Resources");

    getClearPlexFilterCommand(mockTree);
    await commandCallback(mockNode);

    expect(mockResourceContainer.clearCriteria).not.toHaveBeenCalled();
  });

  it("should skip regions without children", async () => {
    mockRegion.children = undefined;
    (window.showQuickPick as jest.Mock) = jest.fn().mockResolvedValue("All Resources");

    getClearPlexFilterCommand(mockTree);
    await commandCallback(mockNode);

    expect(mockResourceContainer.clearCriteria).not.toHaveBeenCalled();
  });

  it("should handle multiple regions", async () => {
    const mockRegion2 = {
      getIsActive: jest.fn().mockReturnValue(true),
      children: [{ clearCriteria: jest.fn() }],
    };
    mockNode.children = [mockRegion, mockRegion2];
    (window.showQuickPick as jest.Mock) = jest.fn().mockResolvedValue("All Resources");

    getClearPlexFilterCommand(mockTree);
    await commandCallback(mockNode);

    expect(mockResourceContainer.clearCriteria).toHaveBeenCalled();
    expect(mockRegion2.children[0].clearCriteria).toHaveBeenCalled();
    expect(mockTree._onDidChangeTreeData.fire).toHaveBeenCalledTimes(2);
  });

  it("should handle multiple resource containers per region", async () => {
    const mockResourceContainer2 = { clearCriteria: jest.fn() };
    mockRegion.children = [mockResourceContainer, mockResourceContainer2];
    (window.showQuickPick as jest.Mock) = jest.fn().mockResolvedValue("All Resources");

    getClearPlexFilterCommand(mockTree);
    await commandCallback(mockNode);

    expect(mockResourceContainer.clearCriteria).toHaveBeenCalled();
    expect(mockResourceContainer2.clearCriteria).toHaveBeenCalled();
  });
});

// Made with Bob

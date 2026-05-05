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

jest.mock("../../../src/utils/commandUtils", () => {
  return {
    ...jest.requireActual("../../../src/utils/commandUtils"),
    promptUserForProfile: jest.fn().mockImplementation(() => "host1.myzosmf"),
  };
});

jest.mock("../../../src/utils/CICSLogger", () => ({
  CICSLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { commands, window } from "vscode";
import { showBundleDirectory } from "../../../src/commands/showBundleDirectoryCommand";
import { CICSLogger } from "../../../src/utils/CICSLogger";
import { createProfile, fetchAllProfilesMock, vscodeRegisterCommandMock } from "../../__mocks__";

const showErrorMessageSpy = jest.spyOn(window, "showErrorMessage");
const executeCommandSpy = jest.spyOn(commands, "executeCommand");

function createBundleNode(bundleDir: string | undefined, profileName: string = "testProfile") {
  const profile = createProfile(profileName, "cics", "host1", "user");
  return {
    getContainedResource: () => ({
      resource: {
        attributes: {
          bundledir: bundleDir,
        },
      },
    }),
    getLabel: () => "TestBundle",
    getContainedResourceName: () => "TestBundle",
    profile: profile,
  };
}

describe("Test suite for showBundleDirectory", () => {
  let commandCallback: (node: ReturnType<typeof createBundleNode>) => Promise<void>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Register the command and capture the callback
    showBundleDirectory();
    commandCallback = vscodeRegisterCommandMock.mock.calls[0][1];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should show error when no bundle is selected", async () => {
    await commandCallback(undefined);
    expect(showErrorMessageSpy).toHaveBeenCalledWith("No CICS bundle is selected");
  });

  it("should show error when bundle directory is not found", async () => {
    const bundleNode = createBundleNode(undefined);
    await commandCallback(bundleNode);
    expect(showErrorMessageSpy).toHaveBeenCalledWith("Could not find bundle directory for TestBundle.");
  });

  it("should use matching profile when available", async () => {
    const h1z = createProfile("host1.myzosmf", "zosmf", "h1", "user");
    const zosProfiles = [h1z];
    fetchAllProfilesMock.mockResolvedValue(zosProfiles);

    const bundleNode = createBundleNode("/u/user/bundles/testBundle");

    const commandUtils = require("../../../src/utils/commandUtils");
    commandUtils.findRelatedZosProfiles = jest.fn().mockResolvedValue(h1z);

    await commandCallback(bundleNode);

    expect(executeCommandSpy).toHaveBeenCalledWith("zowe.uss.fullPath", expect.anything());
    expect(executeCommandSpy).toHaveBeenCalledWith(
      "zowe.uss.filterBy",
      expect.objectContaining({
        fullPath: "/u/user/bundles/testBundle",
      })
    );
  });

  it("should handle errors when executing commands", async () => {
    const h1z = createProfile("host1.myzosmf", "zosmf", "h1", "user");
    const zosProfiles = [h1z];
    fetchAllProfilesMock.mockResolvedValue(zosProfiles);

    const bundleNode = createBundleNode("/u/user/bundles/testBundle");

    const commandUtils = require("../../../src/utils/commandUtils");
    commandUtils.findRelatedZosProfiles = jest.fn().mockResolvedValue(h1z);

    executeCommandSpy.mockImplementation(() => {
      throw new Error("Command execution failed");
    });

    await commandCallback(bundleNode);

    // Verify error message was shown
    expect(showErrorMessageSpy).toHaveBeenCalledWith("Unable to open bundle directory in USS view.");
  });

  it("should filter profiles that support USS", async () => {
    const h1z = createProfile("host1.myzosmf", "zosmf", "h1", "user");
    const h2 = createProfile("host2.myzosmf", "zosmf", "h2", "user");
    const allProfiles = [h1z, h2];
    fetchAllProfilesMock.mockResolvedValue(allProfiles);

    const commandUtils = require("../../../src/utils/commandUtils");
    commandUtils.doesProfileSupportConnectionType = jest.fn().mockImplementation((profile) => {
      return profile.name === "host1.myzosmf";
    });
    commandUtils.findRelatedZosProfiles = jest.fn().mockResolvedValue(h1z);

    const bundleNode = createBundleNode("/u/user/bundles/testBundle");
    await commandCallback(bundleNode);

    // Verify commands were executed with the correct profile
    expect(executeCommandSpy).toHaveBeenCalledWith(
      "zowe.uss.fullPath",
      expect.objectContaining({
        getProfileName: expect.any(Function),
      })
    );

    // Get the session node from the first call
    const sessionNode = executeCommandSpy.mock.calls[0][1];
    expect(sessionNode.getProfileName()).toBe("host1.myzosmf");
  });

  it("should prompt user for profile when no matching profile found", async () => {
    const h1z = createProfile("host1.myzosmf", "zosmf", "h1", "user");
    const zosProfiles = [h1z];
    fetchAllProfilesMock.mockResolvedValue(zosProfiles);

    const bundleNode = createBundleNode("/u/user/bundles/testBundle");

    const commandUtils = require("../../../src/utils/commandUtils");
    commandUtils.findRelatedZosProfiles = jest.fn().mockResolvedValue(null);
    commandUtils.promptUserForProfile = jest.fn().mockResolvedValue("host1.myzosmf");

    await commandCallback(bundleNode);

    expect(commandUtils.promptUserForProfile).toHaveBeenCalledWith(zosProfiles);
    expect(CICSLogger.debug).toHaveBeenCalledWith(expect.stringContaining("User picked z/OS profile"));
  });

  it("should exit quietly when user cancels profile selection", async () => {
    const h1z = createProfile("host1.myzosmf", "zosmf", "h1", "user");
    const zosProfiles = [h1z];
    fetchAllProfilesMock.mockResolvedValue(zosProfiles);

    const bundleNode = createBundleNode("/u/user/bundles/testBundle");

    const commandUtils = require("../../../src/utils/commandUtils");
    commandUtils.findRelatedZosProfiles = jest.fn().mockResolvedValue(null);
    commandUtils.promptUserForProfile = jest.fn().mockResolvedValue(undefined);

    await commandCallback(bundleNode);

    expect(executeCommandSpy).not.toHaveBeenCalled();
    expect(showErrorMessageSpy).not.toHaveBeenCalled();
  });

  it("should show error when chosen profile is not found", async () => {
    const h1z = createProfile("host1.myzosmf", "zosmf", "h1", "user");
    const zosProfiles = [h1z];
    fetchAllProfilesMock.mockResolvedValue(zosProfiles);

    const bundleNode = createBundleNode("/u/user/bundles/testBundle");

    const commandUtils = require("../../../src/utils/commandUtils");
    commandUtils.findRelatedZosProfiles = jest.fn().mockResolvedValue(null);
    commandUtils.promptUserForProfile = jest.fn().mockResolvedValue("nonexistent");

    await commandCallback(bundleNode);

    expect(showErrorMessageSpy).toHaveBeenCalledWith("Could not find profile nonexistent");
  });

  it("should handle tree item resolution error gracefully", async () => {
    const h1z = createProfile("host1.myzosmf", "zosmf", "h1", "user");
    const zosProfiles = [h1z];
    fetchAllProfilesMock.mockResolvedValue(zosProfiles);

    const bundleNode = createBundleNode("/u/user/bundles/testBundle");

    const commandUtils = require("../../../src/utils/commandUtils");
    commandUtils.findRelatedZosProfiles = jest.fn().mockResolvedValue(h1z);

    executeCommandSpy.mockImplementationOnce(() => {
      throw new Error("Cannot resolve tree item for element 0/0:host1.myzosmf from extension Zowe.vscode-extension-for-zowe");
    });

    await commandCallback(bundleNode);

    expect(CICSLogger.debug).toHaveBeenCalledWith(expect.stringContaining("Tree item resolution issue"));
    expect(executeCommandSpy).toHaveBeenCalledWith("zowe.uss.filterBy", expect.anything());
  });

  it("should log error for non-tree-resolution errors during fullPath command", async () => {
    const h1z = createProfile("host1.myzosmf", "zosmf", "h1", "user");
    const zosProfiles = [h1z];
    fetchAllProfilesMock.mockResolvedValue(zosProfiles);

    const bundleNode = createBundleNode("/u/user/bundles/testBundle");

    const commandUtils = require("../../../src/utils/commandUtils");
    commandUtils.findRelatedZosProfiles = jest.fn().mockResolvedValue(h1z);

    executeCommandSpy.mockImplementationOnce(() => {
      throw new Error("Some other error");
    });

    await commandCallback(bundleNode);

    expect(CICSLogger.error).toHaveBeenCalledWith(expect.stringContaining("Failed to load USS session"));
  });

  it("should log info when executing zowe.uss.fullPath command", async () => {
    const h1z = createProfile("host1.myzosmf", "zosmf", "h1", "user");
    const zosProfiles = [h1z];
    fetchAllProfilesMock.mockResolvedValue(zosProfiles);

    const bundleNode = createBundleNode("/u/user/bundles/testBundle");

    const commandUtils = require("../../../src/utils/commandUtils");
    commandUtils.findRelatedZosProfiles = jest.fn().mockResolvedValue(h1z);

    await commandCallback(bundleNode);

    expect(CICSLogger.info).toHaveBeenCalledWith(expect.stringContaining("Executing command: zowe.uss.fullPath"));
  });

  it("should create USS tree node with correct properties", async () => {
    const h1z = createProfile("host1.myzosmf", "zosmf", "h1", "user");
    const zosProfiles = [h1z];
    fetchAllProfilesMock.mockResolvedValue(zosProfiles);

    const bundleNode = createBundleNode("/u/user/bundles/testBundle");

    const commandUtils = require("../../../src/utils/commandUtils");
    commandUtils.findRelatedZosProfiles = jest.fn().mockResolvedValue(h1z);

    await commandCallback(bundleNode);

    const ussNode = executeCommandSpy.mock.calls[1][1];
    expect(ussNode.fullPath).toBe("/u/user/bundles/testBundle");
    expect(ussNode.label).toBe("testBundle");
    expect(ussNode.getLabel()).toBe("testBundle");
    expect(ussNode.getProfileName()).toBe("host1.myzosmf");
    expect(ussNode.getProfile()).toBe(h1z);
  });

  it("should create session node with correct properties", async () => {
    const h1z = createProfile("host1.myzosmf", "zosmf", "h1", "user");
    const zosProfiles = [h1z];
    fetchAllProfilesMock.mockResolvedValue(zosProfiles);

    const bundleNode = createBundleNode("/u/user/bundles/testBundle");

    const commandUtils = require("../../../src/utils/commandUtils");
    commandUtils.findRelatedZosProfiles = jest.fn().mockResolvedValue(h1z);

    await commandCallback(bundleNode);

    const sessionNode = executeCommandSpy.mock.calls[0][1];
    expect(sessionNode.label).toBe("host1.myzosmf");
    expect(sessionNode.getProfile()).toBe(h1z);
    expect(sessionNode.getProfileName()).toBe("host1.myzosmf");
    expect(sessionNode.getSession()).toBeDefined();
    expect(sessionNode.getParent()).toBeUndefined();
    expect(sessionNode.getChildren()).toEqual([]);
    expect(sessionNode.getSessionNode()).toBe(sessionNode);
    expect(sessionNode.getLabel()).toBe("host1.myzosmf");
  });

  it("should handle bundle directory with single segment path", async () => {
    const h1z = createProfile("host1.myzosmf", "zosmf", "h1", "user");
    const zosProfiles = [h1z];
    fetchAllProfilesMock.mockResolvedValue(zosProfiles);

    const bundleNode = createBundleNode("/bundle");

    const commandUtils = require("../../../src/utils/commandUtils");
    commandUtils.findRelatedZosProfiles = jest.fn().mockResolvedValue(h1z);

    await commandCallback(bundleNode);

    const ussNode = executeCommandSpy.mock.calls[1][1];
    expect(ussNode.label).toBe("bundle");
    expect(ussNode.fullPath).toBe("/bundle");
  });

  it("should handle error in filterBy command", async () => {
    const h1z = createProfile("host1.myzosmf", "zosmf", "h1", "user");
    const zosProfiles = [h1z];
    fetchAllProfilesMock.mockResolvedValue(zosProfiles);

    const bundleNode = createBundleNode("/u/user/bundles/testBundle");

    const commandUtils = require("../../../src/utils/commandUtils");
    commandUtils.findRelatedZosProfiles = jest.fn().mockResolvedValue(h1z);

    executeCommandSpy
      .mockResolvedValueOnce(undefined) // fullPath succeeds
      .mockRejectedValueOnce(new Error("filterBy failed")); // filterBy fails

    await commandCallback(bundleNode);

    expect(showErrorMessageSpy).toHaveBeenCalledWith("Unable to open bundle directory in USS view.");
    expect(CICSLogger.error).toHaveBeenCalledWith(expect.stringContaining("Failed to open bundle directory"));
  });
});

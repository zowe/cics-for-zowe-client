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

import { commands, window } from "vscode";
import { showBundleDirectory } from "../../../src/commands/showBundleDirectoryCommand";
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
  let commandCallback: (node: any) => Promise<void>;

  beforeEach(() => {
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
});

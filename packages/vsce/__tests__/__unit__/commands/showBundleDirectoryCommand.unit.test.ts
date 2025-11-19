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

import { AuthOrder, IProfileLoaded } from "@zowe/imperative";
import { imperative } from "@zowe/zowe-explorer-api";
import type { Extension } from "vscode";
import * as vscode from "vscode";

// these need to be mocked before the imports
const getZoweExplorerApiMock = jest.fn();
const ussApiMock = jest.fn();

// Mock vscode APIs
jest.spyOn(vscode.extensions, "getExtension").mockReturnValue({
  packageJSON: {
    version: "1.2.3",
  },
} as Extension<any>);

jest.spyOn(vscode.commands, "executeCommand").mockImplementation(jest.fn());
jest.spyOn(vscode.window, "showErrorMessage").mockImplementation(jest.fn());

const zoweExplorerAPI = { getUssApi: ussApiMock };

const getProfilesCacheMock = jest.fn();
const fetchAllProfilesMock = jest.fn();
getProfilesCacheMock.mockReturnValue({
  fetchBaseProfile: (name: string): imperative.IProfileLoaded => {
    if (name === "exception") {
      throw Error("Error");
    }
    const splitString = name.split(".");
    if (splitString.length > 1) {
      return createProfile(splitString[0], "base", "", "");
    }
    return undefined as unknown as IProfileLoaded;
  },
  fetchAllProfiles: fetchAllProfilesMock,
});

jest.mock("../../../src/utils/CICSLogger");
jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {
    getProfilesCache: getProfilesCacheMock,
  },
}));

// Mock registerCommand to capture the callback
const registerCommandMock = jest.fn().mockImplementation((_, callback) => {
  return { dispose: jest.fn(), callback };
});
jest.spyOn(vscode.commands, "registerCommand").mockImplementation(registerCommandMock);

// Mock commandUtils
jest.mock("../../../src/utils/commandUtils", () => {
  const original = jest.requireActual("../../../src/utils/commandUtils");
  return {
    ...original,
    promptUserForProfile: jest.fn().mockImplementation(() => "host1.myzosmf"),
  };
});

// this import needs to come after the mocks are set up correctly
import { showBundleDirectory } from "../../../src/commands/showBundleDirectoryCommand";

jest.mock("@zowe/zowe-explorer-api", () => ({
  ZoweVsCodeExtension: { getZoweExplorerApi: getZoweExplorerApiMock },
  ZoweExplorerApiType: {
    Uss: "USS",
    Jes: "JES",
  },
}));
jest.spyOn(AuthOrder, "makingRequestForToken").mockImplementation(() => {});

const executeCommandMock = vscode.commands.executeCommand as jest.Mock;
const showErrorMessageMock = vscode.window.showErrorMessage as jest.Mock;

function createProfile(name: string, type: string, host: string, user?: string) {
  return {
    name: name,
    message: "",
    type: type,
    failNotFound: false,
    profile: {
      user: user,
      host: host,
    },
  } as imperative.IProfileLoaded;
}

// Create mock bundle node
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
    getZoweExplorerApiMock.mockReturnValue(zoweExplorerAPI);
    executeCommandMock.mockReset();
    showErrorMessageMock.mockReset();
    registerCommandMock.mockClear();

    // Register the command and capture the callback
    showBundleDirectory();
    commandCallback = registerCommandMock.mock.calls[0][1];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should show error when no bundle is selected", async () => {
    await commandCallback(undefined);
    expect(showErrorMessageMock).toHaveBeenCalledWith("No CICS bundle is selected");
  });

  it("should show error when bundle directory is not found", async () => {
    const bundleNode = createBundleNode(undefined);
    await commandCallback(bundleNode);
    expect(showErrorMessageMock).toHaveBeenCalledWith("Could not find bundle directory for TestBundle.");
  });

  it("should use matching profile when available", async () => {
    const h1z = createProfile("host1.myzosmf", "zosmf", "h1", "user");
    const zosProfiles = [h1z];
    fetchAllProfilesMock.mockResolvedValue(zosProfiles);

    ussApiMock.mockReturnValue(true);

    const bundleNode = createBundleNode("/u/user/bundles/testBundle");

    const commandUtils = require("../../../src/utils/commandUtils");
    commandUtils.findRelatedZosProfiles = jest.fn().mockResolvedValue(h1z);

    await commandCallback(bundleNode);

    expect(executeCommandMock).toHaveBeenCalledWith("zowe.uss.fullPath", expect.anything());
    expect(executeCommandMock).toHaveBeenCalledWith(
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

    ussApiMock.mockReturnValue(true);

    const bundleNode = createBundleNode("/u/user/bundles/testBundle");

    const commandUtils = require("../../../src/utils/commandUtils");
    commandUtils.findRelatedZosProfiles = jest.fn().mockResolvedValue(h1z);

    executeCommandMock.mockImplementation(() => {
      throw new Error("Command execution failed");
    });

    await commandCallback(bundleNode);

    // Verify error message was shown
    expect(showErrorMessageMock).toHaveBeenCalledWith("Unable to open bundle directory in USS view.");
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
    expect(executeCommandMock).toHaveBeenCalledWith(
      "zowe.uss.fullPath",
      expect.objectContaining({
        getProfileName: expect.any(Function),
      })
    );

    // Get the session node from the first call
    const sessionNode = executeCommandMock.mock.calls[0][1];
    expect(sessionNode.getProfileName()).toBe("host1.myzosmf");
  });
});

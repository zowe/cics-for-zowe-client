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

const mockGetExtension = jest.fn().mockReturnValue({
  packageJSON: {
    version: "3.14.0",
  },
  activate: () => {
    return {
      resources: { supportedResources: [ResourceTypes.CICSProgram] },
    } as IExtensionAPI;
  },
});

jest.mock("vscode", () => {
  return {
    extensions: {
      getExtension: mockGetExtension,
    },
    workspace: {
      getConfiguration: () => {
        return {
          get: jest.fn().mockReturnValue(true),
        };
      },
    },
  };
});

import { getCICSForZoweExplorerAPI } from "../../src/getAPI";
import type { IExtensionAPI } from "../../src/interfaces";
import { ResourceTypes } from "../../src/resources";

describe("getAPI tests", () => {
  it("should return API with no minversion", async () => {
    const api = await getCICSForZoweExplorerAPI();
    expect(api).toBeDefined();
    expect(api?.resources.supportedResources).toHaveLength(1);
    expect(api?.resources.supportedResources[0]).toEqual(ResourceTypes.CICSProgram);
  });

  it("should return undefined with min version higher than hardcoded limit and installed version", async () => {
    const api = await getCICSForZoweExplorerAPI("3.16.0");
    expect(api).toBeUndefined();
  });

  it("should return API when min version is met", async () => {
    const api = await getCICSForZoweExplorerAPI("3.12.0");
    expect(api).toBeDefined();
    expect(api?.resources.supportedResources).toHaveLength(1);
    expect(api?.resources.supportedResources[0]).toEqual(ResourceTypes.CICSProgram);
  });

  it("should return undefined when installed version is lower than hardcoded min", async () => {
    mockGetExtension.mockReturnValueOnce({
      packageJSON: {
        version: "3.2.0",
      },
    });

    const api = await getCICSForZoweExplorerAPI();
    expect(api).toBeUndefined();
  });

  it("should return undefined with no extension installed", async () => {
    mockGetExtension.mockReturnValueOnce(undefined);
    const api = await getCICSForZoweExplorerAPI();
    expect(api).toBeUndefined();
  });

  it("should return undefined with no extension installed and minimum value", async () => {
    mockGetExtension.mockReturnValueOnce(undefined);
    const api = await getCICSForZoweExplorerAPI("1.5.6");
    expect(api).toBeUndefined();
  });
});

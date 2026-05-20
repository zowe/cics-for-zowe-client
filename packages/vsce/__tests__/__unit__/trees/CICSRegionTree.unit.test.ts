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

import { workspace, WorkspaceConfiguration } from "vscode";
import { CICSTree } from "../../../src/trees";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";
import { CICSPlexTree } from "../../../src/trees/CICSPlexTree";
import * as iconUtils from "../../../src/utils/iconUtils";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import { profile } from "../../__mocks__";
import { ProgramMeta, type IResourceMeta } from "../../../src/doc";
import type { IResource } from "@zowe/cics-for-zowe-explorer-api";

jest.spyOn(PersistentStorage, "getCriteria").mockReturnValue(undefined);

const region = {
  cicsname: "cics",
  cicsstate: "ACTIVE",
  applid: "APPLID",
};
const region_disable = {
  cicsname: "cics",
  cicsstate: "DISABLE",
};
const region_undefined = {
  cicsname: "cics",
};

const getIconByStatusSpy = jest.spyOn(iconUtils, "getIconByStatus");

describe("Test suite for CICSRegionTree", () => {
  let cicsTree: CICSTree;
  let sessionTree: CICSSessionTree;
  let regionTree: CICSRegionTree;

  beforeEach(() => {
    cicsTree = new CICSTree();
    sessionTree = new CICSSessionTree(profile, cicsTree);
    regionTree = new CICSRegionTree("regionName", region, sessionTree, undefined, sessionTree);

    expect(regionTree.isActive).toBeTruthy();
  });

  it("Should load region Tree when cicsstate is DISABLED", () => {
    regionTree = new CICSRegionTree("regionName", region_disable, sessionTree, undefined, sessionTree);

    expect(getIconByStatusSpy).toHaveBeenCalledWith("REGION", regionTree);
    expect(regionTree.isActive).toBeFalsy();
  });

  it("Should load region Tree when cicsstate is undefined and cicsstatus is used", () => {
    const regionWithStatus = {
      cicsname: "cics",
      cicsstatus: "ACTIVE",
    };
    regionTree = new CICSRegionTree("regionName", regionWithStatus, sessionTree, undefined, sessionTree);

    expect(getIconByStatusSpy).toHaveBeenCalledWith("REGION", regionTree);
    expect(regionTree.isActive).toBeTruthy();
  });

  it("Should load region Tree when cicsstate is undefined and cicsstatus is not ACTIVE", () => {
    regionTree = new CICSRegionTree("regionName", region_undefined, sessionTree, undefined, sessionTree);

    expect(getIconByStatusSpy).toHaveBeenCalledWith("REGION", regionTree);
    expect(regionTree.isActive).toBeFalsy();
  });

  it("Should return true if applid or cicsname is defined", () => {
    expect(regionTree.getRegionName()).toBeTruthy();
  });

  it("Should return return all cics tree in children array", async () => {
    const result = await regionTree.getChildren();
    expect(result?.length).toBeGreaterThanOrEqual(6);
  });

  it("Should return parent", () => {
    expect(regionTree.getParent()).toBeDefined();
    expect(regionTree.getParent().profile).toBeDefined();
    expect(regionTree.getParent().profile).toHaveProperty("profile");
  });

  it("Should return isActive", () => {
    expect(regionTree.getIsActive()).toBeTruthy();
  });

  it("Children should be sorted when built", async () => {
    const result = await regionTree.getChildren();
    expect(result).toHaveLength(10);

    const actual = result.map((c) => `${c.label}`);
    const expected = result.map((c) => `${c.label}`).sort((a, b) => a.localeCompare(b));

    expect(actual).toEqual(expected);
  });

  it("Should initialize with parentPlex when provided", () => {
    const plexTree = new CICSPlexTree("TESTPLEX", profile, sessionTree);
    const regionWithPlex = new CICSRegionTree("regionName", region, sessionTree, plexTree, sessionTree);

    expect(regionWithPlex.parentPlex).toBeDefined();
    expect(regionWithPlex.parentPlex).toBe(plexTree);
    expect(regionWithPlex.cicsplexName).toBe("TESTPLEX");
  });

  it("Should return contained resource name", () => {
    const result = regionTree.getContainedResourceName();
    expect(result).toBe("APPLID");
  });

  it("Should return session node", () => {
    const result = regionTree.getSessionNode();
    expect(result).toBe(sessionTree);
  });

  it("Should get container node for resource type", async () => {
    await regionTree.getChildren();
    const programContainer = regionTree.getContainerNodeForResourceType(ProgramMeta);
    expect(programContainer).toBeDefined();
    expect(programContainer?.resourceTypes).toContain(ProgramMeta);
  });

  it("Should return undefined when container node not found for resource type", async () => {
    await regionTree.getChildren();
    const mockMeta: IResourceMeta<IResource> = {
      humanReadableNamePlural: "MockResource",
      humanReadableNameSingular: "MockResource",
      resourceName: "MOCKRESOURCE",
      buildCriteria: jest.fn(),
      getDefaultCriteria: jest.fn(),
      getLabel: jest.fn(),
      getContext: jest.fn(),
      getIconName: jest.fn(),
      getName: jest.fn(),
      getHighlights: jest.fn(),
      getCriteriaHistory: jest.fn(),
      appendCriteriaHistory: jest.fn(),
    };
    const result = regionTree.getContainerNodeForResourceType(mockMeta);
    expect(result).toBeUndefined();
  });

  it("Should respect workspace configuration for Transaction resources", async () => {
    // The mock in vscode.ts sets Transaction to false
    const children = await regionTree.getChildren();
    expect(children).toBeDefined();
    
    // Transaction should not be in children because it's disabled in the mock
    const transactionContainer = children?.find((c) => c.label === "Transactions");
    expect(transactionContainer).toBeUndefined();
  });

  it("Should respect workspace configuration for LocalFile resources", async () => {
    // The mock in vscode.ts sets LocalFile to false
    const children = await regionTree.getChildren();
    expect(children).toBeDefined();
    
    // Files should not be in children because LocalFile is disabled in the mock
    const filesContainer = children?.find((c) => c.label === "Files");
    expect(filesContainer).toBeUndefined();
  });

  it("Should build children with all resources enabled", async () => {
    // Mock workspace config to return true for all resources
    const mockConfig: Partial<WorkspaceConfiguration> = {
      get: jest.fn((key: string, defaultValue?: boolean) => {
        const configMap: Record<string, boolean> = {
          "Program": true,
          "Transaction": true,
          "LocalFile": true,
          "Task": true,
          "Library": true,
          "Pipeline": true,
          "TCP/IPService": true,
          "URIMap": true,
          "WebService": true,
          "JVMServer": true,
          "Bundle": true,
          "TSQueue": true,
        };
        return configMap[key] ?? defaultValue ?? true;
      }),
      has: jest.fn(),
      inspect: jest.fn(),
      update: jest.fn(),
    };

    const getConfigSpy = jest.spyOn(workspace, "getConfiguration").mockReturnValue(mockConfig as WorkspaceConfiguration);

    const newRegionTree = new CICSRegionTree("regionName", region, sessionTree, undefined, sessionTree);
    const children = await newRegionTree.getChildren();

    expect(children).toBeDefined();
    expect(children?.length).toBe(12); // All 12 resource types should be present
    
    // Verify Transaction and Files are included
    const transactionContainer = children?.find((c) => c.label === "Transactions");
    expect(transactionContainer).toBeDefined();
    
    const filesContainer = children?.find((c) => c.label === "Files");
    expect(filesContainer).toBeDefined();

    getConfigSpy.mockRestore();
  });
});

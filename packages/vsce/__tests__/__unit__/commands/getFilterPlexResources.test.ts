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
import { getFilterPlexResources } from "../../../src/commands/getFilterPlexResources";
import { CICSPlexTree } from "../../../src/trees/CICSPlexTree";
import { CICSRegionsContainer } from "../../../src/trees/CICSRegionsContainer";
import { CICSTree } from "../../../src/trees/CICSTree";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import * as filterUtils from "../../../src/utils/filterUtils";
import { profile } from "../../__mocks__";

jest.spyOn(PersistentStorage, "getSearchHistory").mockReturnValue([]);
jest.spyOn(PersistentStorage, "appendSearchHistory").mockResolvedValue(undefined);

const mockContext = {
  workspaceState: {
    get: jest.fn(),
    update: jest.fn(),
  },
  globalState: {
    get: jest.fn(),
    update: jest.fn(),
    setKeysForSync: jest.fn(),
  },
} as any;

PersistentStorage.setContext(mockContext);

jest.spyOn(vscode.commands, "registerCommand").mockImplementation((_: any, cb: any) => cb as unknown as vscode.Disposable);

describe("Test suite for getFilterPlexResources command", () => {
  let mockTree: CICSTree;
  let mockTreeView: any;
  let getPatternFromFilterSpy: jest.SpyInstance;

  const createMockPlexTree = (): CICSPlexTree =>
    ({
      profile,
      getProfile: () => profile,
      getPlexName: () => "MYPLEX",
      getParent: () => ({ getProfile: () => profile }),
      getGroupName: (): string | undefined => undefined,
      saveRegionFilter: jest.fn(),
    }) as any;

  beforeEach(() => {
    mockTree = { _onDidChangeTreeData: { fire: jest.fn() } } as any;

    jest.spyOn(vscode.window, "showErrorMessage").mockResolvedValue(undefined as any);

    getPatternFromFilterSpy = jest.spyOn(filterUtils, "getPatternFromFilter").mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Should show error when no region is selected", async () => {
    mockTreeView = { selection: [], reveal: jest.fn() };
    const command = getFilterPlexResources(mockTree, mockTreeView) as any;

    await command(undefined);

    expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("No 'Regions' node selected");
    expect(mockTreeView.reveal).not.toHaveBeenCalled();
  });

  test("Should filter regions correctly", async () => {
    getPatternFromFilterSpy.mockResolvedValueOnce("TEST1");

    const regionsContainer = new CICSRegionsContainer(createMockPlexTree());
    const filterRegionsSpy = jest.spyOn(regionsContainer, "filterRegions");

    mockTreeView = { selection: [regionsContainer], reveal: jest.fn() };

    const command = getFilterPlexResources(mockTree, mockTreeView) as any;
    await command(undefined);

    expect(mockTreeView.reveal).toHaveBeenCalledWith(regionsContainer, { expand: true });
    expect(getPatternFromFilterSpy).toHaveBeenCalledWith("Region", ["MYREG"], false, "MYREG");
    expect(filterRegionsSpy).toHaveBeenCalledWith("TEST1");
    expect(mockTree._onDidChangeTreeData.fire).toHaveBeenCalledWith(regionsContainer);
  });

  test("Should handle empty filter input", async () => {
    getPatternFromFilterSpy.mockResolvedValueOnce(undefined);

    const regionsContainer = new CICSRegionsContainer(createMockPlexTree());
    const filterRegionsSpy = jest.spyOn(regionsContainer, "filterRegions");

    mockTreeView = { selection: [regionsContainer], reveal: jest.fn() };

    const command = getFilterPlexResources(mockTree, mockTreeView) as any;
    await command(undefined);

    expect(filterRegionsSpy).not.toHaveBeenCalled();
    expect(mockTree._onDidChangeTreeData.fire).not.toHaveBeenCalled();
  });

  test("Should prioritize profile region name in filter history", async () => {
    const mockHistory = ["REGION1", "REGION2", "MYREG", "REGION3"];
    jest.spyOn(PersistentStorage, "getSearchHistory").mockReturnValue(mockHistory);
    getPatternFromFilterSpy.mockResolvedValueOnce("MYREG");

    const regionsContainer = new CICSRegionsContainer(createMockPlexTree());
    mockTreeView = { selection: [regionsContainer], reveal: jest.fn() };

    const command = getFilterPlexResources(mockTree, mockTreeView) as any;
    await command(undefined);

    expect(getPatternFromFilterSpy).toHaveBeenCalledWith("Region", ["MYREG", "REGION1", "REGION2", "REGION3"], false, "MYREG");
  });

  test("Should pass profile region name to getPatternFromFilter", async () => {
    getPatternFromFilterSpy.mockResolvedValueOnce("TEST*");

    const regionsContainer = new CICSRegionsContainer(createMockPlexTree());
    mockTreeView = { selection: [regionsContainer], reveal: jest.fn() };

    const command = getFilterPlexResources(mockTree, mockTreeView) as any;
    await command(undefined);

    expect(getPatternFromFilterSpy).toHaveBeenCalledWith("Region", expect.any(Array), false, "MYREG");
  });

  test("Should handle profile without region name", async () => {
    const mockPlexWithoutRegion = {
      profile: { ...profile, profile: { ...profile.profile, regionName: undefined as any } },
      getProfile: () => ({ ...profile, profile: { ...profile.profile, regionName: undefined as any } }),
      getPlexName: () => "MYPLEX",
      getParent: () => ({ getProfile: () => profile }),
      getGroupName: (): string | undefined => undefined,
      saveRegionFilter: jest.fn(),
    } as any;

    getPatternFromFilterSpy.mockResolvedValueOnce("TEST*");

    const regionsContainer = new CICSRegionsContainer(mockPlexWithoutRegion);
    mockTreeView = { selection: [regionsContainer], reveal: jest.fn() };

    const command = getFilterPlexResources(mockTree, mockTreeView) as any;
    await command(undefined);

    expect(getPatternFromFilterSpy).toHaveBeenCalledWith("Region", expect.any(Array), false, undefined);
  });

  test("Should save filter to persistent storage after filtering", async () => {
    const appendSearchHistorySpy = jest.spyOn(PersistentStorage, "appendSearchHistory");
    getPatternFromFilterSpy.mockResolvedValueOnce("TEST*");

    const regionsContainer = new CICSRegionsContainer(createMockPlexTree());
    mockTreeView = { selection: [regionsContainer], reveal: jest.fn() };

    const command = getFilterPlexResources(mockTree, mockTreeView) as any;
    await command(undefined);

    expect(appendSearchHistorySpy).toHaveBeenCalledWith("CICSManagedRegion", "TEST*");
  });

  test("Should not save filter when user cancels", async () => {
    const appendSearchHistorySpy = jest.spyOn(PersistentStorage, "appendSearchHistory");
    getPatternFromFilterSpy.mockResolvedValueOnce(undefined);

    const regionsContainer = new CICSRegionsContainer(createMockPlexTree());
    const filterRegionsSpy = jest.spyOn(regionsContainer, "filterRegions");
    mockTreeView = { selection: [regionsContainer], reveal: jest.fn() };

    const command = getFilterPlexResources(mockTree, mockTreeView) as any;
    await command(undefined);

    expect(filterRegionsSpy).not.toHaveBeenCalled();
    expect(appendSearchHistorySpy).not.toHaveBeenCalled();
  });
});

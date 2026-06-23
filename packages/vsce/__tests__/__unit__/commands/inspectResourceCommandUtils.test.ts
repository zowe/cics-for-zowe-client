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

import {
  getInspectableResourceTypes,
  showInspectResource,
  inspectResourceByNode,
  inspectResourceByName,
  inspectResource,
  inspectRegionByName,
  inspectRegionByNode,
} from "../../../src/commands/inspectResourceCommandUtils";
import { ResourceInspectorViewProvider } from "../../../src/trees/ResourceInspectorViewProvider";
import { commands, window, type ExtensionContext } from "vscode";
import { Gui } from "@zowe/zowe-explorer-api";
import { getLastUsedRegion } from "../../../src/commands/setCICSRegionCommand";
import { ResourceContainer } from "../../../src/resources";
import { CICSLogger } from "../../../src/utils/CICSLogger";
import { ProgramMeta, RegionMeta, ManagedRegionMeta, LocalFileMeta } from "../../../src/doc";

jest.mock("vscode");
jest.mock("@zowe/zowe-explorer-api");
jest.mock("../../../src/commands/setCICSRegionCommand");
jest.mock("../../../src/resources");
jest.mock("../../../src/trees/ResourceInspectorViewProvider");
jest.mock("../../../src/utils/CICSLogger");

describe("inspectResourceCommandUtils", () => {
  let mockContext: Partial<ExtensionContext>;
  let mockProfile: { name: string; type: string };
  let mockSession: { ISession: { hostname: string } };

  beforeEach(() => {
    jest.clearAllMocks();

    mockProfile = {
      name: "testProfile",
      type: "cics",
    };

    mockSession = {
      ISession: {
        hostname: "test.com",
      },
    };

    mockContext = {
      subscriptions: [],
      extensionPath: "/test/path",
    };

    (commands.executeCommand as jest.Mock) = jest.fn().mockResolvedValue(undefined);
  });

  describe("getInspectableResourceTypes", () => {
    test("Not all meta types are visible", () => {
      const result = getInspectableResourceTypes();
      expect(Array.from(result.keys()).includes("Program")).toBe(true);
      // Files are a special case where we want to combine local and remote into one option
      expect(Array.from(result.keys()).includes("Local File")).toBe(false);
      expect(Array.from(result.keys()).includes("File")).toBe(true);
      // We do not want to show LIBDSN in the list of inspectable resources because it doesn't currently work
      expect(Array.from(result.keys()).includes("Library Dataset")).toBe(false);
    });

    test("Should return a map of resource types", () => {
      const result = getInspectableResourceTypes();
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBeGreaterThan(0);
    });

    test("Should include TS Queue as combined type", () => {
      const result = getInspectableResourceTypes();
      expect(Array.from(result.keys()).includes("TS Queue")).toBe(true);
    });
  });

  describe("showInspectResource", () => {
    it("should execute commands to show resource inspector", async () => {
      const mockResources = [
        {
          containedResource: {
            resource: { attributes: { name: "TEST", eyu_cicsname: "REGION1" } },
            meta: ProgramMeta,
          },
          ctx: {
            profile: mockProfile,
            session: mockSession,
            regionName: "REGION1",
            cicsplexName: undefined as string | undefined,
          },
        },
      ];

      const mockSetResources = jest.fn().mockResolvedValue(undefined);
      (ResourceInspectorViewProvider.getInstance as jest.Mock) = jest.fn().mockReturnValue({
        setResources: mockSetResources,
      });

      // @ts-expect-error - Mock context for testing
      await showInspectResource(mockContext, mockResources);

      expect(commands.executeCommand).toHaveBeenCalledWith(
        "setContext",
        "cics-extension-for-zowe.showResourceInspector",
        true
      );
      expect(commands.executeCommand).toHaveBeenCalledWith("resource-inspector.focus");
      expect(mockSetResources).toHaveBeenCalledWith(mockResources, undefined);
    });
  });

  describe("inspectResourceByNode", () => {
    it("should inspect resource by node", async () => {
      const mockNode = {
        getProfile: jest.fn().mockReturnValue(mockProfile),
        getSession: jest.fn().mockReturnValue(mockSession),
        cicsplexName: "PLEX1",
        regionName: "REGION1",
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { eyu_cicsname: "REGION1", name: "TESTPROG" } },
          meta: ProgramMeta,
        }),
        getContainedResourceName: jest.fn().mockReturnValue("TESTPROG"),
        getParent: jest.fn().mockReturnValue({
          getContainedResource: jest.fn().mockReturnValue({
            resource: { attributes: { name: "PARENT" } },
          }),
        }),
      };

      const mockResource = {
        resource: { attributes: { name: "TESTPROG" } },
        meta: ProgramMeta,
      };

      const mockFetchNextPage = jest.fn().mockResolvedValue([mockResource]);
      (ResourceContainer as jest.Mock) = jest.fn().mockImplementation(() => ({
        setCriteria: jest.fn(),
        fetchNextPage: mockFetchNextPage,
      }));

      (window.withProgress as jest.Mock) = jest.fn().mockImplementation((options, callback) => {
        return callback({}, { onCancellationRequested: jest.fn() });
      });

      const mockSetResources = jest.fn().mockResolvedValue(undefined);
      (ResourceInspectorViewProvider.getInstance as jest.Mock) = jest.fn().mockReturnValue({
        setResources: mockSetResources,
      });

      // @ts-expect-error - Mock objects for testing
      await inspectResourceByNode(mockContext, mockNode);

      expect(mockFetchNextPage).toHaveBeenCalled();
      expect(mockSetResources).toHaveBeenCalled();
    });

    it("should handle when resource is not found", async () => {
      const mockNode = {
        getProfile: jest.fn().mockReturnValue(mockProfile),
        getSession: jest.fn().mockReturnValue(mockSession),
        cicsplexName: "PLEX1",
        regionName: "REGION1",
        getContainedResource: jest.fn().mockReturnValue({
          resource: { attributes: { eyu_cicsname: "REGION1", name: "TESTPROG" } },
          meta: ProgramMeta,
        }),
        getContainedResourceName: jest.fn().mockReturnValue("TESTPROG"),
        getParent: jest.fn().mockReturnValue(null),
      };

      const mockFetchNextPage = jest.fn().mockResolvedValue([]);
      (ResourceContainer as jest.Mock) = jest.fn().mockImplementation(() => ({
        setCriteria: jest.fn(),
        fetchNextPage: mockFetchNextPage,
      }));

      (window.withProgress as jest.Mock) = jest.fn().mockImplementation((options, callback) => {
        return callback({}, { onCancellationRequested: jest.fn() });
      });

      (window.showErrorMessage as jest.Mock) = jest.fn();

      // @ts-expect-error - Mock objects for testing
      await inspectResourceByNode(mockContext, mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(CICSLogger.error).toHaveBeenCalled();
    });
  });

  describe("inspectResourceByName", () => {
    it("should inspect resource by name", async () => {
      const mockRegion = {
        profile: mockProfile,
        session: mockSession,
        regionName: "REGION1",
        cicsPlexName: "PLEX1",
      };

      (getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(mockRegion);

      const mockResource = {
        resource: { attributes: { name: "TESTPROG" } },
        meta: ProgramMeta,
      };

      const mockFetchNextPage = jest.fn().mockResolvedValue([mockResource]);
      (ResourceContainer as jest.Mock) = jest.fn().mockImplementation(() => ({
        setCriteria: jest.fn(),
        fetchNextPage: mockFetchNextPage,
      }));

      (window.withProgress as jest.Mock) = jest.fn().mockImplementation((options, callback) => {
        return callback({}, { onCancellationRequested: jest.fn() });
      });

      const mockSetResources = jest.fn().mockResolvedValue(undefined);
      (ResourceInspectorViewProvider.getInstance as jest.Mock) = jest.fn().mockReturnValue({
        setResources: mockSetResources,
      });

      // @ts-expect-error - Mock context for testing
      await inspectResourceByName(mockContext, "TESTPROG", "CICSProgram");

      expect(mockFetchNextPage).toHaveBeenCalled();
      expect(mockSetResources).toHaveBeenCalled();
    });

    it("should handle invalid resource type", async () => {
      const mockRegion = {
        profile: mockProfile,
        session: mockSession,
        regionName: "REGION1",
        cicsPlexName: "PLEX1",
      };

      (getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(mockRegion);
      (window.showErrorMessage as jest.Mock) = jest.fn();

      // @ts-expect-error - Mock context for testing
      await inspectResourceByName(mockContext, "TESTPROG", "InvalidType");

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(CICSLogger.error).toHaveBeenCalled();
    });

    it("should handle local file type", async () => {
      const mockRegion = {
        profile: mockProfile,
        session: mockSession,
        regionName: "REGION1",
        cicsPlexName: "PLEX1",
      };

      (getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(mockRegion);

      const mockResource = {
        resource: { attributes: { name: "TESTFILE" } },
        meta: LocalFileMeta,
      };

      const mockFetchNextPage = jest.fn().mockResolvedValue([mockResource]);
      (ResourceContainer as jest.Mock) = jest.fn().mockImplementation(() => ({
        setCriteria: jest.fn(),
        fetchNextPage: mockFetchNextPage,
      }));

      (window.withProgress as jest.Mock) = jest.fn().mockImplementation((options, callback) => {
        return callback({}, { onCancellationRequested: jest.fn() });
      });

      const mockSetResources = jest.fn().mockResolvedValue(undefined);
      (ResourceInspectorViewProvider.getInstance as jest.Mock) = jest.fn().mockReturnValue({
        setResources: mockSetResources,
      });

      // @ts-expect-error - Mock context for testing
      await inspectResourceByName(mockContext, "TESTFILE", "CICSLocalFile");

      expect(mockFetchNextPage).toHaveBeenCalled();
    });

    it("should return early if no region selected", async () => {
      (getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      // @ts-expect-error - Mock context for testing
      await inspectResourceByName(mockContext, "TESTPROG", "CICSProgram");

      expect(ResourceContainer).not.toHaveBeenCalled();
    });
  });

  describe("inspectResource", () => {
    it("should inspect resource with user selection", async () => {
      const mockRegion = {
        profile: mockProfile,
        session: mockSession,
        regionName: "REGION1",
        cicsPlexName: "PLEX1",
      };

      (getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(mockRegion);

      const mockQuickPick = {
        items: [] as any[],
        placeholder: "",
        ignoreFocusOut: true,
        show: jest.fn(),
        hide: jest.fn(),
      };

      (Gui.createQuickPick as jest.Mock) = jest.fn().mockReturnValue(mockQuickPick);
      (Gui.resolveQuickPick as jest.Mock) = jest.fn().mockResolvedValue({ label: "Program" });

      (window.showInputBox as jest.Mock) = jest.fn().mockResolvedValue("TESTPROG");

      const mockResource = {
        resource: { attributes: { name: "TESTPROG" } },
        meta: ProgramMeta,
      };

      const mockFetchNextPage = jest.fn().mockResolvedValue([mockResource]);
      (ResourceContainer as jest.Mock) = jest.fn().mockImplementation(() => ({
        setCriteria: jest.fn(),
        fetchNextPage: mockFetchNextPage,
      }));

      (window.withProgress as jest.Mock) = jest.fn().mockImplementation((options, callback) => {
        return callback({}, { onCancellationRequested: jest.fn() });
      });

      const mockSetResources = jest.fn().mockResolvedValue(undefined);
      (ResourceInspectorViewProvider.getInstance as jest.Mock) = jest.fn().mockReturnValue({
        setResources: mockSetResources,
      });

      // @ts-expect-error - Mock context for testing
      await inspectResource(mockContext);

      expect(mockSetResources).toHaveBeenCalled();
    });

    it("should return early if no region selected", async () => {
      (getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      // @ts-expect-error - Mock context for testing
      await inspectResource(mockContext);

      expect(Gui.createQuickPick).not.toHaveBeenCalled();
    });

    it("should return early if no resource type selected", async () => {
      const mockRegion = {
        profile: mockProfile,
        session: mockSession,
        regionName: "REGION1",
        cicsPlexName: "PLEX1",
      };

      (getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(mockRegion);

      const mockQuickPick = {
        items: [] as any[],
        placeholder: "",
        ignoreFocusOut: true,
        show: jest.fn(),
        hide: jest.fn(),
      };

      (Gui.createQuickPick as jest.Mock) = jest.fn().mockReturnValue(mockQuickPick);
      (Gui.resolveQuickPick as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      // @ts-expect-error - Mock context for testing
      await inspectResource(mockContext);

      expect(window.showInputBox).not.toHaveBeenCalled();
    });

    it("should return early if no resource name entered", async () => {
      const mockRegion = {
        profile: mockProfile,
        session: mockSession,
        regionName: "REGION1",
        cicsPlexName: "PLEX1",
      };

      (getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(mockRegion);

      const mockQuickPick = {
        items: [] as any[],
        placeholder: "",
        ignoreFocusOut: true,
        show: jest.fn(),
        hide: jest.fn(),
      };

      (Gui.createQuickPick as jest.Mock) = jest.fn().mockReturnValue(mockQuickPick);
      (Gui.resolveQuickPick as jest.Mock) = jest.fn().mockResolvedValue({ label: "Program" });

      (window.showInputBox as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      // @ts-expect-error - Mock context for testing
      await inspectResource(mockContext);

      expect(ResourceContainer).not.toHaveBeenCalled();
    });
  });

  describe("inspectRegionByName", () => {
    it("should inspect region by name", async () => {
      const mockResourceContext = {
        profile: mockProfile,
        session: mockSession,
        regionName: "REGION1",
        cicsplexName: "PLEX1",
      };

      const mockResource = {
        resource: { attributes: { applid: "REGION1" } },
        meta: ManagedRegionMeta,
      };

      const mockFetchNextPage = jest.fn().mockResolvedValue([mockResource]);
      (ResourceContainer as jest.Mock) = jest.fn().mockImplementation(() => ({
        setCriteria: jest.fn(),
        fetchNextPage: mockFetchNextPage,
      }));

      (window.withProgress as jest.Mock) = jest.fn().mockImplementation((options, callback) => {
        return callback({}, { onCancellationRequested: jest.fn() });
      });

      const mockSetResources = jest.fn().mockResolvedValue(undefined);
      (ResourceInspectorViewProvider.getInstance as jest.Mock) = jest.fn().mockReturnValue({
        setResources: mockSetResources,
      });

      // @ts-expect-error - Mock objects for testing
      await inspectRegionByName(mockContext, ManagedRegionMeta, mockResourceContext);

      expect(mockFetchNextPage).toHaveBeenCalled();
      expect(mockSetResources).toHaveBeenCalled();
    });

    it("should handle when region is not found", async () => {
      const mockResourceContext = {
        profile: mockProfile,
        session: mockSession,
        regionName: "REGION1",
        cicsplexName: "PLEX1",
      };

      const mockFetchNextPage = jest.fn().mockResolvedValue([]);
      (ResourceContainer as jest.Mock) = jest.fn().mockImplementation(() => ({
        setCriteria: jest.fn(),
        fetchNextPage: mockFetchNextPage,
      }));

      (window.withProgress as jest.Mock) = jest.fn().mockImplementation((options, callback) => {
        return callback({}, { onCancellationRequested: jest.fn() });
      });

      (window.showErrorMessage as jest.Mock) = jest.fn();

      // @ts-expect-error - Mock objects for testing
      await inspectRegionByName(mockContext, RegionMeta, mockResourceContext);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(CICSLogger.error).toHaveBeenCalled();
    });
  });

  describe("inspectRegionByNode", () => {
    it("should inspect managed region by node", async () => {
      const mockNode = {
        getProfile: jest.fn().mockReturnValue(mockProfile),
        getSession: jest.fn().mockReturnValue(mockSession),
        cicsplexName: "PLEX1",
        regionName: "REGION1",
        getContainedResourceName: jest.fn().mockReturnValue("REGION1"),
      };

      const mockResource = {
        resource: { attributes: { applid: "REGION1" } },
        meta: ManagedRegionMeta,
      };

      const mockFetchNextPage = jest.fn().mockResolvedValue([mockResource]);
      (ResourceContainer as jest.Mock) = jest.fn().mockImplementation(() => ({
        setCriteria: jest.fn(),
        fetchNextPage: mockFetchNextPage,
      }));

      (window.withProgress as jest.Mock) = jest.fn().mockImplementation((options, callback) => {
        return callback({}, { onCancellationRequested: jest.fn() });
      });

      const mockSetResources = jest.fn().mockResolvedValue(undefined);
      (ResourceInspectorViewProvider.getInstance as jest.Mock) = jest.fn().mockReturnValue({
        setResources: mockSetResources,
      });

      // @ts-expect-error - Mock objects for testing
      await inspectRegionByNode(mockContext, mockNode);

      expect(mockFetchNextPage).toHaveBeenCalled();
      expect(mockSetResources).toHaveBeenCalled();
    });

    it("should inspect plain region by node when no plex", async () => {
      const mockNode = {
        getProfile: jest.fn().mockReturnValue(mockProfile),
        getSession: jest.fn().mockReturnValue(mockSession),
        cicsplexName: undefined as string | undefined,
        regionName: "REGION1",
        getContainedResourceName: jest.fn().mockReturnValue("REGION1"),
      };

      const mockResource = {
        resource: { attributes: { applid: "REGION1" } },
        meta: RegionMeta,
      };

      const mockFetchNextPage = jest.fn().mockResolvedValue([mockResource]);
      (ResourceContainer as jest.Mock) = jest.fn().mockImplementation(() => ({
        setCriteria: jest.fn(),
        fetchNextPage: mockFetchNextPage,
      }));

      (window.withProgress as jest.Mock) = jest.fn().mockImplementation((options, callback) => {
        return callback({}, { onCancellationRequested: jest.fn() });
      });

      const mockSetResources = jest.fn().mockResolvedValue(undefined);
      (ResourceInspectorViewProvider.getInstance as jest.Mock) = jest.fn().mockReturnValue({
        setResources: mockSetResources,
      });

      // @ts-expect-error - Mock objects for testing
      await inspectRegionByNode(mockContext, mockNode);

      expect(mockFetchNextPage).toHaveBeenCalled();
      expect(mockSetResources).toHaveBeenCalled();
    });
  });
});
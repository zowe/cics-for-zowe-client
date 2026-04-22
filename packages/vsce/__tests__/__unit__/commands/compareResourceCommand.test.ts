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

import { window, type ExtensionContext } from "vscode";
import { Gui, MessageSeverity, type imperative } from "@zowe/zowe-explorer-api";
import type { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { compareTreeNodeWithPrompts } from "../../../src/commands/compareResourceCommand";
import { Resource, ResourceContainer } from "../../../src/resources";
import { ProgramMeta } from "../../../src/doc/meta/program.meta";
import * as setCICSRegionCommand from "../../../src/commands/setCICSRegionCommand";
import * as inspectResourceCommandUtils from "../../../src/commands/inspectResourceCommandUtils";
import type { CICSResourceContainerNode } from "../../../src/trees/CICSResourceContainerNode";
import type { CICSSession } from "@zowe/cics-for-zowe-sdk";

jest.mock("vscode");
jest.mock("@zowe/zowe-explorer-api");
jest.mock("../../../src/resources");
jest.mock("../../../src/commands/setCICSRegionCommand");
jest.mock("../../../src/commands/inspectResourceCommandUtils");

describe("compareResourceCommand", () => {
  let mockNode: Partial<CICSResourceContainerNode<IResource>>;
  let mockContext: ExtensionContext;
  let mockProfile: imperative.IProfileLoaded;
  let mockSession: CICSSession;
  let mockResource: { attributes: IResource };
  let programMeta: typeof ProgramMeta;

  beforeEach(() => {
    programMeta = ProgramMeta;
    jest.clearAllMocks();

    mockProfile = {
      name: "testProfile",
      type: "cics",
      profile: {},
      message: "",
      failNotFound: false,
    };

    mockSession = {
      ISession: {
        hostname: "test.com",
        port: 1234,
        protocol: "https",
        type: "token",
      },
      verified: undefined,
      setVerified: jest.fn(),
      isVerified: jest.fn().mockReturnValue(undefined),
      cicsplexName: undefined,
      regionName: undefined,
    } as Partial<CICSSession> as CICSSession;

    mockResource = {
      attributes: {
        name: "TESTPROG",
        eyu_cicsname: "TESTREGION",
      } as IResource,
    };

    mockNode = {
      getContainedResource: jest.fn().mockReturnValue({
        meta: programMeta,
        resource: mockResource,
      }),
      getProfile: jest.fn().mockReturnValue(mockProfile),
      getSession: jest.fn().mockReturnValue(mockSession),
      cicsplexName: "TESTPLEX",
      regionName: "TESTREGION",
    };

    mockContext = {} as ExtensionContext;

    (window.showErrorMessage as jest.Mock) = jest.fn();
    (window.showInputBox as jest.Mock) = jest.fn();
    (Gui.showMessage as jest.Mock) = jest.fn();
  });

  describe("compareTreeNodeWithPrompts", () => {
    it("should show error when no node is provided", async () => {
      await compareTreeNodeWithPrompts(null as any, mockContext);

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("No CICS resource selected")
      );
    });

    it("should show error when node has no meta", async () => {
      (mockNode.getContainedResource as jest.Mock).mockReturnValue({
        meta: null,
        resource: mockResource,
      });

      await compareTreeNodeWithPrompts(mockNode as CICSResourceContainerNode<IResource>, mockContext);

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("No CICS resource information available to compare")
      );
    });

    it("should show error when node has no resource", async () => {
      (mockNode.getContainedResource as jest.Mock).mockReturnValue({
        meta: programMeta,
        resource: null,
      });

      await compareTreeNodeWithPrompts(mockNode as CICSResourceContainerNode<IResource>, mockContext);

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("No CICS resource information available to compare")
      );
    });

    it("should handle user cancelling region selection", async () => {
      (setCICSRegionCommand.getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(null);

      await compareTreeNodeWithPrompts(mockNode as CICSResourceContainerNode<IResource>, mockContext);

      expect(setCICSRegionCommand.getLastUsedRegion).toHaveBeenCalled();
      expect(window.showInputBox).not.toHaveBeenCalled();
    });

    it("should handle user cancelling resource name input", async () => {
      const mockTargetRegion = {
        profile: mockProfile,
        session: mockSession,
        cicsPlexName: "TESTPLEX2",
        regionName: "TESTREGION2",
      };

      (setCICSRegionCommand.getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(mockTargetRegion);
      (window.showInputBox as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      await compareTreeNodeWithPrompts(mockNode as CICSResourceContainerNode<IResource>, mockContext);

      expect(window.showInputBox).toHaveBeenCalled();
      expect(ResourceContainer).not.toHaveBeenCalled();
    });

    it("should validate resource name length", async () => {
      const mockTargetRegion = {
        profile: mockProfile,
        session: mockSession,
        cicsPlexName: "TESTPLEX2",
        regionName: "TESTREGION2",
      };

      (setCICSRegionCommand.getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(mockTargetRegion);
      
      let validateInput: ((value: string) => string | undefined) | undefined;
      (window.showInputBox as jest.Mock) = jest.fn().mockImplementation((options) => {
        validateInput = options.validateInput;
        return Promise.resolve("TESTPROG2");
      });

      await compareTreeNodeWithPrompts(mockNode as CICSResourceContainerNode<IResource>, mockContext);

      // Test validation function
      expect(validateInput).toBeDefined();
      const tooLongName = "A".repeat(100);
      const validationResult = validateInput?.(tooLongName);
      expect(validationResult).toBeDefined();
      expect(typeof validationResult).toBe("string");
    });

    it("should handle resource not found", async () => {
      const mockTargetRegion = {
        profile: mockProfile,
        session: mockSession,
        cicsPlexName: "TESTPLEX2",
        regionName: "TESTREGION2",
      };

      (setCICSRegionCommand.getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(mockTargetRegion);
      (window.showInputBox as jest.Mock) = jest.fn().mockResolvedValue("TESTPROG2");

      const mockResourceContainer = {
        setCriteria: jest.fn(),
        fetchNextPage: jest.fn().mockResolvedValue([]),
      };
      (ResourceContainer as jest.Mock) = jest.fn().mockReturnValue(mockResourceContainer);

      await compareTreeNodeWithPrompts(mockNode as CICSResourceContainerNode<IResource>, mockContext);

      expect(mockResourceContainer.fetchNextPage).toHaveBeenCalled();
      expect(window.showErrorMessage).toHaveBeenCalled();
    });

    it("should handle different resource types error", async () => {
      const mockTargetRegion = {
        profile: mockProfile,
        session: mockSession,
        cicsPlexName: "TESTPLEX2",
        regionName: "TESTREGION2",
      };

      const differentMeta = {
        ...programMeta,
        resourceName: "DIFFERENT_TYPE",
      };

      (setCICSRegionCommand.getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(mockTargetRegion);
      (window.showInputBox as jest.Mock) = jest.fn().mockResolvedValue("TESTPROG2");

      const mockResourceContainer = {
        setCriteria: jest.fn(),
        fetchNextPage: jest.fn().mockResolvedValue([
          {
            meta: differentMeta,
            resource: new Resource(mockResource.attributes),
          },
        ]),
      };
      (ResourceContainer as jest.Mock) = jest.fn().mockReturnValue(mockResourceContainer);

      await compareTreeNodeWithPrompts(mockNode as CICSResourceContainerNode<IResource>, mockContext);

      expect(Gui.showMessage).toHaveBeenCalledWith(
        expect.stringContaining("Cannot compare CICS resources of different types"),
        { severity: MessageSeverity.ERROR }
      );
    });

    it("should successfully compare two resources", async () => {
      const mockTargetRegion = {
        profile: mockProfile,
        session: mockSession,
        cicsPlexName: "TESTPLEX2",
        regionName: "TESTREGION2",
      };

      (setCICSRegionCommand.getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(mockTargetRegion);
      (window.showInputBox as jest.Mock) = jest.fn().mockResolvedValue("TESTPROG2");

      const mockResourceContainer = {
        setCriteria: jest.fn(),
        fetchNextPage: jest.fn().mockResolvedValue([
          {
            meta: programMeta,
            resource: new Resource({ name: "TESTPROG2", eyu_cicsname: "TESTREGION2" }),
          },
        ]),
      };
      (ResourceContainer as jest.Mock) = jest.fn().mockReturnValue(mockResourceContainer);
      (inspectResourceCommandUtils.showInspectResource as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      await compareTreeNodeWithPrompts(mockNode as CICSResourceContainerNode<IResource>, mockContext);

      expect(inspectResourceCommandUtils.showInspectResource).toHaveBeenCalledWith(
        mockContext,
        expect.arrayContaining([
          expect.objectContaining({
            containedResource: expect.any(Object),
            ctx: expect.any(Object),
          }),
        ])
      );
    });

    it("should handle errors during comparison", async () => {
      const mockTargetRegion = {
        profile: mockProfile,
        session: mockSession,
        cicsPlexName: "TESTPLEX2",
        regionName: "TESTREGION2",
      };

      (setCICSRegionCommand.getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(mockTargetRegion);
      (window.showInputBox as jest.Mock) = jest.fn().mockResolvedValue("TESTPROG2");

      const mockError = new Error("Test error");
      (ResourceContainer as jest.Mock) = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      await compareTreeNodeWithPrompts(mockNode as CICSResourceContainerNode<IResource>, mockContext);

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("Failed to compare resources")
      );
    });

    it("should use eyu_cicsname when regionName is not available", async () => {
      mockNode.regionName = undefined;
      
      const mockTargetRegion = {
        profile: mockProfile,
        session: mockSession,
        cicsPlexName: "TESTPLEX2",
        regionName: "TESTREGION2",
      };

      (setCICSRegionCommand.getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(mockTargetRegion);
      (window.showInputBox as jest.Mock) = jest.fn().mockResolvedValue("TESTPROG2");

      const mockResourceContainer = {
        setCriteria: jest.fn(),
        fetchNextPage: jest.fn().mockResolvedValue([
          {
            meta: programMeta,
            resource: new Resource({ name: "TESTPROG2", eyu_cicsname: "TESTREGION2" }),
          },
        ]),
      };
      (ResourceContainer as jest.Mock) = jest.fn().mockReturnValue(mockResourceContainer);
      (inspectResourceCommandUtils.showInspectResource as jest.Mock) = jest.fn().mockResolvedValue(undefined);

      await compareTreeNodeWithPrompts(mockNode as CICSResourceContainerNode<IResource>, mockContext);

      expect(inspectResourceCommandUtils.showInspectResource).toHaveBeenCalled();
    });
  });
});
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
import { Gui, MessageSeverity } from "@zowe/zowe-explorer-api";
import { compareTreeNodeWithPrompts } from "../../../src/commands/compareResourceCommand";
import { Resource, ResourceContainer } from "../../../src/resources";
import { ProgramMeta } from "../../../src/doc/meta/program.meta";
import * as setCICSRegionCommand from "../../../src/commands/setCICSRegionCommand";
import * as inspectResourceCommandUtils from "../../../src/commands/inspectResourceCommandUtils";

jest.mock("vscode");
jest.mock("@zowe/zowe-explorer-api");
jest.mock("../../../src/resources");
jest.mock("../../../src/commands/setCICSRegionCommand");
jest.mock("../../../src/commands/inspectResourceCommandUtils");

describe("compareResourceCommand", () => {
  let mockNode: any;
  let mockContext: ExtensionContext;
  let mockProfile: any;
  let mockSession: any;
  let mockResource: any;
  let programMeta: any;

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
      },
    };

    mockResource = {
      attributes: {
        name: "TESTPROG",
        eyu_cicsname: "TESTREGION",
      },
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
      mockNode.getContainedResource.mockReturnValue({
        meta: null,
        resource: mockResource,
      });

      await compareTreeNodeWithPrompts(mockNode, mockContext);

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("No CICS resource information available to compare")
      );
    });

    it("should show error when node has no resource", async () => {
      mockNode.getContainedResource.mockReturnValue({
        meta: programMeta,
        resource: null,
      });

      await compareTreeNodeWithPrompts(mockNode, mockContext);

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("No CICS resource information available to compare")
      );
    });

    it("should handle user cancelling region selection", async () => {
      (setCICSRegionCommand.getLastUsedRegion as jest.Mock) = jest.fn().mockResolvedValue(null);

      await compareTreeNodeWithPrompts(mockNode, mockContext);

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

      await compareTreeNodeWithPrompts(mockNode, mockContext);

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
      
      let validateInput: any;
      (window.showInputBox as jest.Mock) = jest.fn().mockImplementation((options) => {
        validateInput = options.validateInput;
        return Promise.resolve("TESTPROG2");
      });

      await compareTreeNodeWithPrompts(mockNode, mockContext);

      // Test validation function
      expect(validateInput).toBeDefined();
      const tooLongName = "A".repeat(100);
      const validationResult = validateInput(tooLongName);
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

      await compareTreeNodeWithPrompts(mockNode, mockContext);

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

      await compareTreeNodeWithPrompts(mockNode, mockContext);

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

      await compareTreeNodeWithPrompts(mockNode, mockContext);

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

      await compareTreeNodeWithPrompts(mockNode, mockContext);

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

      await compareTreeNodeWithPrompts(mockNode, mockContext);

      expect(inspectResourceCommandUtils.showInspectResource).toHaveBeenCalled();
    });
  });
});
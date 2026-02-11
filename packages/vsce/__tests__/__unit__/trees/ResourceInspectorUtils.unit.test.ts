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

// Mock dependencies
jest.mock("../../../src/commands/inspectResourceCommandUtils");
jest.mock("../../../src/extending/CICSResourceExtender");
jest.mock("../../../src/resources");
jest.mock("../../../src/doc", () => {
  const actual = jest.requireActual("../../../src/doc");
  return {
    ...actual,
    getMetas: jest.fn(() => [actual.ProgramMeta]),
  };
});
jest.mock("../../../src/utils/PersistentStorage", () => ({
  __esModule: true,
  default: {
    getCriteria: jest.fn(),
    setCriteria: jest.fn(),
  },
}));

import { IProgram, IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { ExtensionContext, ProgressLocation } from "vscode";
import * as inspectResourceCommandUtils from "../../../src/commands/inspectResourceCommandUtils";
import { IContainedResource, ProgramMeta } from "../../../src/doc";
import CICSResourceExtender from "../../../src/extending/CICSResourceExtender";
import { Resource, ResourceContainer } from "../../../src/resources";
import { IResourceInspectorResource } from "../../../src/webviews/common/vscode";
import { handleActionCommand, handleRefreshCommand } from "../../../src/trees/ResourceInspectorUtils";
import { ResourceInspectorViewProvider } from "../../../src/trees/ResourceInspectorViewProvider";
import { profile } from "../../__mocks__";
import { Gui } from "@zowe/zowe-explorer-api";

const vscode = require("vscode");

describe("ResourceInspectorUtils", () => {
  let mockContext: ExtensionContext;
  let mockInstance: ResourceInspectorViewProvider;
  let mockResourceContainer: jest.Mocked<ResourceContainer>;

  const createMockResource = (name: string, resourceName: string = "CICSProgram"): IResourceInspectorResource => ({
    name,
    resource: { program: name, status: "ENABLED", newcopycnt: "0" } as IProgram,
    context: { profile, cicsplexName: "PLEX1", regionName: "REGION1" } as IResourceContext,
    meta: { resourceName, getName: jest.fn(() => name) } as any,
    highlights: [],
    actions: [],
  });

  const createMockContainedResource = (name: string): IContainedResource<IProgram> => ({
    meta: ProgramMeta,
    resource: {
      attributes: { program: name, status: "ENABLED", newcopycnt: "0" } as IProgram,
      resource: { program: name, status: "ENABLED", newcopycnt: "0" } as IProgram,
    } as any,
  });

  const setupWithProgressMock = () => {
    vscode.window.withProgress.mockImplementation(async (options: any, callback: any) => {
      const progress = { report: jest.fn() };
      return await callback(progress);
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockContext = {} as ExtensionContext;
    mockInstance = {
      getResources: jest.fn(),
    } as any;

    mockResourceContainer = {
      setCriteria: jest.fn(),
      fetchNextPage: jest.fn(),
      ensureSummaries: jest.fn(),
    } as any;

    (ResourceContainer as jest.Mock).mockImplementation(() => mockResourceContainer);
    (Resource as jest.Mock).mockImplementation((data: any) => ({ attributes: data, resource: data }));
  });

  describe("executeAction", () => {
    describe("action command", () => {
      it("should handle string action command without refresh", async () => {
        const mockAction = {
          action: "test.command",
          refreshResourceInspector: false,
        };
        (CICSResourceExtender.getAction as jest.Mock).mockReturnValue(mockAction);

        const actionId = "testAction";
        const resources = [createMockResource("PROG1")];

        await handleActionCommand(actionId, resources, mockInstance, mockContext);

        expect(CICSResourceExtender.getAction).toHaveBeenCalledWith("testAction");
        expect(vscode.commands.executeCommand).toHaveBeenCalledWith("test.command", expect.any(Object));
        expect(vscode.window.withProgress).not.toHaveBeenCalled();
      });

      it("should handle string action command with refresh", async () => {
        const mockAction = {
          action: "test.command",
          refreshResourceInspector: true,
        };
        (CICSResourceExtender.getAction as jest.Mock).mockReturnValue(mockAction);

        const resource = createMockResource("PROG1");
        const actionId = "testAction";
        const resources = [resource];

        const updatedResource = createMockContainedResource("PROG1");
        mockResourceContainer.fetchNextPage.mockResolvedValue([updatedResource]);
        (mockInstance.getResources as jest.Mock).mockReturnValue([resource]);

        setupWithProgressMock();
        await handleActionCommand(actionId, resources, mockInstance, mockContext);

        expect(vscode.commands.executeCommand).toHaveBeenCalledWith("test.command", expect.any(Object));
        expect(vscode.window.withProgress).toHaveBeenCalled();
        expect(inspectResourceCommandUtils.showInspectResource).toHaveBeenCalled();
      });

      it("should handle function action command", async () => {
        const mockActionFunction = jest.fn();
        const mockAction = {
          action: mockActionFunction,
        };
        (CICSResourceExtender.getAction as jest.Mock).mockReturnValue(mockAction);

        const resource = createMockResource("PROG1");
        const actionId = "testAction";
        const resources = [resource];

        await handleActionCommand(actionId, resources, mockInstance, mockContext);

        expect(mockActionFunction).toHaveBeenCalledWith(resource.resource, resource.context);
        expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
      });

      it("should handle multiple resources for string action", async () => {
        const mockAction = {
          action: "test.command",
          refreshResourceInspector: false,
        };
        (CICSResourceExtender.getAction as jest.Mock).mockReturnValue(mockAction);

        const actionId = "testAction";
        const resources = [createMockResource("PROG1"), createMockResource("PROG2")];

        await handleActionCommand(actionId, resources, mockInstance, mockContext);

        expect(vscode.commands.executeCommand).toHaveBeenCalledTimes(2);
      });

      it("should return early if action not found", async () => {
        (CICSResourceExtender.getAction as jest.Mock).mockReturnValue(null);

        const actionId = "nonexistent";
        const resources = [createMockResource("PROG1")];

        await handleActionCommand(actionId, resources, mockInstance, mockContext);

        expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
        expect(vscode.window.withProgress).not.toHaveBeenCalled();
      });
    });

    describe("refresh command", () => {
      it("should refresh resources and merge with existing", async () => {
        const existingResource = createMockResource("PROG1");
        const updatedResource = createMockContainedResource("PROG1");

        (mockInstance.getResources as jest.Mock).mockReturnValue([existingResource]);
        mockResourceContainer.fetchNextPage.mockResolvedValue([updatedResource]);

        const resources = [existingResource];

        setupWithProgressMock();
        await handleRefreshCommand(resources, mockInstance, mockContext);

        expect(vscode.window.withProgress).toHaveBeenCalledWith(
          {
            location: ProgressLocation.Notification,
            cancellable: false,
          },
          expect.any(Function)
        );
        expect(mockResourceContainer.setCriteria).toHaveBeenCalledWith(["PROG1"]);
        expect(mockResourceContainer.fetchNextPage).toHaveBeenCalled();
        expect(inspectResourceCommandUtils.showInspectResource).toHaveBeenCalledWith(
          mockContext,
          expect.arrayContaining([
            expect.objectContaining({
              containedResource: updatedResource,
            }),
          ])
        );
      });

      it("should handle refresh with multiple resources", async () => {
        const resource1 = createMockResource("PROG1");
        const resource2 = createMockResource("PROG2");
        const updatedResource1 = createMockContainedResource("PROG1");
        const updatedResource2 = createMockContainedResource("PROG2");

        (mockInstance.getResources as jest.Mock).mockReturnValue([resource1, resource2]);
        mockResourceContainer.fetchNextPage
          .mockResolvedValueOnce([updatedResource1])
          .mockResolvedValueOnce([updatedResource2]);

        const resources = [resource1, resource2];

        setupWithProgressMock();
        await handleRefreshCommand(resources, mockInstance, mockContext);

        expect(mockResourceContainer.fetchNextPage).toHaveBeenCalledTimes(2);
        expect(inspectResourceCommandUtils.showInspectResource).toHaveBeenCalled();
      });

      it("should use fallback resource when updated resource not found", async () => {
        const existingResource = createMockResource("PROG1");
        const differentResource = createMockContainedResource("PROG2");

        (mockInstance.getResources as jest.Mock).mockReturnValue([existingResource]);
        mockResourceContainer.fetchNextPage.mockResolvedValue([differentResource]);

        const resources = [existingResource];

        setupWithProgressMock();
        await handleRefreshCommand(resources, mockInstance, mockContext);

        expect(inspectResourceCommandUtils.showInspectResource).toHaveBeenCalledWith(
          mockContext,
          expect.arrayContaining([
            expect.objectContaining({
              containedResource: expect.objectContaining({
                meta: ProgramMeta,
              }),
              ctx: existingResource.context,
            }),
          ])
        );
      });

      it("should handle refresh error and show error message", async () => {
        const error = new Error("Fetch failed");
        mockResourceContainer.ensureSummaries.mockRejectedValue(error);

        const resources = [createMockResource("PROG1")];

        await handleRefreshCommand(resources, mockInstance, mockContext);

        expect(Gui.showMessage).toHaveBeenCalledWith("Resource(s) PROG1 not found.");
      });

      it("should report progress during refresh", async () => {
        const progressReport = jest.fn();
        vscode.window.withProgress.mockImplementation(async (options: any, callback: any) => {
          const progress = { report: progressReport };
          const token = { onCancellationRequested: jest.fn() };
          return callback(progress, token);
        });

        const resource = createMockResource("PROG1");
        const updatedResource = createMockContainedResource("PROG1");

        (mockInstance.getResources as jest.Mock).mockReturnValue([resource]);
        mockResourceContainer.fetchNextPage.mockResolvedValue([updatedResource]);

        const resources = [resource];

        await handleRefreshCommand(resources, mockInstance, mockContext);

        expect(progressReport).toHaveBeenCalledWith({ message: "Refreshing..." });
      });
    });

    describe("resource matching", () => {
      it("should match resources by name, type, profile, plex, and region", async () => {
        const existingResource = createMockResource("PROG1", "CICSProgram");
        existingResource.context.cicsplexName = "PLEX1";
        existingResource.context.regionName = "REGION1";

        const matchingResource = createMockContainedResource("PROG1");
        matchingResource.meta.resourceName = "CICSProgram";

        (mockInstance.getResources as jest.Mock).mockReturnValue([existingResource]);
        mockResourceContainer.fetchNextPage.mockResolvedValue([matchingResource]);

        const resources = [existingResource];

        setupWithProgressMock();
        await handleRefreshCommand(resources, mockInstance, mockContext);

        expect(inspectResourceCommandUtils.showInspectResource).toHaveBeenCalledWith(
          mockContext,
          expect.arrayContaining([
            expect.objectContaining({
              containedResource: matchingResource,
            }),
          ])
        );
      });

      it("should not match resources with different names", async () => {
        const existingResource = createMockResource("PROG1");
        const differentResource = createMockContainedResource("PROG2");

        (mockInstance.getResources as jest.Mock).mockReturnValue([existingResource]);
        mockResourceContainer.fetchNextPage.mockResolvedValue([differentResource]);

        const resources = [existingResource];

        setupWithProgressMock();
        await handleRefreshCommand(resources, mockInstance, mockContext);
        const callArgs = (inspectResourceCommandUtils.showInspectResource as jest.Mock).mock.calls[0];
        const displayedResources = callArgs[1];
        expect(displayedResources[0].containedResource.resource.resource.program).toBe("PROG1");
      });
    });

    describe("edge cases", () => {
      it("should handle empty resources array", async () => {
        const resources: IResourceInspectorResource[] = [];

        (mockInstance.getResources as jest.Mock).mockReturnValue([]);

        await handleRefreshCommand(resources, mockInstance, mockContext);

        expect(mockResourceContainer.fetchNextPage).not.toHaveBeenCalled();
        expect(inspectResourceCommandUtils.showInspectResource).not.toHaveBeenCalled();
      });

      it("should handle null instance for refresh", async () => {
        const resource = createMockResource("PROG1");
        const updatedResource = createMockContainedResource("PROG1");

        mockResourceContainer.fetchNextPage.mockResolvedValue([updatedResource]);

        const resources = [resource];

        await handleRefreshCommand(resources, null as any, mockContext);

        expect(inspectResourceCommandUtils.showInspectResource).toHaveBeenCalledWith(
          mockContext,
          expect.arrayContaining([
            expect.objectContaining({
              containedResource: updatedResource,
            }),
          ])
        );
      });

      it("should handle action with no matching action gracefully", async () => {
        (CICSResourceExtender.getAction as jest.Mock).mockReturnValue(null);

        const actionId = "unknown";
        const resources = [createMockResource("PROG1")];

        await handleActionCommand(actionId, resources, mockInstance, mockContext);

        expect(vscode.commands.executeCommand).not.toHaveBeenCalled();
        expect(vscode.window.withProgress).not.toHaveBeenCalled();
      });
    });
  });
});

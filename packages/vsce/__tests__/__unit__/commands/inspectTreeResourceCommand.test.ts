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

import type { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { Gui, MessageSeverity } from "@zowe/zowe-explorer-api";
import { commands, window, type ExtensionContext, type TreeView } from "vscode";
import * as compareResourceCommand from "../../../src/commands/compareResourceCommand";
import * as inspectResourceCommandUtils from "../../../src/commands/inspectResourceCommandUtils";
import {
  getCompareResourceToCommand,
  getCompareResourcesCommand,
  getInspectTreeResourceCommand,
} from "../../../src/commands/inspectTreeResourceCommand";
import type { CICSResourceContainerNode } from "../../../src/trees";
import { ResourceInspectorViewProvider } from "../../../src/trees/ResourceInspectorViewProvider";

jest.mock("vscode");
jest.mock("@zowe/zowe-explorer-api");
jest.mock("../../../src/trees/ResourceInspectorViewProvider");
jest.mock("../../../src/commands/compareResourceCommand");
jest.mock("../../../src/commands/inspectResourceCommandUtils");

describe("inspectTreeResourceCommand", () => {
  let mockContext: ExtensionContext;
  let mockTreeView: Partial<TreeView<CICSResourceContainerNode<IResource>>> & { selection: CICSResourceContainerNode<IResource>[] };
  let mockNode: Partial<CICSResourceContainerNode<IResource>>;
  let mockMeta: {
    getName: jest.Mock;
    resourceName: string;
  };
  let mockResource: {
    attributes: {
      name: string;
      eyu_cicsname: string;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockContext = {} as ExtensionContext;

    mockResource = {
      attributes: {
        name: "TEST",
        eyu_cicsname: "REGION1",
      },
    };

    mockMeta = {
      getName: jest.fn().mockReturnValue("TEST"),
      resourceName: "CICSProgram",
    };

    mockNode = {
      getContainedResource: jest.fn().mockReturnValue({
        meta: mockMeta,
        resource: mockResource,
      }),
      getProfile: jest.fn().mockReturnValue({ name: "testProfile" }),
      getSession: jest.fn().mockReturnValue({ session: "mockSession" }),
      cicsplexName: "PLEX1",
      regionName: "REGION1",
    };

    mockTreeView = {
      selection: [],
    };

    (commands.registerCommand as jest.Mock) = jest.fn();
    (commands.executeCommand as jest.Mock) = jest.fn();
    (window.showErrorMessage as jest.Mock) = jest.fn();
    (window.showInformationMessage as jest.Mock) = jest.fn();
    (Gui.showMessage as jest.Mock) = jest.fn();
    (inspectResourceCommandUtils.inspectResourceByNode as jest.Mock) = jest.fn();
    (inspectResourceCommandUtils.showInspectResource as jest.Mock) = jest.fn();
    (compareResourceCommand.compareTreeNodeWithPrompts as jest.Mock) = jest.fn();
  });

  describe("getInspectTreeResourceCommand", () => {
    it("should register the command", () => {
      getInspectTreeResourceCommand(mockContext, mockTreeView as TreeView<CICSResourceContainerNode<IResource>>);

      expect(commands.registerCommand).toHaveBeenCalledWith("cics-extension-for-zowe.inspectTreeResource", expect.any(Function));
    });

    it("should inspect resource when node is provided", async () => {
      getInspectTreeResourceCommand(mockContext, mockTreeView as TreeView<CICSResourceContainerNode<IResource>>);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(mockNode);

      expect(inspectResourceCommandUtils.inspectResourceByNode).toHaveBeenCalledWith(mockContext, mockNode);
    });

    it("should show error when no node and no selection", async () => {
      getInspectTreeResourceCommand(mockContext, mockTreeView as TreeView<CICSResourceContainerNode<IResource>>);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(undefined);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(inspectResourceCommandUtils.inspectResourceByNode).not.toHaveBeenCalled();
    });

    it("should use last selected element from treeview", async () => {
      mockTreeView.selection = [mockNode as CICSResourceContainerNode<IResource>];
      getInspectTreeResourceCommand(mockContext, mockTreeView as TreeView<CICSResourceContainerNode<IResource>>);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(undefined);

      expect(inspectResourceCommandUtils.inspectResourceByNode).toHaveBeenCalledWith(mockContext, mockNode);
    });

    it("should show error when node has no meta", async () => {
      mockNode.getContainedResource = jest.fn().mockReturnValue({
        meta: null,
        resource: mockResource,
      });
      mockTreeView.selection = [mockNode as CICSResourceContainerNode<IResource>];
      getInspectTreeResourceCommand(mockContext, mockTreeView as TreeView<CICSResourceContainerNode<IResource>>);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(undefined);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(inspectResourceCommandUtils.inspectResourceByNode).not.toHaveBeenCalled();
    });

    it("should show error when node has no resource", async () => {
      mockNode.getContainedResource = jest.fn().mockReturnValue({
        meta: mockMeta,
        resource: null,
      });
      mockTreeView.selection = [mockNode as CICSResourceContainerNode<IResource>];
      getInspectTreeResourceCommand(mockContext, mockTreeView as TreeView<CICSResourceContainerNode<IResource>>);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(undefined);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(inspectResourceCommandUtils.inspectResourceByNode).not.toHaveBeenCalled();
    });

    it("should show info message when multiple resources selected", async () => {
      const mockNode2 = { ...mockNode };
      const mockNode3 = { ...mockNode };
      // Need at least 3 nodes: after pop(), there should be > 1 left
      mockTreeView.selection = [
        mockNode as CICSResourceContainerNode<IResource>,
        mockNode2 as CICSResourceContainerNode<IResource>,
        mockNode3 as CICSResourceContainerNode<IResource>,
      ];
      getInspectTreeResourceCommand(mockContext, mockTreeView as TreeView<CICSResourceContainerNode<IResource>>);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(undefined);

      expect(window.showInformationMessage).toHaveBeenCalled();
      expect(inspectResourceCommandUtils.inspectResourceByNode).toHaveBeenCalledWith(mockContext, mockNode3);
    });
  });

  describe("getCompareResourcesCommand", () => {
    it("should register the command", () => {
      getCompareResourcesCommand(mockContext, mockTreeView as TreeView<CICSResourceContainerNode<IResource>>);

      expect(commands.registerCommand).toHaveBeenCalledWith("cics-extension-for-zowe.compareTreeResources", expect.any(Function));
    });

    it("should use inspector resource when no selection and no node", async () => {
      const mockInspector = {
        getResources: jest.fn().mockReturnValue([
          {
            meta: mockMeta,
            resource: mockResource.attributes,
            context: {
              profile: { name: "testProfile" },
              session: { session: "mockSession" },
              cicsplexName: "PLEX1",
              regionName: "REGION1",
            },
          },
        ]),
      };
      (ResourceInspectorViewProvider.getInstance as jest.Mock) = jest.fn().mockReturnValue(mockInspector);

      getCompareResourcesCommand(mockContext, mockTreeView as TreeView<CICSResourceContainerNode<IResource>>);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(undefined);

      expect(compareResourceCommand.compareTreeNodeWithPrompts).toHaveBeenCalled();

      // Verify the inspectorAsNode structure by calling getContainedResource
      const callArgs = (compareResourceCommand.compareTreeNodeWithPrompts as jest.Mock).mock.calls[0][0];
      const containedResource = callArgs.getContainedResource();
      expect(containedResource.meta).toBe(mockMeta);
      expect(containedResource.resource.attributes).toBe(mockResource.attributes);
    });

    it("should show error when no resources in inspector", async () => {
      const mockInspector = {
        getResources: jest.fn().mockReturnValue([]),
      };
      (ResourceInspectorViewProvider.getInstance as jest.Mock) = jest.fn().mockReturnValue(mockInspector);

      getCompareResourcesCommand(mockContext, mockTreeView as TreeView<CICSResourceContainerNode<IResource>>);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(undefined);

      expect(window.showErrorMessage).toHaveBeenCalled();
    });

    it("should compare single selected node", async () => {
      mockTreeView.selection = [mockNode as CICSResourceContainerNode<IResource>];
      getCompareResourcesCommand(mockContext, mockTreeView as TreeView<CICSResourceContainerNode<IResource>>);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(undefined);

      expect(compareResourceCommand.compareTreeNodeWithPrompts).toHaveBeenCalledWith(mockNode, mockContext);
    });

    it("should compare two selected nodes of same type", async () => {
      const mockNode2 = { ...mockNode };
      mockTreeView.selection = [mockNode as CICSResourceContainerNode<IResource>, mockNode2 as CICSResourceContainerNode<IResource>];
      getCompareResourcesCommand(mockContext, mockTreeView as TreeView<CICSResourceContainerNode<IResource>>);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(undefined);

      expect(inspectResourceCommandUtils.showInspectResource).toHaveBeenCalled();
    });

    it("should show error when comparing different resource types", async () => {
      const mockNode2: Partial<CICSResourceContainerNode<IResource>> = {
        ...mockNode,
        getContainedResource: jest.fn().mockReturnValue({
          meta: { ...mockMeta, resourceName: "CICSTransaction" },
          resource: mockResource,
        }),
      };
      mockTreeView.selection = [mockNode as CICSResourceContainerNode<IResource>, mockNode2 as CICSResourceContainerNode<IResource>];
      getCompareResourcesCommand(mockContext, mockTreeView as TreeView<CICSResourceContainerNode<IResource>>);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(undefined);

      expect(Gui.showMessage).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ severity: MessageSeverity.ERROR }));
    });

    it("should return early when more than 2 nodes selected", async () => {
      const mockNode2 = { ...mockNode };
      const mockNode3 = { ...mockNode };
      mockTreeView.selection = [
        mockNode as CICSResourceContainerNode<IResource>,
        mockNode2 as CICSResourceContainerNode<IResource>,
        mockNode3 as CICSResourceContainerNode<IResource>,
      ];
      getCompareResourcesCommand(mockContext, mockTreeView as TreeView<CICSResourceContainerNode<IResource>>);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(undefined);

      expect(inspectResourceCommandUtils.showInspectResource).not.toHaveBeenCalled();
      expect(compareResourceCommand.compareTreeNodeWithPrompts).not.toHaveBeenCalled();
    });

    it("should compare node when provided directly", async () => {
      getCompareResourcesCommand(mockContext, mockTreeView as TreeView<CICSResourceContainerNode<IResource>>);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(mockNode);

      expect(compareResourceCommand.compareTreeNodeWithPrompts).toHaveBeenCalledWith(mockNode, mockContext);
    });

    it("should handle node with eyu_cicsname as regionName", async () => {
      const mockNode2: Partial<CICSResourceContainerNode<IResource>> = {
        ...mockNode,
        regionName: undefined,
      };
      mockTreeView.selection = [mockNode as CICSResourceContainerNode<IResource>, mockNode2 as CICSResourceContainerNode<IResource>];
      getCompareResourcesCommand(mockContext, mockTreeView as TreeView<CICSResourceContainerNode<IResource>>);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(undefined);

      expect(inspectResourceCommandUtils.showInspectResource).toHaveBeenCalled();
      const callArgs = (inspectResourceCommandUtils.showInspectResource as jest.Mock).mock.calls[0][1];
      expect(callArgs[1].ctx.regionName).toBe("REGION1");
    });
  });

  describe("getCompareResourceToCommand", () => {
    it("should register the command", () => {
      getCompareResourceToCommand();

      expect(commands.registerCommand).toHaveBeenCalledWith("cics-extension-for-zowe.compareTreeResourceTo", expect.any(Function));
    });

    it("should execute compareTreeResources command", async () => {
      getCompareResourceToCommand();
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(mockNode);

      expect(commands.executeCommand).toHaveBeenCalledWith("cics-extension-for-zowe.compareTreeResources", mockNode);
    });
  });
});

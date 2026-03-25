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

import { IProgram } from "@zowe/cics-for-zowe-explorer-api";
import { commands, TreeView } from "vscode";
import { getClearFilterCommand, getFilterResourcesCommand } from "../../../src/commands/filterResourceCommands";
import { ProgramMeta } from "../../../src/doc";
import { CICSRegionTree, CICSResourceContainerNode, CICSSessionTree, CICSTree } from "../../../src/trees";
import { getPatternFromFilter } from "../../../src/utils/filterUtils";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import { profile } from "../../__mocks__";

jest.mock("../../../src/utils/filterUtils");
jest.spyOn(PersistentStorage, "getCriteria").mockReturnValue(undefined);

describe("Filter Resource Commands", () => {
  let tree: CICSTree;
  let treeview: TreeView<any>;
  let sessionTree: CICSSessionTree;
  let regionTree: CICSRegionTree;
  let resourceNode: CICSResourceContainerNode<IProgram>;

  beforeEach(() => {
    tree = new CICSTree();
    treeview = {
      reveal: jest.fn().mockResolvedValue(undefined),
    } as any;

    sessionTree = new CICSSessionTree(profile, tree);
    regionTree = new CICSRegionTree("REG", {}, sessionTree, undefined, sessionTree);

    resourceNode = new CICSResourceContainerNode<IProgram>(
      "Programs",
      {
        profile,
        parentNode: regionTree,
        regionName: "REG",
      },
      undefined,
      [ProgramMeta]
    );

    // Mock the resource type methods
    resourceNode.resourceTypes[0].getCriteriaHistory = jest.fn().mockReturnValue(["PROG*", "CUST*"]);
    resourceNode.resourceTypes[0].appendCriteriaHistory = jest.fn().mockResolvedValue(undefined);
    resourceNode.resourceTypes[0].filterCaseSensitive = false;

    // Mock node methods
    resourceNode.reset = jest.fn().mockResolvedValue(undefined);
    resourceNode.setCriteria = jest.fn();
    resourceNode.clearCriteria = jest.fn();

    // Mock tree fire method
    tree._onDidChangeTreeData.fire = jest.fn();

    // Clear mocks
    jest.clearAllMocks();
  });

  describe("getFilterResourcesCommand", () => {
    it("should register the filter resources command", () => {
      const registerCommandSpy = jest.spyOn(commands, "registerCommand");
      
      getFilterResourcesCommand(tree, treeview);

      expect(registerCommandSpy).toHaveBeenCalledWith(
        "cics-extension-for-zowe.filterResources",
        expect.any(Function)
      );
    });

    it("should apply filter when pattern is provided", async () => {
      const mockPattern = "NEWPROG*";
      (getPatternFromFilter as jest.Mock).mockResolvedValue(mockPattern);

      getFilterResourcesCommand(tree, treeview);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(resourceNode);

      expect(getPatternFromFilter).toHaveBeenCalledWith(
        "Programs",
        ["PROG*", "CUST*"],
        false
      );
      expect(resourceNode.resourceTypes[0].appendCriteriaHistory).toHaveBeenCalledWith(mockPattern);
      expect(resourceNode.reset).toHaveBeenCalled();
      expect(resourceNode.setCriteria).toHaveBeenCalledWith([mockPattern]);
      expect(tree._onDidChangeTreeData.fire).toHaveBeenCalledWith(resourceNode);
      expect(treeview.reveal).toHaveBeenCalledWith(resourceNode, { expand: true });
    });

    it("should handle comma-separated patterns", async () => {
      const mockPattern = "PROG*,CUST*,TEST*";
      (getPatternFromFilter as jest.Mock).mockResolvedValue(mockPattern);

      getFilterResourcesCommand(tree, treeview);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(resourceNode);

      expect(resourceNode.setCriteria).toHaveBeenCalledWith(["PROG*", "CUST*", "TEST*"]);
    });

    it("should trim whitespace from patterns", async () => {
      const mockPattern = "PROG* , CUST* , TEST*";
      (getPatternFromFilter as jest.Mock).mockResolvedValue(mockPattern);

      getFilterResourcesCommand(tree, treeview);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(resourceNode);

      expect(resourceNode.setCriteria).toHaveBeenCalledWith(["PROG*", "CUST*", "TEST*"]);
    });

    it("should not apply filter when no pattern is provided", async () => {
      (getPatternFromFilter as jest.Mock).mockResolvedValue(undefined);

      // Clear previous mock calls
      jest.clearAllMocks();

      getFilterResourcesCommand(tree, treeview);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(resourceNode);

      expect(resourceNode.reset).not.toHaveBeenCalled();
      expect(resourceNode.setCriteria).not.toHaveBeenCalled();
      expect(tree._onDidChangeTreeData.fire).not.toHaveBeenCalled();
      expect(treeview.reveal).not.toHaveBeenCalled();
    });

    it("should append criteria to history for all resource types", async () => {
      const mockPattern = "MULTI*";
      (getPatternFromFilter as jest.Mock).mockResolvedValue(mockPattern);

      // Add a second resource type
      const secondResourceType = {
        getCriteriaHistory: jest.fn().mockReturnValue([]),
        appendCriteriaHistory: jest.fn().mockResolvedValue(undefined),
        filterCaseSensitive: false,
      };
      resourceNode.resourceTypes.push(secondResourceType as any);

      getFilterResourcesCommand(tree, treeview);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(resourceNode);

      expect(resourceNode.resourceTypes[0].appendCriteriaHistory).toHaveBeenCalledWith(mockPattern);
      expect(secondResourceType.appendCriteriaHistory).toHaveBeenCalledWith(mockPattern);
    });

    it("should use case sensitive setting from resource type", async () => {
      resourceNode.resourceTypes[0].filterCaseSensitive = true;
      const mockPattern = "CaseSensitive*";
      (getPatternFromFilter as jest.Mock).mockResolvedValue(mockPattern);

      getFilterResourcesCommand(tree, treeview);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(resourceNode);

      expect(getPatternFromFilter).toHaveBeenCalledWith(
        "Programs",
        ["PROG*", "CUST*"],
        true
      );
    });
  });

  describe("getClearFilterCommand", () => {
    it("should register the clear filter command", () => {
      const registerCommandSpy = jest.spyOn(commands, "registerCommand");
      
      getClearFilterCommand(tree);

      expect(registerCommandSpy).toHaveBeenCalledWith(
        "cics-extension-for-zowe.clearFilter",
        expect.any(Function)
      );
    });

    it("should clear filter and reset node", async () => {
      getClearFilterCommand(tree);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(resourceNode);

      expect(resourceNode.clearCriteria).toHaveBeenCalled();
      expect(resourceNode.reset).toHaveBeenCalled();
      expect(tree._onDidChangeTreeData.fire).toHaveBeenCalledWith(resourceNode);
    });

    it("should not reveal node after clearing filter", async () => {
      getClearFilterCommand(tree);
      const commandHandler = (commands.registerCommand as jest.Mock).mock.calls[0][1];

      await commandHandler(resourceNode);

      expect(treeview.reveal).not.toHaveBeenCalled();
    });
  });
});

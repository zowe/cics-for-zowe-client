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

import { commands, TreeView, window } from "vscode";
import type { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { getPhaseInCommand } from "../../../src/commands/phaseInCommand";
import { CICSTree } from "../../../src/trees/CICSTree";
import type { CICSResourceContainerNode } from "../../../src/trees/CICSResourceContainerNode";
import * as commandUtils from "../../../src/utils/commandUtils";
import * as actionResourceCommand from "../../../src/commands/actionResourceCommand";

jest.mock("vscode");
jest.mock("../../../src/utils/commandUtils");
jest.mock("../../../src/commands/actionResourceCommand");

describe("phaseInCommand", () => {
  let mockTree: CICSTree;
  let mockTreeView: TreeView<CICSResourceContainerNode<IResource>>;
  let commandCallback: Function;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTree = {} as CICSTree;
    mockTreeView = {} as TreeView<CICSResourceContainerNode<IResource>>;

    (commands.registerCommand as jest.Mock) = jest.fn((cmd, callback) => {
      commandCallback = callback;
      return { dispose: jest.fn() };
    });
  });

  it("should register the phaseInCommand", () => {
    getPhaseInCommand(mockTree, mockTreeView);

    expect(commands.registerCommand).toHaveBeenCalledWith(
      "cics-extension-for-zowe.phaseInCommand",
      expect.any(Function)
    );
  });

  it("should phase in program when nodes are selected", async () => {
    const mockNodes = [{ label: "PROG1" }, { label: "PROG2" }];
    (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue(mockNodes);
    (actionResourceCommand.actionTreeItem as jest.Mock).mockResolvedValue(undefined);

    getPhaseInCommand(mockTree, mockTreeView);
    await commandCallback({});

    expect(commandUtils.findSelectedNodes).toHaveBeenCalled();
    expect(actionResourceCommand.actionTreeItem).toHaveBeenCalledWith({
      action: "PHASEIN",
      nodes: mockNodes,
      tree: mockTree,
    });
  });

  it("should show error when no programs are selected", async () => {
    (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue(null);
    (window.showErrorMessage as jest.Mock).mockResolvedValue(undefined);

    getPhaseInCommand(mockTree, mockTreeView);
    await commandCallback({});

    expect(window.showErrorMessage).toHaveBeenCalled();
    expect(actionResourceCommand.actionTreeItem).not.toHaveBeenCalled();
  });

  it("should show error when empty array of nodes is returned", async () => {
    (commandUtils.findSelectedNodes as jest.Mock).mockReturnValue([]);
    (window.showErrorMessage as jest.Mock).mockResolvedValue(undefined);

    getPhaseInCommand(mockTree, mockTreeView);
    await commandCallback({});

    expect(window.showErrorMessage).toHaveBeenCalled();
    expect(actionResourceCommand.actionTreeItem).not.toHaveBeenCalled();
  });
});



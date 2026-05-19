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

import type { ILocalFile, IResource } from "@zowe/cics-for-zowe-explorer-api";
import type { AbstractSession } from "@zowe/imperative";
import {
  closeLocalFile,
  openLocalFile,
  enableLocalFile,
  disableLocalFile,
  type ICMCIApiResponse,
  type ILocalFileParms,
  type LocalFileAction
} from "@zowe/cics-for-zowe-sdk";
import { type TreeView, commands, l10n, window } from "vscode";
import { LocalFileMeta } from "../doc";
import type { CICSTree } from "../trees/CICSTree";
import type { CICSResourceContainerNode } from "../trees/CICSResourceContainerNode";
import { findSelectedNodes } from "../utils/commandUtils";
import { actionTreeItem } from "./actionResourceCommand";

/**
 * Configuration for a local file action parameter
 */
interface IActionParameter {
  /** The parameter name (e.g., "busy") */
  name: string;
  
  /** The prompt message to show the user */
  prompt: string;
  
  /** Map of user-facing labels to API values */
  choices: Record<string, string>;
}

/**
 * Configuration for a local file action
 */
interface ILocalFileActionConfig {
  /** The command ID to register */
  commandId: string;
  
  /** The action type */
  action: LocalFileAction;
  
  /** Optional parameter configuration */
  parameter?: IActionParameter;
}

/**
 * Handler class for all local file commands in VSCode.
 * This class encapsulates all command registrations and action handling
 * for local file operations (CLOSE, OPEN, ENABLE, DISABLE, etc.).
 */
export class LocalFileCommandHandler {
  private tree: CICSTree;
  private treeview: TreeView<CICSResourceContainerNode<IResource>>;

  /**
   * Creates a new LocalFileCommandHandler
   * @param tree - The CICS tree to refresh after actions
   * @param treeview - The tree view containing selected nodes
   */
  constructor(tree: CICSTree, treeview: TreeView<CICSResourceContainerNode<IResource>>) {
    this.tree = tree;
    this.treeview = treeview;
  }

  /**
   * Gets the SDK function for a given action type
   * @param action - The action type
   * @returns The SDK function to call
   */
  private getSdkFunction(action: LocalFileAction): (session: AbstractSession, params: ILocalFileParms) => Promise<ICMCIApiResponse> {
    switch (action) {
      case "CLOSE":
        return closeLocalFile;
      case "OPEN":
        return openLocalFile;
      case "ENABLE":
        return enableLocalFile;
      case "DISABLE":
        return disableLocalFile;
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }

  /**
   * Creates a command handler for a specific local file action
   * @param config - Configuration for the action
   * @returns Disposable command registration
   */
  private createActionCommand(config: ILocalFileActionConfig) {
    return commands.registerCommand(config.commandId, async (clickedNode) => {
      const nodes = findSelectedNodes(this.treeview, LocalFileMeta, clickedNode);
      if (!nodes || !nodes.length) {
        window.showErrorMessage(l10n.t("No CICS local file selected"));
        return;
      }

      let parameterValue: { name: string; value: string } | undefined;

      // If the action requires a parameter, prompt the user
      if (config.parameter) {
        const selectedOption = await window.showInformationMessage(
          config.parameter.prompt,
          ...Object.keys(config.parameter.choices)
        );
        
        if (!selectedOption) {
          return;
        }

        parameterValue = {
          name: config.parameter.name,
          value: config.parameter.choices[selectedOption],
        };
      }

      await actionTreeItem({
        action: config.action,
        nodes,
        tree: this.tree,
        parameter: parameterValue,
        customAction: this.getSdkFunction(config.action),
        getResourceName: (node) => (node as CICSResourceContainerNode<ILocalFile>).getContainedResource().resource.attributes.file,
      });
    });
  }

  /**
   * Registers the CLOSE local file command
   * @returns Disposable command registration
   */
  public registerCloseCommand() {
    return this.createActionCommand({
      commandId: "cics-extension-for-zowe.closeLocalFile",
      action: "CLOSE",
      parameter: {
        name: "busy",
        prompt: l10n.t("Choose one of the following for the file busy condition"),
        choices: {
          [l10n.t("Wait")]: "WAIT",
          [l10n.t("No Wait")]: "NOWAIT",
          [l10n.t("Force")]: "FORCE",
        },
      },
    });
  }

  /**
   * Registers the OPEN local file command
   * @returns Disposable command registration
   */
  public registerOpenCommand() {
    return this.createActionCommand({
      commandId: "cics-extension-for-zowe.openLocalFile",
      action: "OPEN",
      // No parameter needed for open
    });
  }

  /**
   * Registers the ENABLE local file command (future implementation)
   * @returns Disposable command registration
   */
  public registerEnableCommand() {
    return this.createActionCommand({
      commandId: "cics-extension-for-zowe.enableLocalFile",
      action: "ENABLE",
      // TODO: Add parameter configuration based on CICS ENABLE requirements (e.g., status options)
    });
  }

  /**
   * Registers the DISABLE local file command (future implementation)
   * @returns Disposable command registration
   */
  public registerDisableCommand() {
    return this.createActionCommand({
      commandId: "cics-extension-for-zowe.disableLocalFile",
      action: "DISABLE",
      // TODO: Add parameter configuration based on CICS DISABLE requirements (e.g., force options)
    });
  }

  /**
   * Registers all local file commands at once
   * @returns Array of disposable command registrations
   */
  public registerAllCommands() {
    return [
      this.registerCloseCommand(),
      this.registerOpenCommand(),
      // Uncomment when ready to implement:
      // this.registerEnableCommand(),
      // this.registerDisableCommand(),
    ];
  }
}

/**
 * Registers the command to close CICS local files from the VS Code tree view
 * @param tree - The CICS tree to refresh after closing
 * @param treeview - The tree view containing selected nodes
 * @returns Disposable command registration
 */
export function getCloseLocalFileCommand(tree: CICSTree, treeview: TreeView<CICSResourceContainerNode<IResource>>) {
  const handler = new LocalFileCommandHandler(tree, treeview);
  return handler.registerCloseCommand();
}

/**
 * Registers the command to open CICS local files from the VS Code tree view
 * @param tree - The CICS tree to refresh after opening
 * @param treeview - The tree view containing selected nodes
 * @returns Disposable command registration
 */
export function getOpenLocalFileCommand(tree: CICSTree, treeview: TreeView<CICSResourceContainerNode<IResource>>) {
  const handler = new LocalFileCommandHandler(tree, treeview);
  return handler.registerOpenCommand();
}

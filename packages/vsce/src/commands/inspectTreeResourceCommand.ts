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
import { type ExtensionContext, type TreeView, commands, l10n, window } from "vscode";
import type { CICSResourceContainerNode } from "../trees";
import { ResourceInspectorViewProvider } from "../trees/ResourceInspectorViewProvider";
import { compareTreeNodeWithPrompts } from "./compareResourceCommand";
import { inspectResourceByNode, showInspectResource } from "./inspectResourceCommandUtils";

export function getInspectTreeResourceCommand(context: ExtensionContext, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.inspectTreeResource", async (node: CICSResourceContainerNode<IResource>) => {
    let targetNode: CICSResourceContainerNode<IResource> = node;

    if (!targetNode) {
      if (treeview.selection.length < 1) {
        await window.showErrorMessage(l10n.t("No CICS resource selected"));
        return;
      }

      // Gets last selected element
      targetNode = treeview.selection.pop();
      const targetNodeMeta = targetNode.getContainedResource().meta;
      const targetNodeResource = targetNode.getContainedResource().resource;

      if (!targetNodeMeta || !targetNodeResource) {
        await window.showErrorMessage(l10n.t("No CICS resource information available to inspect"));
        return;
      }

      // If there is more than 1 selected, inform we're ignoring the others
      if (treeview.selection.length > 1) {
        window.showInformationMessage(
          l10n.t("Multiple CICS resources selected. Resource '{0}' will be inspected.", targetNodeMeta.getName(targetNodeResource))
        );
      }
    }
    await inspectResourceByNode(context, targetNode);
  });
}

export function getCompareResourcesCommand(context: ExtensionContext, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.compareTreeResources", async (node: CICSResourceContainerNode<IResource>) => {
    const treeNodes: CICSResourceContainerNode<IResource>[] = [...new Set(treeview.selection)];

    if (treeNodes.length === 0 && !node) {
      const resourceInspector = ResourceInspectorViewProvider.getInstance(context);
      const currentResources = resourceInspector.getResources();

      if (!currentResources || currentResources.length === 0) {
        await window.showErrorMessage(l10n.t("No resource is currently open in the Resource Inspector"));
        return;
      }

      // Use the first resource from inspector as the base for comparison
      const currentResource = currentResources[0];

      // Convert inspector resource to tree node format for comparison
      const inspectorAsNode: CICSResourceContainerNode<IResource> = {
        getContainedResource: () => ({
          meta: currentResource.meta,
          resource: { attributes: currentResource.resource } as any,
        }),
        getProfile: () => currentResource.context.profile,
        getSession: () => currentResource.context.session,
        cicsplexName: currentResource.context.cicsplexName,
        regionName: currentResource.context.regionName,
      } as any;

      return compareTreeNodeWithPrompts(inspectorAsNode, context);
    }

    if (treeNodes.length === 1) {
      return compareTreeNodeWithPrompts(treeNodes[0], context);
    }

    if (treeNodes.length === 2) {
      if (treeNodes[0].getContainedResource().meta !== treeNodes[1].getContainedResource().meta) {
        return Gui.showMessage(l10n.t("Cannot compare CICS resources of different types."), { severity: MessageSeverity.ERROR });
      }

      return showInspectResource(
        context,
        treeNodes.map((n: CICSResourceContainerNode<IResource>) => {
          return {
            containedResource: n.getContainedResource(),
            ctx: {
              session: n.getSession(),
              profile: n.getProfile(),
              cicsplexName: n.cicsplexName,
              regionName: n.regionName ?? n.getContainedResource().resource.attributes.eyu_cicsname,
            },
          };
        })
      );
    }

    if (treeNodes.length > 2) {
      return;
    }

    if(node){
      return compareTreeNodeWithPrompts(node, context);
    }
  });
}

export function getCompareResourceToCommand() {
  return commands.registerCommand("cics-extension-for-zowe.compareTreeResourceTo", async (node: CICSResourceContainerNode<IResource>) => {
    // This command is just an alias for compareTreeResources with a different title
    // It's used for single-selection context menu and inspector actions
    return commands.executeCommand("cics-extension-for-zowe.compareTreeResources", node);
  });
}

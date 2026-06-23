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
import type { ICMCIApiResponse, ICMCIResponseResultSummary } from "@zowe/cics-for-zowe-sdk";
import { ProgressLocation, l10n, window } from "vscode";
import constants from "../constants/CICS.defaults";
import { CICSErrorHandler } from "../errors/CICSErrorHandler";
import { CICSExtensionError } from "../errors/CICSExtensionError";
import { SessionHandler } from "../resources";
import type { CICSResourceContainerNode } from "../trees";
import type { CICSTree } from "../trees/CICSTree";
import PersistentStorage from "../utils/PersistentStorage";
import { pollForCompleteAction } from "../utils/resourceUtils";
import { evaluateTreeNodes } from "../utils/treeUtils";
import { resourceActionVerbMap, setResource } from "./setResource";

interface IActionTreeItemArgs {
  action: keyof typeof resourceActionVerbMap;
  nodes: CICSResourceContainerNode<IResource>[];
  tree: CICSTree;
  getParentResource?: (node: CICSResourceContainerNode<IResource>) => IResource;
  pollCriteria?: (response: { resultsummary: ICMCIResponseResultSummary; records: any }) => boolean;
  parameter?: { name: string; value: string };
  /**
   * Custom SDK function to call instead of setResource.
   * Receives session and parameters object with: name, regionName, cicsPlex, and parameter value.
   */
  customAction?: (session: any, params: any) => Promise<ICMCIApiResponse>;
  /**
   * Function to extract the resource name from a node.
   * Used for progress messages and error handling when using customAction.
   */
  getResourceName?: (node: CICSResourceContainerNode<IResource>) => string;
}

export const actionTreeItem = async ({
  action,
  nodes,
  tree,
  getParentResource,
  pollCriteria,
  parameter,
  customAction,
  getResourceName,
}: IActionTreeItemArgs) => {
  await window.withProgress(
    {
      title: resourceActionVerbMap[action],
      location: ProgressLocation.Notification,
      cancellable: false,
    },
    async (progress, token) => {
      token.onCancellationRequested(() => {});

      const nodesToRefresh = new Set();
      const errors: Array<{ node: CICSResourceContainerNode<IResource>; error: any }> = [];
      let successCount = 0;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const resourceName = getResourceName ? getResourceName(node) : node.getContainedResourceName();
        progress.report({
          message:
            customAction ?
              l10n.t("{0} {1} ({2} of {3})", resourceActionVerbMap[action], resourceName, i + 1, nodes.length)
            : l10n.t("{0} of {1}", i + 1, nodes.length),
          increment: (1 / nodes.length) * constants.PERCENTAGE_MAX,
        });

        // Record this resource as recently interacted with (before action, so it records even on failure)
        await PersistentStorage.appendRecentResource({
          resourceName: node.getContainedResourceName(),
          resourceType: node.getContainedResource().meta.resourceName,
        });

        try {
          let response: ICMCIApiResponse;

          if (customAction) {
            // Use custom SDK function
            const profile = SessionHandler.getInstance().getProfile(node.getProfileName());
            const session = SessionHandler.getInstance().getSession(profile);

            response = await customAction(session, {
              name: resourceName,
              regionName: node.regionName ?? node.getContainedResource().resource.attributes.eyu_cicsname,
              cicsPlex: node.cicsplexName,
              ...(parameter && { [parameter.name]: parameter.value }),
            });
          } else {
            // Use standard setResource
            response = await setResource({
              ctx: {
                profileName: node.getProfileName(),
                regionName: node.regionName ?? node.getContainedResource().resource.attributes.eyu_cicsname,
                cicsplexName: node.cicsplexName,
              },
              meta: node.getContainedResource().meta,
              resourceName,
              parentResource: getParentResource ? getParentResource(node.getParent() as CICSResourceContainerNode<IResource>) : undefined,
              parameter,
              action,
            });
          }

          nodesToRefresh.add(node.getParent());

          if (pollCriteria) {
            await pollForCompleteAction(
              node,
              pollCriteria,
              (_response: ICMCIApiResponse) => evaluateTreeNodes(node, _response, node.getContainedResource().meta),
              getParentResource ? getParentResource(node.getParent() as CICSResourceContainerNode<IResource>) : undefined
            );
          } else {
            evaluateTreeNodes(node, response, node.getContainedResource().meta);
          }

          successCount++;
        } catch (error) {
          errors.push({ node, error });

          if (customAction) {
            const wrappedError = new CICSExtensionError({
              baseError: error,
              resourceName,
              profileName: node.getProfileName(),
            });
            CICSErrorHandler.handleCMCIRestError(wrappedError);

            progress.report({
              message: l10n.t("Failed to {0} {1} ({2} of {3})", action.toLowerCase(), resourceName, i + 1, nodes.length),
            });
          } else {
            CICSErrorHandler.handleCMCIRestError(error);
          }
        }
      }

      nodesToRefresh.forEach((v) => {
        tree.refresh(v);
      });

      // Show summary message for custom actions with multiple nodes
      if (customAction && nodes.length > 1) {
        if (errors.length > 0) {
          const errorMessage =
            errors.length === nodes.length ?
              l10n.t("Failed to {0} all {1} resource(s)", action.toLowerCase(), nodes.length)
            : l10n.t("{0} {1} of {2} resource(s). {3} failed.", resourceActionVerbMap[action], successCount, nodes.length, errors.length);
          window.showWarningMessage(errorMessage);
        } else {
          window.showInformationMessage(l10n.t("Successfully {0} {1} resource(s)", action.toLowerCase(), successCount));
        }
      }
    }
  );
};

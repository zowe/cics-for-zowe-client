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

import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { ICMCIApiResponse, ICMCIResponseResultSummary } from "@zowe/cics-for-zowe-sdk";
import { ProgressLocation, l10n, window } from "vscode";
import constants from "../constants/CICS.defaults";
import { CICSResourceContainerNode } from "../trees";
import { CICSTree } from "../trees/CICSTree";
import { pollForCompleteAction } from "../utils/resourceUtils";
import { evaluateTreeNodes } from "../utils/treeUtils";
import { setResource } from "./setResource";

export const resourceActionVerbMap = {
  DISABLE: l10n.t("Disabling"),
  ENABLE: l10n.t("Enabling"),
  CLOSE: l10n.t("Closing"),
  OPEN: l10n.t("Opening"),
  PHASEIN: l10n.t("Phase In"),
  NEWCOPY: l10n.t("New Copy"),
} as const;
interface IActionTreeItemArgs {
  action: keyof typeof resourceActionVerbMap;
  nodes: CICSResourceContainerNode<IResource>[];
  tree: CICSTree;
  getParentResource?: (node: CICSResourceContainerNode<IResource>) => IResource;
  pollCriteria?: (response: { resultsummary: ICMCIResponseResultSummary; records: any }) => boolean;
  parameter?: { name: string; value: string };
}

export const actionTreeItem = async ({ action, nodes, tree, getParentResource, pollCriteria, parameter }: IActionTreeItemArgs) => {
  await window.withProgress(
    {
      title: resourceActionVerbMap[action],
      location: ProgressLocation.Notification,
      cancellable: false,
    },
    async (progress, token) => {
      token.onCancellationRequested(() => {});

      const nodesToRefresh = new Set();

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        progress.report({
          message: l10n.t("{0} of {1}", i + 1, nodes.length),
          increment: (1 / nodes.length) * constants.PERCENTAGE_MAX,
        });

        try {
          const response = await setResource({
            cxt: {
              profileName: node.getProfileName(),
              regionName: node.regionName ?? node.getContainedResource().resource.attributes.eyu_cicsname,
              cicsplexName: node.cicsplexName,
            },
            meta: node.getContainedResource().meta,
            resourceName: node.getContainedResourceName(),
            parentResource: getParentResource ? getParentResource(node.getParent() as CICSResourceContainerNode<IResource>) : undefined,
            parameter,
            action,
          });

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
        } catch (error) {
          let details: string;
          try {
            if (error instanceof Error) {
              details = error.stack ? error.stack : error.message;
            } else {
              details = JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
            }
          } catch (e) {
            details = String(error);
          }
          window.showErrorMessage(l10n.t("Something went wrong when performing a {0} - {1}", action.toLowerCase(), details));
          console.error(`Error performing ${action}:`, error);
        }
      }

      nodesToRefresh.forEach((v) => {
        tree.refresh(v);
      });
    }
  );
};

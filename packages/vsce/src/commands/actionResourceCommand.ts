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
import { resourceActionVerbMap, setResource } from "./setResource";

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
      title: l10n.t("progress.title", resourceActionVerbMap[action] ?? action),
      location: ProgressLocation.Notification,
      cancellable: false,
    },
    async (progress, token) => {
      token.onCancellationRequested(() => {});

      const nodesToRefresh = new Set();

      for (const node of nodes) {
        progress.report({
          message: l10n.t(
            "Performing {0} on {1} (${2} of ${3})",
            resourceActionVerbMap[action],
            node.getContainedResourceName(),
            nodes.indexOf(node) + 1,
            nodes.length
          ),
          increment: (nodes.indexOf(node) / nodes.length) * constants.PERCENTAGE_MAX,
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
          const sanitizedError = JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(/(\\n\\t|\\n|\\t)/gm, " ");
          const verb = resourceActionVerbMap[action] ?? action;
          const errMsg = l10n.t("Something went wrong when performing a {0} - {1}", verb, sanitizedError);
          window.showErrorMessage(errMsg);
        }
      }

      nodesToRefresh.forEach((v) => {
        tree.refresh(v);
      });
    }
  );
};

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

import { CicsCmciConstants, ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { IProfileLoaded } from "@zowe/imperative";
import { ProgressLocation, TreeView, commands, l10n, window } from "vscode";
import constants from "../constants/CICS.defaults";
import { TaskMeta } from "../doc";
import { ICommandParams } from "../doc/commands/ICommandParams";
import { CICSTree } from "../trees/CICSTree";
import { findSelectedNodes, splitCmciErrorMessage } from "../utils/commandUtils";
import { runPutResource } from "../utils/resourceUtils";
import { evaluateTreeNodes } from "../utils/treeUtils";

/**
 * Purge a CICS Task and reload the CICS Task tree contents and the combined Task tree contents
 * @param tree
 * @param treeview
 * @returns
 */
export function getPurgeTaskCommand(tree: CICSTree, treeview: TreeView<any>) {
  return commands.registerCommand("cics-extension-for-zowe.purgeTask", async (clickedNode) => {
    const nodes = findSelectedNodes(treeview, TaskMeta, clickedNode);
    if (!nodes || !nodes.length) {
      window.showErrorMessage(l10n.t(`No CICS {0} selected`, TaskMeta.humanReadableNameSingular));
      return;
    }

    const PURGE_CHOICES = [
      { id: "PURGE", label: l10n.t("Purge") },
      { id: "FORCEPURGE", label: l10n.t("Force Purge") },
    ];

    const picked = await window.showInformationMessage(l10n.t("Choose one of the following options for Purge"), ...PURGE_CHOICES.map((c) => c.label));
    if (!picked) {
      return;
    }

    const purgeType = PURGE_CHOICES.find((c) => c.label === picked)?.id ?? "PURGE";

    window.withProgress(
      {
        title: l10n.t("Purge"),
        location: ProgressLocation.Notification,
        cancellable: true,
      },
      async (progress, token) => {
        token.onCancellationRequested(() => {});

        const nodesToRefresh = new Set();

        for (const node of nodes) {
          const idx = nodes.indexOf(node) + 1;
          progress.report({
            message: l10n.t("Purging {0} of {1}", idx, nodes.length),
            increment: (nodes.indexOf(node) / nodes.length) * constants.PERCENTAGE_MAX,
          });

          nodesToRefresh.add(node.getParent());

          const resName = node.getContainedResourceName();
          try {
            const response = await purgeTask(
              node.getProfile(),
              {
                name: resName,
                regionName: node.regionName ?? node.getContainedResource().resource.attributes.eyu_cicsname,
                cicsPlex: node.cicsplexName,
              },
              purgeType
            );

            evaluateTreeNodes(clickedNode, response, TaskMeta);
          } catch (error) {
            // @ts-ignore
            if (error.mMessage) {
              // @ts-ignore
              const [_resp, resp2, respAlt, eibfnAlt] = splitCmciErrorMessage(error.mMessage);
              window.showErrorMessage(
                l10n.t(
                  'Perform {0} on CICSTask "{1}" failed: EXEC CICS command ({2}) RESP({3}) RESP2({4})',
                  purgeType?.toUpperCase(),
                  resName,
                  eibfnAlt,
                  respAlt,
                  resp2
                )
              );
            } else {
              const sanitized = JSON.stringify(error, Object.getOwnPropertyNames(error)).replace(/(\\n\t|\\n|\\t)/gm, " ");
              window.showErrorMessage(l10n.t("Something went wrong when performing a {0} - {1}", purgeType?.toUpperCase(), sanitized));
            }
          }
        }

        nodesToRefresh.forEach((v) => {
          tree.refresh(v);
        });
      }
    );
  });
}

/**
 * CMCI Purge Task request
 * @param profile
 * @param parms
 * @param purgeType
 * @returns
 */
function purgeTask(profile: IProfileLoaded, parms: ICommandParams, purgeType: string): Promise<ICMCIApiResponse> {
  return runPutResource(
    {
      profileName: profile.name,
      resourceName: CicsCmciConstants.CICS_CMCI_TASK,
      cicsPlex: parms.cicsPlex,
      regionName: parms.regionName,
      params: { criteria: `TASK='${parms.name}'` },
    },
    {
      request: {
        action: {
          $: {
            name: "PURGE",
          },
          parameter: {
            $: {
              name: "TYPE",
              value: purgeType,
            },
          },
        },
      },
    }
  );
}

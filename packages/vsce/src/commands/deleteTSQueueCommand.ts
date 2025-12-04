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

import { IResource, ISharedTSQueue, ITSQueue } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants, CicsCmciRestClient, IGetResourceUriOptions, Utils } from "@zowe/cics-for-zowe-sdk";
import { TreeView, commands, l10n, window } from "vscode";
import { SharedTSQueueMeta, TSQueueMeta } from "../doc";
import { CICSErrorHandler } from "../errors/CICSErrorHandler";
import { CICSExtensionError } from "../errors/CICSExtensionError";
import { SessionHandler } from "../resources/SessionHandler";
import { CICSResourceContainerNode, CICSTree } from "../trees";
import { buildConfirmationDescription, getConfirmationForAction } from "../utils/commandUtils";
import { buildUserAgentHeader } from "../utils/resourceUtils";

export const getDeleteTSQueueCommand = (tree: CICSTree, treeview: TreeView<CICSResourceContainerNode<IResource>>) => {
  return commands.registerCommand("cics-extension-for-zowe.deleteTSQueue", (treeNode: CICSResourceContainerNode<ITSQueue | ISharedTSQueue>) =>
    deleteTSQueueCommand(tree, treeview, treeNode)
  );
};

export const deleteTSQueueCommand = async (
  tree: CICSTree,
  treeview: TreeView<CICSResourceContainerNode<IResource>>,
  treeNode: CICSResourceContainerNode<ITSQueue | ISharedTSQueue>
) => {
  const nodes = [...new Set([...(treeview.selection as CICSResourceContainerNode<ITSQueue | ISharedTSQueue>[]), treeNode])].filter(
    (nde) => nde && [TSQueueMeta, SharedTSQueueMeta].includes(nde.getContainedResource()?.meta)
  );

  if (nodes.length === 0) {
    await window.showErrorMessage(
      l10n.t(`No CICS {0} or {1} selected`, TSQueueMeta.humanReadableNameSingular, SharedTSQueueMeta.humanReadableNameSingular)
    );
    return;
  }

  const clarify = await getConfirmationForAction(l10n.t("Delete"), TSQueueMeta.humanReadableNamePlural, buildConfirmationDescription(nodes));
  if (!clarify) {
    return;
  }

  const nodesToRefresh = new Set();

  for (const c of nodes) {
    const options: IGetResourceUriOptions = {
      cicsPlex: c.cicsplexName,
      regionName: c.regionName,
      criteria: `HEXNAME=${c.getContainedResource().resource.attributes.hexname}`,
    };

    const cmciResource = Utils.getResourceUri(c.getContainedResource().meta.resourceName, options);

    try {
      nodesToRefresh.add(c.getParent());
      const { response } = await CicsCmciRestClient.deleteExpectParsedXml(SessionHandler.getInstance().getSession(c.getProfile()), cmciResource, [
        buildUserAgentHeader(),
      ]);
      if (response.resultsummary.api_response1 === `${CicsCmciConstants.RESPONSE_1_CODES.OK}`) {
        (c.getParent() as CICSResourceContainerNode<IResource>).removeStoredItem(c.getContainedResource());
      }
    } catch (error) {
      CICSErrorHandler.handleCMCIRestError(
        new CICSExtensionError({ baseError: error, resourceName: c.getContainedResourceName(), errorMessage: `${error}` })
      );
    }
  }

  nodesToRefresh.forEach((v) => {
    tree.refresh(v);
  });
};

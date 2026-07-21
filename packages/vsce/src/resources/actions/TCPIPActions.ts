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

import { ResourceAction, ResourceTypes, type ResourceActionOptions } from "@zowe/cics-for-zowe-explorer-api";
import { l10n } from "vscode";

const actions: ResourceActionOptions<ResourceTypes.CICSTCPIPService>[] = [
  {
    id: "CICS.CICSTCPIPService.COPY_NAME",
    name: l10n.t("Copy Name"),
    resourceType: ResourceTypes.CICSTCPIPService,
    action: "cics-extension-for-zowe.copyResourceName",
    refreshResourceInspector: false,
  },
  {
    id: "CICS.CICSTCPIPService.COMPARE_TO",
    name: l10n.t("Compare to..."),
    resourceType: ResourceTypes.CICSTCPIPService,
    action: "cics-extension-for-zowe.compareTreeResourceTo",
    refreshResourceInspector: false,
  },
];

export function getTCPIPActions(): ResourceAction<ResourceTypes.CICSTCPIPService>[] {
  return actions.map((action) => new ResourceAction<ResourceTypes.CICSTCPIPService>(action));
}

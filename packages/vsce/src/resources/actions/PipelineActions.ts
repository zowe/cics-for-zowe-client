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

const actions: ResourceActionOptions<ResourceTypes.CICSPipeline>[] = [
  {
    id: "CICS.CICSPipeline.COPY_NAME",
    name: l10n.t("Copy Name"),
    resourceType: ResourceTypes.CICSPipeline,
    action: "cics-extension-for-zowe.copyResourceName",
    refreshResourceInspector: false,
  },
  {
    id: "CICS.CICSPipeline.COMPARE_TO",
    name: l10n.t("Compare to..."),
    resourceType: ResourceTypes.CICSPipeline,
    action: "cics-extension-for-zowe.compareTreeResourceTo",
    refreshResourceInspector: false,
  },
];

export function getPipelineActions(): ResourceAction<ResourceTypes.CICSPipeline>[] {
  return actions.map((action) => new ResourceAction<ResourceTypes.CICSPipeline>(action));
}

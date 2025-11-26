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

import { IProgram, IResourceContext, ResourceAction, ResourceActionOptions, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { l10n } from "vscode";

const actions: ResourceActionOptions<ResourceTypes.CICSProgram>[] = [
  {
    id: "CICS.CICSProgram.NEWCOPY",
    name: l10n.t("New Copy"),
    resourceType: ResourceTypes.CICSProgram,
    action: "cics-extension-for-zowe.newCopyProgram",
  },
  {
    id: "CICS.CICSProgram.PHASEIN",
    name: l10n.t("Phase In"),
    resourceType: ResourceTypes.CICSProgram,
    action: "cics-extension-for-zowe.phaseInCommand",
  },
  {
    id: "CICS.CICSProgram.DISABLE",
    name: l10n.t("Disable Program"),
    resourceType: ResourceTypes.CICSProgram,
    visibleWhen: (program: IProgram, _cx: IResourceContext) => program.status !== "DISABLED",
    action: "cics-extension-for-zowe.disableProgram",
  },
  {
    id: l10n.t("CICS.CICSProgram.ENABLE"),
    name: "Enable Program",
    resourceType: ResourceTypes.CICSProgram,
    visibleWhen: (program: IProgram, _cx: IResourceContext) => program.status !== "ENABLED",
    action: "cics-extension-for-zowe.enableProgram",
  },
  {
    id: l10n.t("CICS.CICSProgram.SHOWLIBRARY"),
    name: "Show Library",
    resourceType: ResourceTypes.CICSProgram,
    action: "cics-extension-for-zowe.showLibrary",
  },
];

export function getProgramActions(): ResourceAction<ResourceTypes.CICSProgram>[] {
  return actions.map((action) => new ResourceAction<ResourceTypes.CICSProgram>(action));
}

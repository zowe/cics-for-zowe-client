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

import * as disableCommands from "./disableCommands";
import * as enableCommands from "./enableCommands";
import { getToggleResourceSettingCommand } from "./toggleResourceSettingCommand";

import { ExtensionContext, TreeView } from "vscode";
import { CICSTree } from "../trees/CICSTree";
import { getAddSessionCommand } from "./addSessionCommand";
import { getClearPlexFilterCommand } from "./clearPlexFilterCommand";
import { getCloseLocalFileCommand } from "./closeLocalFileCommand";
import * as filterResourceCommands from "./filterResourceCommands";
import { getFilterPlexResources } from "./getFilterPlexResources";
import { getInquireProgramCommand } from "./inquireProgram";
import { getInquireTransactionCommand } from "./inquireTransaction";
import { getManageSessionCommand } from "./manageSessionCommand";
import { getNewCopyCommand } from "./newCopyCommand";
import { getOpenLocalFileCommand } from "./openLocalFileCommand";
import { getPhaseInCommand } from "./phaseInCommand";
import { getPurgeTaskCommand } from "./purgeTaskCommand";
import { getRefreshCommand } from "./refreshCommand";
import { getResourceInspectorCommand } from "./resourceInspectorViewCommand";
import * as showAttributesCommands from "./showAttributesCommand";
import { showLibraryCommand } from "./showLibraryCommand";
import * as showLogsCommands from "./showLogsCommand";
import { getShowRegionSITParametersCommand } from "./showParameterCommand";
import { viewMoreCommand } from "./viewMoreCommand";
import { setFocusRegionCommand } from "./setFocusRegionCommand";

export const getCommands = (treeDataProv: CICSTree, treeview: TreeView<any>, context: ExtensionContext) => {
  return [
    getAddSessionCommand(treeDataProv),
    getManageSessionCommand(treeDataProv, treeview),

    getRefreshCommand(treeDataProv),

    getNewCopyCommand(treeDataProv, treeview),
    getPhaseInCommand(treeDataProv, treeview),

    enableCommands.getEnableProgramCommand(treeDataProv, treeview),
    enableCommands.getEnableTransactionCommand(treeDataProv, treeview),
    enableCommands.getEnableLocalFileCommand(treeDataProv, treeview),
    disableCommands.getDisableProgramCommand(treeDataProv, treeview),
    disableCommands.getDisableTransactionCommand(treeDataProv, treeview),
    disableCommands.getDisableLocalFileCommand(treeDataProv, treeview),

    getCloseLocalFileCommand(treeDataProv, treeview),
    getOpenLocalFileCommand(treeDataProv, treeview),

    getPurgeTaskCommand(treeDataProv, treeview),

    showLogsCommands.getShowRegionLogs(treeview),
    showAttributesCommands.getShowResourceAttributesCommand(treeview),
    showAttributesCommands.getShowRegionAttributes(),

    getShowRegionSITParametersCommand(),

    filterResourceCommands.getFilterResourcesCommand(treeDataProv, treeview),
    filterResourceCommands.getClearFilterCommand(treeDataProv),

    getFilterPlexResources(treeDataProv, treeview),
    getClearPlexFilterCommand(treeDataProv),

    viewMoreCommand(treeDataProv, treeview),

    getInquireTransactionCommand(treeDataProv, treeview),
    getInquireProgramCommand(treeDataProv, treeview),

    getResourceInspectorCommand(context, treeview),
    getToggleResourceSettingCommand(),
    setFocusRegionCommand(),
    showLibraryCommand(treeDataProv, treeview),
  ];
};

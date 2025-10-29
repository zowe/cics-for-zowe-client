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
import { getInspectTreeResourceCommand } from "./inspectTreeResourceCommand";
import * as showAttributesCommands from "./showAttributesCommand";
import { showLibraryCommand } from "./showLibraryCommand";
import * as showLogsCommands from "./showLogsCommand";
import { getShowRegionSITParametersCommand } from "./showParameterCommand";
import { setCICSRegionCommand } from "./setCICSRegionCommand";
import { getInspectResourceCommand } from "./inspectResourceCommand";
import { getCopyNameCommand, getCopyUserAgentHeaderCommand } from "./copyCommand";
import { getDisableResourceCommands } from "./disableResourceCommand";
import { getEnableResourceCommands } from "./enableResourceCommand";
import { showBundleDirectory } from "./showBundleDirectoryCommand";

export const getCommands = (treeDataProv: CICSTree, treeview: TreeView<any>, context: ExtensionContext) => {
  return [
    getAddSessionCommand(treeDataProv),
    getManageSessionCommand(treeDataProv),

    getRefreshCommand(treeDataProv),

    getNewCopyCommand(treeDataProv, treeview),
    getPhaseInCommand(treeDataProv, treeview),

    ...getDisableResourceCommands(treeDataProv, treeview),
    ...getEnableResourceCommands(treeDataProv, treeview),

    getCloseLocalFileCommand(treeDataProv, treeview),
    getOpenLocalFileCommand(treeDataProv, treeview),

    getPurgeTaskCommand(treeDataProv, treeview),

    getInspectResourceCommand(context),

    showLogsCommands.getShowRegionLogs(treeview),
    showAttributesCommands.getShowResourceAttributesCommand(treeview),
    showAttributesCommands.getShowRegionAttributes(),

    getShowRegionSITParametersCommand(),

    filterResourceCommands.getFilterResourcesCommand(treeDataProv, treeview),
    filterResourceCommands.getClearFilterCommand(treeDataProv),

    getFilterPlexResources(treeDataProv, treeview),
    getClearPlexFilterCommand(treeDataProv),

    getInquireTransactionCommand(treeDataProv, treeview),
    getInquireProgramCommand(treeDataProv, treeview),

    getInspectTreeResourceCommand(context, treeview),
    getToggleResourceSettingCommand(),
    setCICSRegionCommand(),
    showLibraryCommand(treeDataProv, treeview),

    getCopyNameCommand(),
    getCopyUserAgentHeaderCommand(),
    showBundleDirectory(treeview),
  ];
};

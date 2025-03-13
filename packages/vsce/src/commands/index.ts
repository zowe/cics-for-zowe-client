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

import { TreeView } from "vscode";
import { CICSTree } from "../trees/CICSTree";
import { getAddSessionCommand } from "./addSessionCommand";
import { getClearPlexFilterCommand } from "./clearPlexFilterCommand";
import { getClearResourceFilterCommand } from "./clearResourceFilterCommand";
import { getCloseLocalFileCommand } from "./closeLocalFileCommand";
import * as filterAllResourceCommands from "./filterAllResourceCommand";
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
import * as showAttributesCommands from "./showAttributesCommand";
import * as showLogsCommands from "./showLogsCommand";
import { getShowRegionSITParametersCommand } from "./showParameterCommand";
import { viewMoreCommand } from "./viewMoreCommand";

export const getCommands = (treeDataProv: CICSTree, treeview: TreeView<any>) => {
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

    showAttributesCommands.getShowRegionAttributes(treeview),
    showLogsCommands.getShowRegionLogs(treeview),
    showAttributesCommands.getShowProgramAttributesCommand(treeview),
    showAttributesCommands.getShowLibraryAttributesCommand(treeview),
    showAttributesCommands.getShowLibraryDatasetsAttributesCommand(treeview),
    showAttributesCommands.getShowTCPIPServiceAttributesCommand(treeview),
    showAttributesCommands.getShowURIMapAttributesCommand(treeview),
    showAttributesCommands.getShowTransactionAttributesCommand(treeview),
    showAttributesCommands.getShowLocalFileAttributesCommand(treeview),
    showAttributesCommands.getShowTaskAttributesCommand(treeview),
    showAttributesCommands.getShowPipelineAttributesCommand(treeview),
    showAttributesCommands.getShowWebServiceAttributesCommand(treeview),

    getShowRegionSITParametersCommand(treeview),

    filterResourceCommands.getFilterProgramsCommand(treeDataProv, treeview),
    filterResourceCommands.getFilterDatasetProgramsCommand(treeDataProv, treeview),
    filterResourceCommands.getFilterLibrariesCommand(treeDataProv, treeview),
    filterResourceCommands.getFilterDatasetsCommand(treeDataProv, treeview),
    filterResourceCommands.getFilterTransactionCommand(treeDataProv, treeview),
    filterResourceCommands.getFilterLocalFilesCommand(treeDataProv, treeview),
    filterResourceCommands.getFilterTasksCommand(treeDataProv, treeview),
    filterResourceCommands.getFilterTCPIPSCommand(treeDataProv, treeview),
    filterResourceCommands.getFilterURIMapsCommand(treeDataProv, treeview),
    filterResourceCommands.getFilterPipelinesCommand(treeDataProv, treeview),
    filterResourceCommands.getFilterWebServicesCommand(treeDataProv, treeview),

    filterAllResourceCommands.getFilterAllProgramsCommand(treeDataProv, treeview),
    filterAllResourceCommands.getFilterAllLibrariesCommand(treeDataProv, treeview),
    filterAllResourceCommands.getFilterAllWebServicesCommand(treeDataProv, treeview),
    filterAllResourceCommands.getFilterAllPipelinesCommand(treeDataProv, treeview),
    filterAllResourceCommands.getFilterAllTransactionsCommand(treeDataProv, treeview),
    filterAllResourceCommands.getFilterAllLocalFilesCommand(treeDataProv, treeview),
    filterAllResourceCommands.getFilterAllTasksCommand(treeDataProv, treeview),
    filterAllResourceCommands.getFilterAllTCPIPServicesCommand(treeDataProv, treeview),
    filterAllResourceCommands.getFilterAllURIMapsCommand(treeDataProv, treeview),

    getFilterPlexResources(treeDataProv, treeview),

    getClearResourceFilterCommand(treeDataProv, treeview),
    getClearPlexFilterCommand(treeDataProv, treeview),

    viewMoreCommand(treeDataProv, treeview),

    getInquireTransactionCommand(treeDataProv, treeview),
    getInquireProgramCommand(treeDataProv, treeview),
  ];
};

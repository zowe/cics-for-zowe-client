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

import { getCICSForZoweExplorerAPI, ResourceTypes } from '@zowe/cics-for-zowe-explorer-api';
import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {

  const cicsAPI = await getCICSForZoweExplorerAPI();
  if (cicsAPI) {
    cicsAPI.resources.resourceExtender.registerAction({
      id: "TEST.ACTION.1",
      name: "MY TEST ACTION",
      resourceType: ResourceTypes.CICSProgram,
      action: "workbench.action.openWalkthrough",
    });
    vscode.window.showInformationMessage("Registered TEST.ACTION.1");
  }

}

export async function deactivate() {

}


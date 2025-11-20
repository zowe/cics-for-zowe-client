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

import { getCICSForZoweExplorerAPI, ResourceAction, ResourceTypes } from '@zowe/cics-for-zowe-explorer-api';
import { commands, ExtensionContext, window } from 'vscode';

export async function activate(_context: ExtensionContext) {

  window.showInformationMessage("TEST EXTENSION ACTIVATED");
  const cicsAPI = await getCICSForZoweExplorerAPI();

  if (cicsAPI) {

    const action = new ResourceAction({
      id: "TEST.ACTION.1",
      name: "MY TEST ACTION",
      resourceType: ResourceTypes.CICSProgram,
      action: (res, ctx) => {
        commands.executeCommand("workbench.action.openWalkthrough");
      },
    });

    cicsAPI.resources.resourceExtender.registerAction(action);
    window.showInformationMessage("Registered TEST.ACTION.1");

  } else {
    window.showErrorMessage("No CICS API Found");
  }

}

export async function deactivate() { }

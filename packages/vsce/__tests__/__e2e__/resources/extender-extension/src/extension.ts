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

import { getCICSForZoweExplorerAPI, ResourceAction, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { commands, Disposable, ExtensionContext, window } from "vscode";

let disposeAction: Disposable | undefined;

export async function activate(context: ExtensionContext) {
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

    disposeAction = cicsAPI.resources.resourceExtender.registerAction(action);
    window.showInformationMessage("Registered TEST.ACTION.1");

    // Register the "Remove Action" command
    const removeActionCommand = commands.registerCommand("extender-extension.removeAction", () => {
      if (disposeAction) {
        disposeAction.dispose();
        window.showInformationMessage("Removed TEST.ACTION.1");
      } else {
        window.showWarningMessage("No action to remove");
      }
    });

    context.subscriptions.push(removeActionCommand);
  } else {
    window.showErrorMessage("No CICS API Found");
  }
}

export async function deactivate() {}

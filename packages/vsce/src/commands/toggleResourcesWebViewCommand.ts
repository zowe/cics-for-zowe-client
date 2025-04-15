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

import { commands, ExtensionContext } from "vscode";
import { ToggleResourcesWebView } from "../trees/ToggleResourcesWebView";

export function toggleResourcesWebViewCommand(context: ExtensionContext) {
  // let toggleResourcesWebView: ToggleResourcesWebView = undefined;
  return commands.registerCommand("cics-extension-for-zowe.toggleResourcesWebView", async () => {
    // if (toggleResourcesWebView == undefined) {
    //   toggleResourcesWebView = new ToggleResourcesWebView(context);
    //   return toggleResourcesWebView;
    // }
    // if (toggleResourcesWebView.panel.active) {
    //   return toggleResourcesWebView;
    // }
    return new ToggleResourcesWebView(context);
  });
}

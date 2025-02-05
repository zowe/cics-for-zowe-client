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

import { ViewContent, ViewControl, ViewSection } from "wdio-vscode-service";
import { browser } from "@wdio/globals";

/* Helper functions */

export async function getCICSContainer(): Promise<ViewControl> {
  const activityBar = (await browser.getWorkbench()).getActivityBar();
  const cicsContainer = await activityBar.getViewControl("Zowe Explorer");
  await expect(cicsContainer).toBeDefined();

  return cicsContainer;
}

export async function paneDivForTree(): Promise<ViewSection> {
  const cicsContainer = await getCICSContainer();
  // specifying type here as eslint fails to deduce return type
  const sidebarContent: ViewContent = (await cicsContainer.openView()).getContent();
  const cicsSection = await sidebarContent.getSection("CICS");
  return cicsSection;
}

export function installZowe(): void {
  browser.executeWorkbench((vscode) => {
    vscode.commands.executeCommand("workbench.extensions.installExtension", "Zowe.vscode-extension-for-zowe");
  });
}

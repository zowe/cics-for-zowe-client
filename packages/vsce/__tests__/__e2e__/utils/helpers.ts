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

import { APIRequestContext, Locator, Page, expect } from "@playwright/test";

export const constants = {
  ZOWE_CONFIG_FILE_NAME: "zowe.config.json",

  PROFILE_NAME: "wiremock_localhost",
  ZOSMF_PROFILE_NAME: "zosmf-wiremock",
  CICSPLEX_NAME: "MYPLEX1",
  REGION_NAME: "MYREG1",
  PROGRAM_1_NAME: "MYPROG1",
  PROGRAM_2_NAME: "MYPROG2",
  LIBRARY_1_NAME: "MYLIB1",
  LIBRARY_DS_1_NAME: "MYLIBDS1",
  JVM_SERVER_1_NAME: "MYJVM1",
  JVM_ENDPOINT_1_NAME: "MYJVMENDPOINT1 (9080)",
  BUNDLE_1_NAME: "MYBUNDLE1 (DISABLED)",
  BUNDLE_1_USS_PATH: "/u/expauto/bundles/test_plugin_1.0.1",
  LOCAL_FILE_1_NAME: "LOCFILE1",
  REMOTE_FILE_1_NAME: "REMFILE1",
  JVM_SERVER_NAME: "MYJVM1",
};

export const getTree = (page: Page, exactText: string) => {
  return page.getByRole("button", { name: exactText, exact: true });
};

export const getTreeItem = (page: Page, text: string, exact: boolean = true) => {
  return page.getByRole("treeitem", { name: text, exact });
};

export const isTreeItemExpanded = async (treeItem: Locator) => {
  return (await treeItem.getAttribute("aria-expanded")) === "true";
};

export const resetWiremock = async (request: APIRequestContext) => {
  const response = await request.post(`http://localhost:8080/__admin/scenarios/reset`, {});
  expect(response.ok()).toBeTruthy();
};

const getZoweExplorerTrees = async (page: Page) => {
  const dsTree = getTree(page, "Data Sets Section");
  const ussTree = getTree(page, "Unix System Services (USS) Section");
  const jobTree = getTree(page, "Jobs Section");

  return [dsTree, ussTree, jobTree];
};

export const prepareZoweExplorerView = async (page: Page) => {
  await page.goto("http://localhost:1234");

  await page.getByRole("tab", { name: "Zowe Explorer" }).locator("a").click();

  // If each of the trees are expanded, collapse them
  for (const tree of await getZoweExplorerTrees(page)) {
    if (await isTreeItemExpanded(tree)) {
      await tree.click();
    }
  }
};

export const resetZoweExplorerView = async (page: Page) => {
  // If the profile tree item is expanded, collapse it
  const profileTreeItem = getTreeItem(page, constants.PROFILE_NAME);
  if ((await profileTreeItem.isVisible()) && (await isTreeItemExpanded(profileTreeItem))) {
    await profileTreeItem.click();
  }

  // If each of the trees are collapsed, expand them
  for (const tree of await getZoweExplorerTrees(page)) {
    if (!(await isTreeItemExpanded(tree))) {
      await tree.click();
    }
  }
};

export const getResourceInspector = (page: Page) => {
  return page.frameLocator('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]').frameLocator("#active-frame");
};

export const findAndClickTreeItem = async (page: Page, label: string, button: "left" | "right" | "middle" = "left") => {
  await expect(getTreeItem(page, label)).toBeVisible();
  await expect(getTreeItem(page, label)).toHaveText(label);
  await getTreeItem(page, label).click({ button });
};

export const waitForNotification = async (page: Page, string: string) => {
  await expect(page.getByText(string, { exact: true })).toBeVisible({ timeout: 1000 });
  await expect(page.getByText(string, { exact: true })).not.toBeVisible({ timeout: 5000 });
};

export const findAndClickText = async (page: Page, label: string, button: "left" | "right" | "middle" = "left") => {
  await expect(page.getByText(label)).toBeVisible();
  await page.getByText(label).click({ button });
};

export const runInCommandPalette = async (page: Page, command: string) => {
  await page.keyboard.down("Control");
  await page.keyboard.down("Shift");
  await page.keyboard.press("p");
  await page.keyboard.up("Shift");
  await page.keyboard.up("Control");

  await expect(page.getByRole("textbox", { name: "Type the name of a command to run.", exact: true })).toHaveValue(">");
  await page.getByRole("textbox", { name: "Type the name of a command to run.", exact: true }).fill(`>${command}`);
  await page.keyboard.press("Enter");
};

export const getClipboardContent = async (page: Page) => {
  return await page.evaluate("navigator.clipboard.readText()");
};

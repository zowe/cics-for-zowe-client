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
  CICSPLEX_NAME_2: "MYPLEX2",
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
  REGION_ERROR: "ERRORS",
  ENABLE_BUNDLE: "Enable Bundle",
  TEST_LOGIN: "test-login",
  LIBRARY_NAME: "DFHRPL",
  DISABLE_LIBRARY: "Disable Library",
  DISABLE_PROGRAM: "Disable Program",
  JVM_SERVER_DISABLE_ERROR_MESSAGE: `The CMCI REST API request failed. 
  Failed to DISABLE JVMSERVER MYJVM1 with API: PERFORM SET, RESP: 16 (INVREQ) and RESP2: 10. 
  Please refer to the IBM documentation for resp code details`,
  BUNDLE_ENABLE_ERROR_MESSAGE: `The CMCI REST API request failed. 
  Failed to ENABLE  BUNDLE MYBUNDLE1 with API: PERFORM SET, RESP: 16 (INVREQ) and RESP2: 6. 
  Please refer to the IBM documentation for resp code details`,
  TRANSACTION_INVALID_FILTER_ERROR_MESSAGE: `The CMCI REST API request failed. 
  Failed to send request. Response details - Status code: 404, 
  URL: /CICSSystemManagement/CICSLocalTransaction/MYPLEX1/ERRORS?CRITERIA=(TRANID%3DFILTER)&SUMMONLY&NODISCARD&OVERRIDEWARNINGCOUNT, 
  Message: Rest API failure with HTTP(S) status 404`,
  LIBRARY_DISABLE_ERROR_MESSAGE: `The CMCI REST API request failed. 
  Failed to DISABLE LIBRARY DFHRPL with API: PERFORM SET, RESP: 16 (INVREQ) and RESP2: 6. 
  Please refer to the IBM documentation for resp code details`,
  NO_CONNECTION_ERROR_MESSAGE: `The CMCI REST API request failed. 
  Failed to send request. Response details - URL: /CICSSystemManagement/CICSCICSPlex/?SUMMONLY&NODISCARD, Message: Failed to send an HTTP request.`,
  PROGRAM_DISABLE_ERROR_MESSAGE: `The CMCI REST API request failed. Failed to DISABLE PROGRAM MYPROG1 with API: PERFORM SET, RESP: 16 (INVREQ) and RESP2: 1. 
  Please refer to the IBM documentation for resp code details`,
  PROGRAM2_DISABLE_ERROR_MESSAGE: `The CMCI REST API request failed. Failed to DISABLE PROGRAM MYPROG2 with API: PERFORM SET, RESP: 16 (INVREQ) and RESP2: 1. 
  Please refer to the IBM documentation for resp code details`,
  PROGRAM_NOT_FOUND_ERROR_MESSAGE: `The CMCI REST API request failed for resources: PROG3, PROG4. 
  Response details: API_FUNCTION: GET, RESP: 1041 (INVALIDATA), RESP2: 1299 (CRITERIA). Please refer to the IBM documentation for resp code details`,
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
  const itm = getTreeItem(page, label);
  await expect(itm).toBeVisible();
  await expect(itm).toHaveText(label);
  await page.keyboard.press("Escape");
  await clickTreeNode(page, label, button);
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

export const collectTreeItemsOrder = async (
  page: Page,
  expectedOrder: string[],
  options?: { includeAll?: boolean; waitForLabel?: string; selector?: string }
): Promise<Array<{ label: string; index: number }>> => {
  const { includeAll = false, waitForLabel, selector = '[role="treeitem"]' } = options ?? {};

  if (waitForLabel) {
    await expect(getTreeItem(page, waitForLabel, false).first()).toBeVisible();
  }

  const allTreeItems = await page.locator(selector).all();
  const itemsWithIndices: Array<{ label: string; index: number }> = [];

  for (const treeItem of allTreeItems) {
    const ariaLabel = await treeItem.getAttribute("aria-label");
    const dataIndex = await treeItem.getAttribute("data-index");
    if (!ariaLabel || !dataIndex) continue;

    const trimmedLabel = ariaLabel.trim();

    for (const expectedLabel of expectedOrder) {
      const matchesExpected = trimmedLabel.startsWith(expectedLabel);
      const hasAllPrefix = trimmedLabel.startsWith("All ");
      if (matchesExpected && (includeAll ? hasAllPrefix : !hasAllPrefix)) {
        if (!itemsWithIndices.some((item) => item.label === expectedLabel)) {
          itemsWithIndices.push({ label: expectedLabel, index: Number.parseInt(dataIndex, 10) });
        }
        break;
      }
    }
  }

  itemsWithIndices.sort((a, b) => a.index - b.index);
  return itemsWithIndices;
};

export const assertTreeItemsOrder = async (
  page: Page,
  expectedOrder: string[],
  options?: { includeAll?: boolean; waitForLabel?: string; selector?: string }
): Promise<void> => {
  const items = await collectTreeItemsOrder(page, expectedOrder, options);
  const actualOrder = items.map((it) => it.label);
  expect(actualOrder).toEqual(expectedOrder);
};

export const expectedRegionOrder = [
  "Bundles",
  "Files",
  "JVM Servers",
  "Libraries",
  "Pipelines",
  "Programs",
  "Tasks",
  "TCP/IP Services",
  "Transactions",
  "TS Queues",
  "URI Maps",
  "Web Services",
];

export const expectedPlexOrder = [
  "All Bundles",
  "All Files",
  "All JVM Servers",
  "All Libraries",
  "All Pipelines",
  "All Programs",
  "All Tasks",
  "All TCP/IP Services",
  "All Transactions",
  "All TS Queues",
  "All URI Maps",
  "All Web Services",
];

export const clickTreeNode = async (page: Page, text: string, button: "left" | "right" | "middle" = "left") => {
  page.locator('.monaco-highlighted-label', { hasText: text }).first().click({ button, force: true });
};

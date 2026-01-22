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

import { expect, test } from "@playwright/test";
import { assertTreeItemsOrder, constants, expectedPlexOrder, expectedRegionOrder, findAndClickTreeItem, getClipboardContent, prepareZoweExplorerView, resetWiremock, resetZoweExplorerView, runInCommandPalette } from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test("should copy user agent header", async ({ page }) => {
  await runInCommandPalette(page, "Copy User Agent header");
  await expect(page.getByText("Copied User-Agent header to clipboard", { exact: true })).toBeVisible();

  const clipboardHeader = await getClipboardContent(page);
  expect(clipboardHeader).toContain("zowe.cics-extension-for-zowe/3.");
  expect(clipboardHeader).toContain("zowe.vscode-extension-for-zowe/3.");
});

test("should show notification if no regions found", async ({ page }) => {
  await runInCommandPalette(page, "Zowe Explorer for IBM CICS TS: Inspect CICS Resource");
  await page.getByRole("option", { name: "Other CICS Region" }).click();
  await page.getByRole("option", { name: "wiremock_localhost" }).click();
  await page.getByRole("option", { name: constants.CICSPLEX_NAME_2 }).click();
  await page.getByRole("alert").getByText("No Active Regions found in MYPLEX2").waitFor();
});

test("should verify trees are organised in correct order", async ({ page }) => {
  await findAndClickTreeItem(page, constants.PROFILE_NAME);
  await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
  await assertTreeItemsOrder(page, expectedPlexOrder, { waitForLabel: expectedPlexOrder[0], includeAll: true });
  await findAndClickTreeItem(page, constants.REGION_NAME);
  await assertTreeItemsOrder(page, expectedRegionOrder, { waitForLabel: expectedRegionOrder[0], includeAll: false });
});


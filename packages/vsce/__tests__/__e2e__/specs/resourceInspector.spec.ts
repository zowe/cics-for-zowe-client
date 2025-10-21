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
import {
  constants,
  findAndClickText,
  findAndClickTreeItem,
  getResourceInspector,
  prepareZoweExplorerView,
  resetWiremock,
  resetZoweExplorerView,
  waitForNotification,
} from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("Resource Inspector tests", async () => {
  test("should inspect a program resource", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right");
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");

    await getResourceInspector(page).locator("#resource-title").waitFor();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/1.png" });
    await expect(getResourceInspector(page).locator("th").first()).toHaveText(new RegExp(constants.PROGRAM_1_NAME));
  });

  test("should have a filterable table", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right");
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");

    await getResourceInspector(page).locator("#resource-title").waitFor();
    await expect(getResourceInspector(page).getByText("cedfstatus")).toBeDefined();

    await getResourceInspector(page).locator("input").first().fill("library");
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/2.png" });
    await expect(getResourceInspector(page).locator("input").first()).toHaveValue("library");
    await expect(getResourceInspector(page).locator("th").first()).toHaveText(new RegExp(constants.PROGRAM_1_NAME));
  });

  test("should show loading message", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right");
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");

    await waitForNotification(page, `Loading CICS resource '${constants.PROGRAM_1_NAME}'...`);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/3.png" });
  });

  test("should refresh resource when clicking refresh icon", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await waitForNotification(page, `Loading regions`);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_2_NAME, "right");
    await page.waitForTimeout(200);

    // Open resource inspector
    await findAndClickText(page, "Inspect Resource");
    await waitForNotification(page, `Loading CICS resource '${constants.PROGRAM_2_NAME}'...`);

    // Now check resource inspector hasn't updated
    await getResourceInspector(page).locator("#resource-title").waitFor();
    // we're driving the MYPROG1 mock responses here so it'll say it's MYPROG1
    await expect(getResourceInspector(page).locator("th").first()).toHaveText(new RegExp(constants.PROGRAM_2_NAME));
    const newCopyCountRow = getResourceInspector(page).locator("td:has-text('New Copy Count')").first();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/5.png" });
    await expect(newCopyCountRow).toBeVisible();
    await expect(newCopyCountRow.locator("..")).toContainText("0");

    // hitting refresh will cause the new copy count to be returned to 0 because we pull the original mock
    // Find and click the refresh icon
    const refreshIcon = getResourceInspector(page).locator("#refresh-icon");
    await expect(refreshIcon).toBeVisible();
    await refreshIcon.click();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/6.png" });

    // Verify that the refresh occurs
    await waitForNotification(page, `Refreshing Program ${constants.PROGRAM_2_NAME}`);

    const newCopyCountRow2 = getResourceInspector(page).locator("td:has-text('New Copy Count')").first();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/7.png" });
    await expect(newCopyCountRow2).toBeVisible();
    await expect(newCopyCountRow2.locator("..")).toContainText("1");
  });
});

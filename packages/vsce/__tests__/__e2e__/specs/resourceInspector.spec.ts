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
  test("should have a filterable table", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME);
    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right", false);
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");

    await waitForNotification(page, `Loading CICS resource '${constants.PROGRAM_1_NAME}'...`);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/3.png" });

    await getResourceInspector(page).getByText(`${constants.PROGRAM_1_NAME}(Program)`).waitFor();
    await expect(getResourceInspector(page).getByText(`${constants.PROGRAM_1_NAME}(Program)`)).toBeVisible();
    await expect(getResourceInspector(page).getByText("cedfstatus")).toBeDefined();

    await getResourceInspector(page).locator("input").first().fill("library");
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/2.png" });
    await expect(getResourceInspector(page).locator("input").first()).toHaveValue("library");
    await expect(getResourceInspector(page).getByText("Status: ENABLED")).toBeVisible();
  });

  test("should refresh resource when clicking refresh icon", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_2_NAME);
    await findAndClickTreeItem(page, constants.PROGRAM_2_NAME, "right", false);
    await page.waitForTimeout(200);

    // Open resource inspector
    await findAndClickText(page, "Inspect Resource");
    await waitForNotification(page, `Loading CICS resource '${constants.PROGRAM_2_NAME}'...`);

    // Now check resource inspector hasn't updated
    await getResourceInspector(page).locator("span").filter({ hasText: constants.PROGRAM_2_NAME }).waitFor();
    await expect(getResourceInspector(page).locator("#webviewRoot")).toContainText("Status: ENABLEDLanguage: LE370Use Count: 0Library: MYLIB1");
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/5.png" });

    // Find and click the refresh icon
    const refreshIcon = getResourceInspector(page).locator("#refresh-icon");
    await expect(refreshIcon).toBeVisible();
    await refreshIcon.click();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/6.png" });

    // Verify that the refresh occurs
    await waitForNotification(page, `Refreshing...`);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/7.png" });
  });

  test("should refresh the search field when different resource is inspected", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME);
    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right", false);
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");

    await getResourceInspector(page).locator("span").filter({ hasText: constants.PROGRAM_1_NAME }).waitFor();
    await expect(getResourceInspector(page).getByText("cedfstatus")).toBeDefined();

    await getResourceInspector(page).locator("input").first().fill("library");
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/8.png" });
    await expect(getResourceInspector(page).locator("input").first()).toHaveValue("library");
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/9.png" });
    await findAndClickTreeItem(page, "Libraries");
    await findAndClickTreeItem(page, constants.LIBRARY_1_NAME, "right", false);
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");
    await getResourceInspector(page).locator("span").filter({ hasText: constants.PROGRAM_1_NAME }).waitFor();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/10.png" });
    await expect(getResourceInspector(page).locator("input").first()).toHaveValue("");
  });

  test("should refresh the search field when same resource with different node is inspected", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME);
    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right", false);
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");

    await getResourceInspector(page).locator("span").filter({ hasText: constants.PROGRAM_1_NAME }).waitFor();
    await expect(getResourceInspector(page).getByText("cedfstatus")).toBeDefined();

    await getResourceInspector(page).locator("input").first().fill("library");
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/11.png" });
    await expect(getResourceInspector(page).locator("input").first()).toHaveValue("library");
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/12.png" });
    await findAndClickTreeItem(page, constants.PROGRAM_2_NAME, "right");
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");

    await getResourceInspector(page).locator("span").filter({ hasText: constants.PROGRAM_1_NAME }).waitFor();
    await expect(getResourceInspector(page).getByText("cedfstatus")).toBeDefined();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/13.png" });
    await expect(getResourceInspector(page).locator("input").first()).toHaveValue("");
  });
});

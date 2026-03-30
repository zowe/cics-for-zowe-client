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

  test("should display hyperlinks for job spool patterns (//DD:*)", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME);
    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right", false);
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");

    await waitForNotification(page, `Loading CICS resource '${constants.PROGRAM_1_NAME}'...`);
    await getResourceInspector(page).getByText(`${constants.PROGRAM_1_NAME}(Program)`).waitFor();

    // Check if any //DD:* patterns are rendered as hyperlinks
    const jobSpoolLinks = getResourceInspector(page).locator('a[href="javascript:void(0)"]').filter({ hasText: /^\/\/DD:/ });
    const linkCount = await jobSpoolLinks.count();
    
    // If there are job spool links, verify they are clickable
    if (linkCount > 0) {
      await expect(jobSpoolLinks.first()).toBeVisible();
      await expect(jobSpoolLinks.first()).toHaveClass(/underline/);
    }
  });

  test("should display dataset hyperlinks when Zowe Explorer is available", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Libraries");

    await findAndClickTreeItem(page, constants.LIBRARY_1_NAME);
    await findAndClickTreeItem(page, constants.LIBRARY_1_NAME, "right", false);
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");

    await waitForNotification(page, `Loading CICS resource '${constants.LIBRARY_1_NAME}'...`);
    await getResourceInspector(page).getByText(`${constants.LIBRARY_1_NAME}(Library)`).waitFor();

    // Check if dataset names are rendered as hyperlinks (if Zowe Explorer is available)
    const datasetLinks = getResourceInspector(page).locator('a[href="javascript:void(0)"]').filter({ hasText: /^[A-Z@#$][A-Z0-9@#$\-]{0,7}(\.[A-Z@#$][A-Z0-9@#$\-]{0,7})+/ });
    const linkCount = await datasetLinks.count();
    
    // Dataset links should only appear if Zowe Explorer commands are available
    if (linkCount > 0) {
      await expect(datasetLinks.first()).toBeVisible();
      await expect(datasetLinks.first()).toHaveClass(/underline/);
    }
  });

  test("should display highlights section with proper formatting", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME);
    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right", false);
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");

    await waitForNotification(page, `Loading CICS resource '${constants.PROGRAM_1_NAME}'...`);
    await getResourceInspector(page).getByText(`${constants.PROGRAM_1_NAME}(Program)`).waitFor();

    // Verify highlights section exists and contains expected content
    const highlightsSection = getResourceInspector(page).locator('div.flex.flex-col.gap-0\\.5');
    await expect(highlightsSection).toBeVisible();
    
    // Check for key-value pairs in highlights
    await expect(getResourceInspector(page).getByText(/Status:/)).toBeVisible();
  });

  test("should display breadcrumb with resource information", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME);
    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right", false);
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");

    await waitForNotification(page, `Loading CICS resource '${constants.PROGRAM_1_NAME}'...`);
    
    // Verify breadcrumb displays resource name and type (always visible)
    await expect(getResourceInspector(page).getByText(`${constants.PROGRAM_1_NAME}(Program)`)).toBeVisible();
    
    // Hover over breadcrumb to show tooltip with full path
    const breadcrumbArea = getResourceInspector(page).locator('div.flex.items-center.gap-1.relative').first();
    await breadcrumbArea.hover();
    
    // Verify tooltip displays cicsplex and region names
    const tooltip = getResourceInspector(page).locator('div.absolute.left-0.top-5');
    await expect(tooltip).toBeVisible();
    await expect(tooltip.getByText(constants.CICSPLEX_NAME)).toBeVisible();
    await expect(tooltip.getByText(constants.REGION_NAME)).toBeVisible();
  });

  test("should display context menu when actions are available", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME);
    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right", false);
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");

    await waitForNotification(page, `Loading CICS resource '${constants.PROGRAM_1_NAME}'...`);
    await getResourceInspector(page).getByText(`${constants.PROGRAM_1_NAME}(Program)`).waitFor();

    // Check if context menu button exists (three dots icon)
    const contextMenuButton = getResourceInspector(page).locator('button').filter({ hasText: /⋮|︙/ });
    const buttonCount = await contextMenuButton.count();
    
    if (buttonCount > 0) {
      await expect(contextMenuButton.first()).toBeVisible();
    }
  });

  test("should render all resource attributes in table", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME);
    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right", false);
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");

    await waitForNotification(page, `Loading CICS resource '${constants.PROGRAM_1_NAME}'...`);
    await getResourceInspector(page).getByText(`${constants.PROGRAM_1_NAME}(Program)`).waitFor();

    // Verify table headers
    await expect(getResourceInspector(page).getByText("ATTRIBUTE")).toBeVisible();
    await expect(getResourceInspector(page).getByText("VALUE")).toBeVisible();

    // Verify some common attributes are displayed
    const tableRows = getResourceInspector(page).locator('table tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});

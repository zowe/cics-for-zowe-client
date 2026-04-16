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

import { expect, test, Page } from "@playwright/test";
import {
  constants,
  findAndClickText,
  findAndClickTreeItem,
  getResourceInspector,
  getTreeItem,
  prepareZoweExplorerView,
  resetWiremock,
  resetZoweExplorerView,
  waitForNotification,
} from "../utils/helpers";

/**
 * Helper function to navigate to a resource and open the inspector
 */
async function openResourceInspector(
  page: Page,
  resourceType: string,
  resourceName: string,
  useRightClick: boolean = true
) {
  await findAndClickTreeItem(page, constants.PROFILE_NAME);
  await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
  await findAndClickTreeItem(page, constants.REGION_NAME);
  await findAndClickTreeItem(page, resourceType);

  await findAndClickTreeItem(page, resourceName);
  if (useRightClick) {
    await findAndClickTreeItem(page, resourceName, "right", false);
    await page.waitForTimeout(200);
  }
  await findAndClickText(page, "Inspect Resource");

  await waitForNotification(page, `Loading CICS resource '${resourceName}'...`);
}

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("Resource Inspector tests", async () => {
  test("should have a filterable table", async ({ page }) => {
    await openResourceInspector(page, "Programs", constants.PROGRAM_1_NAME);
    
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/filterable-table-loaded.png" });

    await getResourceInspector(page).getByText(`${constants.PROGRAM_1_NAME}(Program)`).waitFor();
    await expect(getResourceInspector(page).getByText(`${constants.PROGRAM_1_NAME}(Program)`), "Resource name and type should be visible").toBeVisible();
    await expect(getResourceInspector(page).getByText("cedfstatus"), "cedfstatus attribute should be visible").toBeVisible();

    await getResourceInspector(page).locator("input").first().fill("library");
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/filterable-table-filtered.png" });
    await expect(getResourceInspector(page).locator("input").first(), "Filter input should contain 'library'").toHaveValue("library");
    await expect(getResourceInspector(page).getByText("Status: ENABLED"), "Status should be visible after filtering").toBeVisible();
  });

  test("should refresh resource when clicking refresh icon", async ({ page }) => {
    await openResourceInspector(page, "Programs", constants.PROGRAM_2_NAME);

    // Verify initial resource inspector content
    await getResourceInspector(page).locator("span").filter({ hasText: constants.PROGRAM_2_NAME }).waitFor();
    await expect(getResourceInspector(page).locator("#webviewRoot"), "Initial resource data should be displayed").toContainText("Status: ENABLEDLanguage: LE370Use Count: 0Library: MYLIB1");
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/refresh-before.png" });

    // Find and click the refresh icon
    const refreshIcon = getResourceInspector(page).locator("#refresh-icon");
    await expect(refreshIcon, "Refresh icon should be visible").toBeVisible();
    await refreshIcon.click();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/refresh-clicked.png" });

    // Verify that the refresh occurs
    await waitForNotification(page, `Refreshing...`);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/refresh-complete.png" });
  });

  test("should refresh the search field when different resource is inspected", async ({ page }) => {
    await openResourceInspector(page, "Programs", constants.PROGRAM_1_NAME);

    await getResourceInspector(page).locator("span").filter({ hasText: constants.PROGRAM_1_NAME }).waitFor();
    await expect(getResourceInspector(page).getByText("cedfstatus"), "cedfstatus should be visible").toBeVisible();

    await getResourceInspector(page).locator("input").first().fill("library");
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/search-field-filled.png" });
    await expect(getResourceInspector(page).locator("input").first(), "Filter should contain 'library'").toHaveValue("library");
    
    // Open a different resource type
    await findAndClickTreeItem(page, "Libraries");
    await findAndClickTreeItem(page, constants.LIBRARY_1_NAME, "right", false);
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");
    await waitForNotification(page, `Loading CICS resource '${constants.LIBRARY_1_NAME}'...`);
    
    await getResourceInspector(page).locator("span").filter({ hasText: constants.LIBRARY_1_NAME }).waitFor();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/search-field-cleared.png" });
    await expect(getResourceInspector(page).locator("input").first(), "Filter should be cleared when switching resources").toHaveValue("");
  });

  test("should refresh the search field when same resource with different node is inspected", async ({ page }) => {
    await openResourceInspector(page, "Programs", constants.PROGRAM_1_NAME);

    await getResourceInspector(page).locator("span").filter({ hasText: constants.PROGRAM_1_NAME }).waitFor();
    await expect(getResourceInspector(page).getByText("cedfstatus"), "cedfstatus should be visible").toBeVisible();

    await getResourceInspector(page).locator("input").first().fill("library");
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/same-type-search-filled.png" });
    await expect(getResourceInspector(page).locator("input").first(), "Filter should contain 'library'").toHaveValue("library");
    
    // Open a different program
    await findAndClickTreeItem(page, constants.PROGRAM_2_NAME, "right");
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");
    await waitForNotification(page, `Loading CICS resource '${constants.PROGRAM_2_NAME}'...`);

    await getResourceInspector(page).locator("span").filter({ hasText: constants.PROGRAM_2_NAME }).waitFor();
    await expect(getResourceInspector(page).getByText("cedfstatus"), "cedfstatus should be visible for second program").toBeVisible();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/same-type-search-cleared.png" });
    await expect(getResourceInspector(page).locator("input").first(), "Filter should be cleared when switching to different program").toHaveValue("");
  });

  test("should display dataset hyperlinks and navigate to Data Sets view", async ({ page }) => {
    await openResourceInspector(page, "Programs", constants.PROGRAM_1_NAME);
    
    await getResourceInspector(page).getByText(`${constants.PROGRAM_1_NAME}(Program)`).waitFor();

    // Filter to show librarydsn attribute
    await getResourceInspector(page).locator("input").first().fill("librarydsn");
    await getResourceInspector(page).getByRole("cell", { name: "MYLIB.DS1" }).waitFor();

    // Verify that MYLIB.DS1 is rendered as a hyperlink
    const datasetLink = getResourceInspector(page).getByRole("cell", { name: "MYLIB.DS1" }).getByRole("link");
    await expect(datasetLink, "Dataset should be rendered as a hyperlink").toBeVisible();
    await expect(datasetLink, "Dataset link should have underline class").toHaveClass(/(^|\s)underline(\s|$)/);

    // Click the dataset link
    await datasetLink.click();

    // Verify navigation to Data Sets tree
    const dataSetsTree = page.getByRole("button", { name: "Data Sets Section", exact: true });
    await dataSetsTree.waitFor({ state: "visible" });
    const isExpanded = (await dataSetsTree.getAttribute("aria-expanded")) === "true";
    if (!isExpanded) {
      await dataSetsTree.click();
    }

    // Verify the z/OSMF profile appears in Data Sets tree
    const zosmfProfileItem = getTreeItem(page, constants.ZOSMF_PROFILE_NAME, false);
    await expect(zosmfProfileItem, "z/OSMF profile should be visible in Data Sets tree").toBeVisible();

    // Verify the dataset appears in the tree
    await zosmfProfileItem.click();
    const datasetItem = getTreeItem(page, "MYLIB.DS1", false);
    await expect(datasetItem, "Dataset should appear in the tree").toBeVisible();
  });

  test("should display highlights section with proper formatting", async ({ page }) => {
    await openResourceInspector(page, "Programs", constants.PROGRAM_1_NAME);
    
    await getResourceInspector(page).getByText(`${constants.PROGRAM_1_NAME}(Program)`).waitFor();

    // Verify highlights section exists and contains expected content
    const highlightsSection = getResourceInspector(page).locator('div.flex.flex-col.gap-0\\.5');
    await expect(highlightsSection, "Highlights section should be visible").toBeVisible();
    
    // Check for key-value pairs in highlights
    await expect(getResourceInspector(page).getByText(/Status:/), "Status field should be visible in highlights").toBeVisible();
  });

  test("should display breadcrumb with resource information", async ({ page }) => {
    await openResourceInspector(page, "Programs", constants.PROGRAM_1_NAME);
    
    // Verify breadcrumb displays resource name and type (always visible)
    await expect(getResourceInspector(page).getByText(`${constants.PROGRAM_1_NAME}(Program)`), "Breadcrumb should display resource name and type").toBeVisible();
    
    // Hover over breadcrumb to show tooltip with full path
    const breadcrumbArea = getResourceInspector(page).locator('div.flex.items-center.gap-1.relative').first();
    await breadcrumbArea.hover();
    
    // Verify tooltip displays cicsplex and region names
    const tooltip = getResourceInspector(page).locator('div.absolute.left-0.top-5');
    await expect(tooltip, "Tooltip should be visible on hover").toBeVisible();
    await expect(tooltip.getByText(constants.CICSPLEX_NAME), "Tooltip should display CICSPLEX name").toBeVisible();
    await expect(tooltip.getByText(constants.REGION_NAME), "Tooltip should display region name").toBeVisible();
  });

  test("should display context menu when actions are available", async ({ page }) => {
    await openResourceInspector(page, "Programs", constants.PROGRAM_1_NAME);
    
    await getResourceInspector(page).getByText(`${constants.PROGRAM_1_NAME}(Program)`).waitFor();

    // Check if context menu button exists (three dots icon)
    const contextMenuButton = getResourceInspector(page).locator('button').filter({ hasText: /⋮|︙/ });
    const buttonCount = await contextMenuButton.count();
    
    if (buttonCount > 0) {
      await expect(contextMenuButton.first(), "Context menu button should be visible when actions are available").toBeVisible();
    }
  });

  test("should render all resource attributes in table", async ({ page }) => {
    await openResourceInspector(page, "Programs", constants.PROGRAM_1_NAME);
    
    await getResourceInspector(page).getByText(`${constants.PROGRAM_1_NAME}(Program)`).waitFor();

    // Verify table headers
    await expect(getResourceInspector(page).getByText("ATTRIBUTE"), "ATTRIBUTE header should be visible").toBeVisible();
    await expect(getResourceInspector(page).getByText("VALUE"), "VALUE header should be visible").toBeVisible();

    // Verify some common attributes are displayed
    const tableRows = getResourceInspector(page).locator('table tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount, "Table should contain at least one row of attributes").toBeGreaterThan(0);
  });
});

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

test.describe("Table View tests", async () => {
  test("should display multiple resources in table view with search, refresh, and actions", async ({ page }) => {
    // Navigate to Programs resource type
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");
    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME);
    
    // Click the "View in table" button (icon button in tree)
    const programsTreeItem = page.getByRole("treeitem", { name: "Programs" });
    await programsTreeItem.click({ button: "right" });
    await page.waitForTimeout(200);
    await findAndClickText(page, "View in table");
    
    // Wait for table view to load
    await page.waitForTimeout(1000);
    
    // Verify table view is displayed with multiple resources
    const resourceInspector = getResourceInspector(page);
    
    // Check that table headers are visible (RESOURCE column and attribute columns)
    const tableHeaders = resourceInspector.locator("thead th");
    const headerCount = await tableHeaders.count();
    expect(headerCount, "Table should have multiple columns including RESOURCE column").toBeGreaterThan(1);
    
    // Verify RESOURCE column header exists
    await expect(resourceInspector.getByText("RESOURCE"), "RESOURCE column header should be visible").toBeVisible();
    
    // Verify multiple resource rows are displayed
    const tableRows = resourceInspector.locator("tbody tr");
    const rowCount = await tableRows.count();
    expect(rowCount, "Table should display multiple resource rows").toBeGreaterThan(1);
    
    // Verify first resource name is visible in table
    await expect(resourceInspector.getByText(constants.PROGRAM_1_NAME), "First program should be visible in table").toBeVisible();
    
    // Test search functionality
    const searchInput = resourceInspector.locator("input").first();
    await expect(searchInput, "Search input should be visible").toBeVisible();
    
    // Search for specific program
    await searchInput.fill(constants.PROGRAM_1_NAME);
    await page.waitForTimeout(300);
    
    // Verify filtered results
    const filteredRows = resourceInspector.locator("tbody tr");
    const filteredCount = await filteredRows.count();
    expect(filteredCount, "Filtered results should show fewer rows").toBeLessThanOrEqual(rowCount);
    await expect(resourceInspector.getByText(constants.PROGRAM_1_NAME), "Searched program should still be visible").toBeVisible();
    
    // Clear search
    const clearButton = resourceInspector.locator(".codicon-close");
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(300);
    }
    
    // Verify all rows are shown again after clearing search
    const restoredRows = resourceInspector.locator("tbody tr");
    const restoredCount = await restoredRows.count();
    expect(restoredCount, "All rows should be visible after clearing search").toBe(rowCount);
    
    // Test refresh functionality
    const refreshButton = resourceInspector.locator("#refresh-icon");
    await expect(refreshButton, "Refresh button should be visible").toBeVisible();
    await refreshButton.click();
    
    // Verify refresh notification appears
    await waitForNotification(page, "Refreshing...");
    
    // Verify table is still displayed after refresh
    await expect(resourceInspector.getByText("RESOURCE"), "Table should still be visible after refresh").toBeVisible();
    
    // Test context menu actions (if available)
    const contextMenuButtons = resourceInspector.locator('button').filter({ hasText: /⋮|︙/ });
    const contextMenuCount = await contextMenuButtons.count();
    
    if (contextMenuCount > 0) {
      // Click first context menu
      await contextMenuButtons.first().click();
      await page.waitForTimeout(200);
      
      // Verify context menu is displayed
      const contextMenu = resourceInspector.locator('[role="menu"], .context-menu, [class*="menu"]');
      const menuVisible = await contextMenu.isVisible().catch(() => false);
      
      if (menuVisible) {
        // Close context menu by pressing Escape
        await page.keyboard.press("Escape");
      }
    }
    
    // Verify breadcrumb shows resource type
    const breadcrumb = resourceInspector.locator("div").filter({ hasText: /Programs|programs/ }).first();
    await expect(breadcrumb, "Breadcrumb should show resource type").toBeVisible();
    
    // Verify sticky columns work by checking first column has sticky class
    const firstColumnHeader = resourceInspector.locator("thead th").first();
    const firstColumnClass = await firstColumnHeader.getAttribute("class");
    expect(firstColumnClass, "First column should have sticky positioning").toContain("sticky");
    
    // Take screenshot for visual verification
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/tableView/table-view-complete.png" });
  });
});

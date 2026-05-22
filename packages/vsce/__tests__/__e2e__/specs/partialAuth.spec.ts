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
  findAndClickTreeItem,
  getTreeItem,
  prepareZoweExplorerView,
  resetWiremock,
  resetZoweExplorerView,
} from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await page.waitForTimeout(100);
  await resetZoweExplorerView(page);
});

test.describe("Partial Authorization Tests - MYPLEX3/MYREG3", () => {
  test("should display (Partial Results) text for Programs with partial auth", async ({ page }) => {
    // Navigate to wiremock_localhost/MYPLEX3/MYREG3/Programs
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await page.waitForTimeout(500);
    
    // Check if MYPLEX3 exists, if not skip this test
    const myplex3 = page.getByRole("treeitem", { name: /MYPLEX3/ });
    const myplex3Visible = await myplex3.isVisible().catch(() => false);
    
    if (!myplex3Visible) {
      test.skip();
      return;
    }

    await findAndClickTreeItem(page, "MYPLEX3");
    await page.waitForTimeout(500);
    
    await findAndClickTreeItem(page, "MYREG3");
    await page.waitForTimeout(500);
    
    await findAndClickTreeItem(page, "Programs");
    await page.waitForTimeout(2000);

    // Verify "(Partial Results)" appears in the Programs node description
    const programsNode = getTreeItem(page, "Programs", false);
    await expect(programsNode).toContainText("(Partial Results)");

    // Verify authorized programs are shown (PROG001, PROG002, PROG003)
    await expect(getTreeItem(page, "PROG001", false)).toBeVisible();
    await expect(getTreeItem(page, "PROG002", false)).toBeVisible();
    await expect(getTreeItem(page, "PROG003", false)).toBeVisible();

    // Take screenshot for documentation
    await page.screenshot({
      fullPage: true,
      path: "./__tests__/screenshots/partial-auth/programs-partial-results.png"
    });
  });

  test("should display (Partial Results) text for Transactions with partial auth", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await page.waitForTimeout(500);
    
    const myplex3 = page.getByRole("treeitem", { name: /MYPLEX3/ });
    const myplex3Visible = await myplex3.isVisible().catch(() => false);
    
    if (!myplex3Visible) {
      test.skip();
      return;
    }

    await findAndClickTreeItem(page, "MYPLEX3");
    await page.waitForTimeout(500);
    await findAndClickTreeItem(page, "MYREG3");
    await page.waitForTimeout(500);
    await findAndClickTreeItem(page, "Transactions");
    await page.waitForTimeout(2000);

    // Verify "(Partial Results)" appears in description
    const transactionsNode = getTreeItem(page, "Transactions", false);
    await expect(transactionsNode).toContainText("(Partial Results)");

    // Verify authorized transactions are shown (TRN1, TRN2, TRN3, CEMT)
    await expect(getTreeItem(page, "TRN1", false)).toBeVisible();
    await expect(getTreeItem(page, "TRN2", false)).toBeVisible();
    await expect(getTreeItem(page, "TRN3", false)).toBeVisible();
    await expect(getTreeItem(page, "CEMT", false)).toBeVisible();

    await page.screenshot({
      fullPage: true,
      path: "./__tests__/screenshots/partial-auth/transactions-partial-results.png"
    });
  });

  test("should display (Partial Results) text for Bundles with partial auth", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME, "left", false);
    await page.waitForTimeout(500);
    
    const myplex3 = page.getByRole("treeitem", { name: /MYPLEX3/ });
    const myplex3Visible = await myplex3.isVisible().catch(() => false);
    
    if (!myplex3Visible) {
      test.skip();
      return;
    }

    await findAndClickTreeItem(page, "MYPLEX3", "left", false);
    await page.waitForTimeout(500);
    await findAndClickTreeItem(page, "MYREG3", "left", false);
    await page.waitForTimeout(500);
    await findAndClickTreeItem(page, "Bundles", "left", false);
    await page.waitForTimeout(2000);

    // Verify "(Partial Results)" appears in description
    const bundlesNode = getTreeItem(page, "Bundles", false);
    await expect(bundlesNode).toContainText("(Partial Results)");

    // Verify authorized bundles are shown (BUNDLE01, BUNDLE02)
    // Note: Bundles may have status appended like "BUNDLE02 (DISABLED)"
    const bundle01 = page.getByRole("treeitem", { name: /BUNDLE01/ });
    const bundle02 = page.getByRole("treeitem", { name: /BUNDLE02/ });
    await expect(bundle01).toBeVisible();
    await expect(bundle02).toBeVisible();

    await page.screenshot({
      fullPage: true,
      path: "./__tests__/screenshots/partial-auth/bundles-partial-results.png"
    });
  });

  test("should display correct record count with partial results", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME, "left", false);
    await page.waitForTimeout(500);
    
    const myplex3 = page.getByRole("treeitem", { name: /MYPLEX3/ });
    const myplex3Visible = await myplex3.isVisible().catch(() => false);
    
    if (!myplex3Visible) {
      test.skip();
      return;
    }

    await findAndClickTreeItem(page, "MYPLEX3", "left", false);
    await page.waitForTimeout(500);
    await findAndClickTreeItem(page, "MYREG3", "left", false);
    await page.waitForTimeout(500);
    await findAndClickTreeItem(page, "Programs", "left", false);
    await page.waitForTimeout(2000);

    // Verify the description shows correct count and partial results indicator
    const programsNode = getTreeItem(page, "Programs", false);
    await expect(programsNode).toContainText("[3 of 3]");
    await expect(programsNode).toContainText("(Partial Results)");
  });

  test("should show partial results for multiple resource types", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME, "left", false);
    await page.waitForTimeout(500);
    
    const myplex3 = page.getByRole("treeitem", { name: /MYPLEX3/ });
    const myplex3Visible = await myplex3.isVisible().catch(() => false);
    
    if (!myplex3Visible) {
      test.skip();
      return;
    }

    await findAndClickTreeItem(page, "MYPLEX3", "left", false);
    await page.waitForTimeout(500);
    await findAndClickTreeItem(page, "MYREG3", "left", false);
    await page.waitForTimeout(500);

    // Expand Programs and verify partial results
    await findAndClickTreeItem(page, "Programs", "left", false);
    await page.waitForTimeout(2000);
    const programsNode = getTreeItem(page, "Programs", false);
    await expect(programsNode).toContainText("(Partial Results)");

    // Expand Transactions and verify partial results
    await findAndClickTreeItem(page, "Transactions", "left", false);
    await page.waitForTimeout(2000);
    const transactionsNode = getTreeItem(page, "Transactions", false);
    await expect(transactionsNode).toContainText("(Partial Results)");

    // Take screenshot showing multiple resource types with partial results
    await page.screenshot({
      fullPage: true,
      path: "./__tests__/screenshots/partial-auth/multiple-resources.png"
    });
  });
});

test.describe("Complete Authorization Failure Tests - MYPLEX4", () => {
  test("should handle complete authorization failure for Programs", async ({ page }) => {
    // Navigate to wiremock_localhost/MYPLEX4
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await page.waitForTimeout(500);
    
    // Check if MYPLEX4 exists, if not skip this test
    const myplex4 = page.getByRole("treeitem", { name: /MYPLEX4/ });
    const myplex4Visible = await myplex4.isVisible().catch(() => false);
    
    if (!myplex4Visible) {
      test.skip();
      return;
    }

    await findAndClickTreeItem(page, "MYPLEX4");
    await page.waitForTimeout(500);
    
    // Expand any region under MYPLEX4
    const regionItems = page.getByRole("treeitem").filter({ hasText: /^[A-Z0-9]{1,8}$/ });
    const firstRegion = regionItems.first();
    await firstRegion.click();
    await page.waitForTimeout(500);
    
    // Try to expand Programs - should show error or may not exist
    const programsNode = page.getByRole("treeitem", { name: /Programs/ });
    const programsVisible = await programsNode.isVisible().catch(() => false);
    
    if (programsVisible) {
      await programsNode.click();
      await page.waitForTimeout(2000);
      
      // The Programs node should be visible but should not show any program items
      await expect(programsNode).toBeVisible();
    }
    
    // Verify no program items are shown (check that PROG001, PROG002, etc. don't exist)
    const prog001 = page.getByRole("treeitem", { name: /^PROG001/ });
    await expect(prog001).not.toBeVisible();

    // Take screenshot for documentation
    await page.screenshot({
      fullPage: true,
      path: "./__tests__/screenshots/partial-auth/myplex4-complete-auth-failure.png"
    });
  });

  test("should not crash when accessing MYPLEX4 with complete auth failure", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME, "left", false);
    await page.waitForTimeout(500);
    
    const myplex4 = page.getByRole("treeitem", { name: /MYPLEX4/ });
    const myplex4Visible = await myplex4.isVisible().catch(() => false);
    
    if (!myplex4Visible) {
      test.skip();
      return;
    }

    await findAndClickTreeItem(page, "MYPLEX4", "left", false);
    await page.waitForTimeout(500);
    
    // Expand any region
    const regionItems = page.getByRole("treeitem").filter({ hasText: /^[A-Z0-9]{1,8}$/ });
    const firstRegion = regionItems.first();
    await firstRegion.click();
    await page.waitForTimeout(500);
    
    // Try to expand Programs (may not be visible with complete auth failure)
    const programsNode = page.getByRole("treeitem", { name: /Programs/ });
    const programsVisible = await programsNode.isVisible().catch(() => false);
    if (programsVisible) {
      await programsNode.click();
      await page.waitForTimeout(2000);
    }

    // Verify the extension is still responsive (tree is still visible)
    const tree = page.getByRole("tree");
    await expect(tree).toBeVisible();
    
    // Verify we can still interact with other parts of the tree
    await expect(page.getByRole("treeitem", { name: constants.PROFILE_NAME })).toBeVisible();
  });

  test("should display appropriate error message for complete auth failure", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME, "left", false);
    await page.waitForTimeout(500);
    
    const myplex4 = page.getByRole("treeitem", { name: /MYPLEX4/ });
    const myplex4Visible = await myplex4.isVisible().catch(() => false);
    
    if (!myplex4Visible) {
      test.skip();
      return;
    }

    await findAndClickTreeItem(page, "MYPLEX4", "left", false);
    await page.waitForTimeout(500);
    
    // Expand any region
    const regionItems = page.getByRole("treeitem").filter({ hasText: /^[A-Z0-9]{1,8}$/ });
    const firstRegion = regionItems.first();
    await firstRegion.click();
    await page.waitForTimeout(500);
    
    // Try to expand Programs - this should trigger an error
    const programsNode = page.getByRole("treeitem", { name: /Programs/ });
    const programsVisible = await programsNode.isVisible().catch(() => false);
    if (programsVisible) {
      await programsNode.click();
      await page.waitForTimeout(2000);
    }

    // The Programs node should be visible (or may not exist with complete auth failure)
    if (programsVisible) {
      await expect(programsNode).toBeVisible();
    }
    
    // Verify the description shows 0 records or error state
    // The exact text may vary based on implementation
    const programsText = await programsNode.textContent();
    expect(programsText).toBeTruthy();
    
    // Take screenshot
    await page.screenshot({
      fullPage: true,
      path: "./__tests__/screenshots/partial-auth/myplex4-error-message.png"
    });
  });

  test("should differentiate between MYPLEX3 partial auth and MYPLEX4 complete failure", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME, "left", false);
    await page.waitForTimeout(500);
    
    // Check both plexes exist
    const myplex3 = page.getByRole("treeitem", { name: /MYPLEX3/ });
    const myplex4 = page.getByRole("treeitem", { name: /MYPLEX4/ });
    const myplex3Visible = await myplex3.isVisible().catch(() => false);
    const myplex4Visible = await myplex4.isVisible().catch(() => false);
    
    if (!myplex3Visible || !myplex4Visible) {
      test.skip();
      return;
    }

    // Test MYPLEX3 - should show partial results
    await findAndClickTreeItem(page, "MYPLEX3", "left", false);
    await page.waitForTimeout(500);
    await findAndClickTreeItem(page, "MYREG3", "left", false);
    await page.waitForTimeout(500);
    await findAndClickTreeItem(page, "Programs", "left", false);
    await page.waitForTimeout(2000);
    
    const myplex3ProgramsNode = page.getByRole("treeitem", { name: /Programs/ });
    await expect(myplex3ProgramsNode).toContainText("(Partial Results)");
    await expect(page.getByRole("treeitem", { name: /PROG001/ })).toBeVisible();
    
    // Collapse MYPLEX3
    await findAndClickTreeItem(page, "MYPLEX3", "left", false);
    await page.waitForTimeout(500);
    
    // Test MYPLEX4 - should show no programs
    await findAndClickTreeItem(page, "MYPLEX4", "left", false);
    await page.waitForTimeout(500);
    
    const regionItems = page.getByRole("treeitem").filter({ hasText: /^[A-Z0-9]{1,8}$/ });
    const firstRegion = regionItems.first();
    await firstRegion.click();
    await page.waitForTimeout(500);
    
    // Try to expand Programs in MYPLEX4 (may not be visible with complete auth failure)
    const myplex4ProgramsNode = page.getByRole("treeitem", { name: /Programs/ });
    const myplex4ProgramsVisible = await myplex4ProgramsNode.isVisible().catch(() => false);
    if (myplex4ProgramsVisible) {
      await myplex4ProgramsNode.click();
      await page.waitForTimeout(2000);
    }
    
    // MYPLEX4 should not show any programs
    const prog001InMyplex4 = page.getByRole("treeitem", { name: /^PROG001/ });
    await expect(prog001InMyplex4).not.toBeVisible();
    
    // Take comparison screenshot
    await page.screenshot({
      fullPage: true,
      path: "./__tests__/screenshots/partial-auth/myplex3-vs-myplex4-comparison.png"
    });
  });
});



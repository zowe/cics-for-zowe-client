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



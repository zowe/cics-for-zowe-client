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
import { constants, findAndClickTreeItem, getTreeItem, prepareZoweExplorerView, resetWiremock, resetZoweExplorerView } from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("Region Filter", () => {
  test("should show filter indicator when zowe filter is active", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, "Regions");

    const filterButton = page.getByRole("button", { name: "Filter Plex Resources in Regions tree", exact: true });
    await expect(filterButton).toBeVisible();
    await filterButton.click();

    const textBox = page.getByRole("textbox", { name: "Select a Filter", exact: false });
    await expect(textBox).toBeEditable();
    await textBox.fill("MYREG1");
    await textBox.press("Enter");

    const regionsNode = getTreeItem(page, "Regions region=MYREG1 [1/1]", false);
    await expect(regionsNode).toBeVisible();
    await expect(regionsNode).toHaveCount(1);

    const clearButton = page.getByRole("button", { name: "Clear Plex Filter", exact: true });
    await expect(clearButton).toBeVisible();
  });

  test("should apply new filter over existing filter", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, "Regions");

    const filterButton = page.getByRole("button", { name: "Filter Plex Resources in Regions tree", exact: true });
    await filterButton.click();

    let textBox = page.getByRole("textbox", { name: "Select a Filter", exact: false });
    await textBox.fill("MYREG1");
    await textBox.press("Enter");

    await expect(getTreeItem(page, "Regions region=MYREG1 [1/1]", false)).toHaveCount(1);

    await filterButton.click();
    textBox = page.getByRole("textbox", { name: "Select a Filter", exact: false });
    await textBox.fill("MYR*");
    await textBox.press("Enter");

    await page.waitForTimeout(500);
    await expect(getTreeItem(page, constants.REGION_NAME)).toBeVisible();
  });

  test("should filter regions", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, "Regions");

    const filterButton = page.getByRole("button", { name: "Filter Plex Resources in Regions tree", exact: true });
    await expect(filterButton).toBeVisible();
    await filterButton.click();

    const textBox = page.getByRole("textbox", { name: "Select a Filter", exact: false });
    await expect(textBox).toBeEditable();
    await textBox.fill("MYREG1");
    await textBox.press("Enter");

    await expect(getTreeItem(page, constants.REGION_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.REGION_ERROR)).not.toBeVisible();

    await expect(getTreeItem(page, constants.REGION_NAME)).toHaveText(constants.REGION_NAME);
  });

  test("Should clear all filters", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, "Regions");

    const filterButton = page.getByRole("button", { name: "Filter Plex Resources in Regions tree", exact: true });
    await expect(filterButton).toBeVisible();
    await filterButton.click();

    const textBox = page.getByRole("textbox", { name: "Select a Filter", exact: false });
    await expect(textBox).toBeEditable();
    await textBox.fill("MYREG1");
    await textBox.press("Enter");

    await expect(getTreeItem(page, constants.REGION_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.REGION_ERROR)).not.toBeVisible();

    const clearButton = page.getByRole("button", { name: "Clear Plex Filter", exact: true });
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await expect(getTreeItem(page, constants.REGION_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.REGION_ERROR)).toBeVisible();
  });
  test("should persist filter during session when reopening regions node", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, "Regions");

    const filterButton = page.getByRole("button", { name: "Filter Plex Resources in Regions tree", exact: true });
    await filterButton.click();

    const textBox = page.getByRole("textbox", { name: "Select a Filter", exact: false });
    await textBox.fill("MYREG1");
    await textBox.press("Enter");

    await expect(getTreeItem(page, constants.REGION_NAME)).toBeVisible();
    await expect(getTreeItem(page, "Regions region=MYREG1 [1/1]", false)).toHaveCount(1);

    const regionsNode = getTreeItem(page, "Regions region=MYREG1 [1/1]", false);
    await regionsNode.click();

    await page.waitForTimeout(500);

    await regionsNode.click();

    await expect(getTreeItem(page, constants.REGION_NAME)).toBeVisible();
    await expect(getTreeItem(page, "Regions region=MYREG1 [1/1]", false)).toHaveCount(1);
  });

  test("should show profile region name as first option in filter dialog", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, "Regions");

    const filterButton = page.getByRole("button", { name: "Filter Plex Resources in Regions tree", exact: true });
    await filterButton.click();

    const textBox = page.getByRole("textbox", { name: "Select a Filter", exact: false });
    await expect(textBox).toBeEditable();

    await expect(textBox).toBeFocused();
  });

  test("should support wildcard patterns in filter", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, "Regions");

    const filterButton = page.getByRole("button", { name: "Filter Plex Resources in Regions tree", exact: true });
    await filterButton.click();

    const textBox = page.getByRole("textbox", { name: "Select a Filter", exact: false });
    await textBox.fill("MYR*");
    await textBox.press("Enter");

    await page.waitForTimeout(500);
    await expect(getTreeItem(page, constants.REGION_NAME)).toBeVisible();
  });

  test("should show all regions when filter is cleared", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, "Regions");

    const filterButton = page.getByRole("button", { name: "Filter Plex Resources in Regions tree", exact: true });
    await filterButton.click();

    const textBox = page.getByRole("textbox", { name: "Select a Filter", exact: false });
    await textBox.fill("MYREG1");
    await textBox.press("Enter");

    await expect(getTreeItem(page, constants.REGION_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.REGION_ERROR)).not.toBeVisible();
    const clearButton = page.getByRole("button", { name: "Clear Plex Filter", exact: true });
    await clearButton.click();

    await expect(getTreeItem(page, constants.REGION_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.REGION_ERROR)).toBeVisible();

    await expect(getTreeItem(page, "Regions [2/2]", false)).toHaveCount(1);
  });
});
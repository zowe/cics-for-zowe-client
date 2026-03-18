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
  test("should filter regions", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, "Regions");

    const filterButton = page.getByRole("button", { name: "Filter Plex Resources in Regions tree", exact: true });
    await expect(filterButton).toBeVisible();
    await filterButton.click();

    const textBox = page.getByRole("textbox", { name: "Select a Filter", exact: true });
    await expect(textBox).toBeEditable();
    await textBox.fill("MYREG1");
    await textBox.press("Enter");

    await expect(getTreeItem(page, constants.REGION_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.REGION_ERROR)).not.toBeVisible();

    await expect(getTreeItem(page, constants.REGION_NAME)).toHaveText(constants.REGION_NAME);
  });

  test("should give notification when the mentioned region is not present", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, "Regions");

    const filterButton = page.getByRole("button", { name: "Filter Plex Resources in Regions tree", exact: true });
    await expect(filterButton).toBeVisible();
    await filterButton.click();

    const textBox = page.getByRole("textbox", { name: "Select a Filter", exact: true });
    await expect(textBox).toBeEditable();
    await textBox.fill("NOREG");
    await textBox.press("Enter");

    await expect(page.getByText("No regions found for MYPLEX1", { exact: true })).toBeVisible();
  });

  test("Should Dispaly notification when Cancelled", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, "Regions");

    const filterButton = page.getByRole("button", { name: "Filter Plex Resources in Regions tree", exact: true });
    await expect(filterButton).toBeVisible();
    await filterButton.click();

    const textBox = page.getByRole("textbox", { name: "Select a Filter", exact: true });
    await expect(textBox).toBeEditable();
    await textBox.fill("NOREG");
    await textBox.press("Escape");

    await expect(page.getByText("No Selection Made", { exact: true })).toBeVisible();
  });
  test("Should clear all filters", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, "Regions");

    const filterButton = page.getByRole("button", { name: "Filter Plex Resources in Regions tree", exact: true });
    await expect(filterButton).toBeVisible();
    await filterButton.click();

    const textBox = page.getByRole("textbox", { name: "Select a Filter", exact: true });
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
});

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
  clickTreeNode,
  constants,
  findAndClickText,
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
  await resetZoweExplorerView(page);
});

test.describe("Error scenarios", () => {
  test("jvm server throws error when killing it", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_ERROR);
    await findAndClickTreeItem(page, "JVM Servers");

    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toHaveText(constants.JVM_SERVER_1_NAME);

    await clickTreeNode(page, constants.JVM_SERVER_1_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Disable JVM Server");
    //Click on Kill button
    await expect(page.getByRole("button", { name: "Kill", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Kill", exact: true }).click();

    const notification = page.getByRole("list", { name: "Failed to DISABLE JVMSERVER", exact: false });
    await expect(notification).toBeVisible();
    await expect(notification).toContainText(constants.JVM_SERVER_DISABLE_ERROR_MESSAGE);

    await notification.getByRole("button", { name: "Open Documentation", exact: true }).click();
    const dialog = await page.getByText("www.ibm.com/docs/en/cics-ts/6.x?", { exact: false });
    await expect(dialog).toBeVisible();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
  });

  test("enabling bundle throws error", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_ERROR);
    await findAndClickTreeItem(page, "Bundles");

    await expect(getTreeItem(page, constants.BUNDLE_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.BUNDLE_1_NAME)).toHaveText(constants.BUNDLE_1_NAME);

    await clickTreeNode(page, constants.BUNDLE_1_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, constants.ENABLE_BUNDLE);

    const notification = page.getByRole("list", { name: "Failed to ENABLE BUNDLE", exact: false });
    await expect(notification).toBeVisible();
    await expect(notification).toContainText(constants.BUNDLE_ENABLE_ERROR_MESSAGE);

    await notification.getByRole("button", { name: "Open Documentation", exact: true }).click();
    const dialog = await page.getByText("www.ibm.com/docs/en/cics-ts/6.x?", { exact: false });
    await expect(dialog).toBeVisible();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
  });

  test("invalid filter in transaction throws error", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_ERROR);
    await findAndClickTreeItem(page, "Transactions");

    await expect(getTreeItem(page, "TRAN", true)).toBeVisible();
    await expect(getTreeItem(page, "RUSH", true)).toBeVisible();

    const filterButton = page.getByRole("button", { name: "Filter Resources", exact: true });
    await expect(filterButton).toBeVisible();
    await filterButton.click();

    const textBox = page.getByRole("textbox", { name: "Select a Filter", exact: true });
    await expect(textBox).toBeEditable();
    await textBox.fill("FILTER");
    await textBox.press("Enter");

    const notification = page.getByRole("list", { name: "Failed to send request", exact: false });
    await expect(notification).toBeVisible();
    await expect(notification).toContainText(constants.TRANSACTION_INVALID_FILTER_ERROR_MESSAGE);
  });

  test("disabling system (DFHRPL) library throws error", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_ERROR);
    await findAndClickTreeItem(page, "Libraries");

    await expect(getTreeItem(page, constants.LIBRARY_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.LIBRARY_NAME)).toHaveText(constants.LIBRARY_NAME);

    await clickTreeNode(page, constants.LIBRARY_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, constants.DISABLE_LIBRARY);

    const notification = page.getByRole("list", { name: "Failed to DISABLE LIBRARY", exact: false });
    await expect(notification).toBeVisible();
    await expect(notification).toContainText(constants.LIBRARY_DISABLE_ERROR_MESSAGE);

    await notification.getByRole("button", { name: "Open Documentation", exact: true }).click();
    const dialog = await page.getByText("www.ibm.com/docs/en/cics-ts/6.x?", { exact: false });
    await expect(dialog).toBeVisible();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
  });

  test("connecting cics profile throws error", async ({ page }) => {
    await page.locator(".tree-explorer-viewlet-tree-view").first().click();
    await expect(page.getByRole("button", { name: "Create a CICS Profile" })).toBeVisible();
    await page.getByRole("button", { name: "Create a CICS Profile" }).click();

    await page.waitForTimeout(200);
    await findAndClickText(page, constants.TEST_LOGIN);
    await expect(getTreeItem(page, constants.TEST_LOGIN)).toBeVisible();
    await findAndClickTreeItem(page, constants.TEST_LOGIN);

    const notification = page.getByRole("list", { name: "Failed to send request", exact: false });
    await expect(notification).toBeVisible();
    await expect(notification).toContainText(constants.NO_CONNECTION_ERROR_MESSAGE);

    // Remove test profile from tree
    await findAndClickTreeItem(page, constants.TEST_LOGIN, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Manage Profile");
    await findAndClickText(page, "Hide Profile");

    await expect(getTreeItem(page, constants.TEST_LOGIN)).toHaveCount(0);
  });

  test("searching program not present throws error", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_ERROR);
    await findAndClickTreeItem(page, "Programs");

    await expect(getTreeItem(page, "MYPROG1", true)).toBeVisible();
    await expect(getTreeItem(page, "MYPROG2", true)).toBeVisible();

    const filterButton = page.getByRole("button", { name: "Filter Resources", exact: true });
    await expect(filterButton).toBeVisible();
    await filterButton.click();

    const textBox = page.getByRole("textbox", { name: "Select a Filter", exact: true });
    await expect(textBox).toBeEditable();
    await textBox.fill("PROG3,PROG4");
    await textBox.press("Enter");

    const notification = page.getByRole("list", { name: "The CMCI REST API request failed", exact: false });
    await expect(notification).toBeVisible();
    await expect(notification).toHaveText(constants.PROGRAM_NOT_FOUND_ERROR_MESSAGE);
  });

  test("disabling program throws error", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_ERROR);
    await findAndClickTreeItem(page, "Programs");

    await expect(getTreeItem(page, constants.PROGRAM_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.PROGRAM_1_NAME)).toHaveText(constants.PROGRAM_1_NAME);
    await clickTreeNode(page, constants.PROGRAM_1_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, constants.DISABLE_PROGRAM);

    const notification = page.getByRole("list", { name: "Failed to DISABLE PROGRAM", exact: false });
    await expect(notification).toBeVisible();
    await expect(notification).toContainText(constants.PROGRAM_DISABLE_ERROR_MESSAGE);

    await notification.getByRole("button", { name: "Open Documentation", exact: true }).click();
    const dialog = await page.getByText("www.ibm.com/docs/en/cics-ts/6.x?", { exact: false });
    await expect(dialog).toBeVisible();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
  });

  test("disabling multi program shows multiple error notification", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_ERROR);
    await findAndClickTreeItem(page, "Programs");

    await expect(getTreeItem(page, constants.PROGRAM_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.PROGRAM_1_NAME)).toHaveText(constants.PROGRAM_1_NAME);

    await expect(getTreeItem(page, constants.PROGRAM_2_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.PROGRAM_2_NAME)).toHaveText(constants.PROGRAM_2_NAME);

    await clickTreeNode(page, constants.PROGRAM_1_NAME);
    await page.waitForTimeout(200);
    await getTreeItem(page, constants.PROGRAM_2_NAME).click({ modifiers: ["Shift"], button: "left" });
    await page.waitForTimeout(200);
    await clickTreeNode(page, constants.PROGRAM_2_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, constants.DISABLE_PROGRAM);

    const notification = page.getByRole("list", { name: "Failed to DISABLE PROGRAM MYPROG1", exact: false });
    await expect(notification).toBeVisible();
    await expect(notification).toContainText(constants.PROGRAM_DISABLE_ERROR_MESSAGE);

    const notification2 = page.getByRole("list", { name: "Failed to DISABLE PROGRAM MYPROG2", exact: false });
    await expect(notification2).toBeVisible();
    await expect(notification2).toContainText(constants.PROGRAM2_DISABLE_ERROR_MESSAGE);
  });
});

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
  expectedProfileOrder,
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

test.describe("Profile tests", () => {
  test("should hide profile from tree", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Manage Profile");
    await findAndClickText(page, "Hide Profile");

    await expect(getTreeItem(page, constants.PROFILE_NAME)).toHaveCount(0);
  });

  test("should add profile to tree", async ({ page }) => {
    await expect(getTreeItem(page, constants.PROFILE_NAME)).toHaveCount(0);

    await page.locator(".tree-explorer-viewlet-tree-view").first().click();
    await expect(page.getByRole("button", { name: "Create a CICS Profile" })).toBeVisible();
    await page.getByRole("button", { name: "Create a CICS Profile" }).click();

    await page.waitForTimeout(200);

    await findAndClickText(page, constants.PROFILE_NAME);
    await expect(getTreeItem(page, constants.PROFILE_NAME)).toBeVisible();

    const allLabels = await page.locator(".tree-explorer-viewlet-tree-view .monaco-highlighted-label").allTextContents();
    const profileNames = allLabels.map((s) => s.trim()).filter((name) => expectedProfileOrder.includes(name));
    expect(profileNames).toEqual(expectedProfileOrder);
  });

  test("should open team config file for edit profile", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Manage Profile");
    await findAndClickText(page, "Edit Profile");

    await expect(page.getByRole("tab", { name: `${constants.ZOWE_CONFIG_FILE_NAME}, preview` })).toBeVisible();
    await expect(page.getByLabel(`~/workspace/${constants.ZOWE_CONFIG_FILE_NAME}`).getByText(constants.ZOWE_CONFIG_FILE_NAME)).toBeVisible();
    await expect(page.getByRole("code").locator("div").filter({ hasText: '"type": "zosmf"' }).nth(4)).toBeVisible();
  });

  test("should open team config file for delete profile", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Manage Profile");
    await findAndClickText(page, "Delete Profile");

    await expect(page.getByRole("tab", { name: `${constants.ZOWE_CONFIG_FILE_NAME}, preview` })).toBeVisible();
    await expect(page.getByLabel(`~/workspace/${constants.ZOWE_CONFIG_FILE_NAME}`).getByText(constants.ZOWE_CONFIG_FILE_NAME)).toBeVisible();
    await expect(page.getByRole("code").locator("div").filter({ hasText: '"type": "zosmf"' }).nth(4)).toBeVisible();
  });

  test("should prompt for credentials when choosing update credentials", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Manage Profile");
    await findAndClickText(page, "Update Credentials");

    await expect(page.getByRole("textbox", { name: "User Name" })).toBeVisible();
    await page.getByRole("textbox", { name: "User Name" }).fill("MYUSER");
    await page.keyboard.press("Enter");

    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible();
    await page.getByRole("textbox", { name: "Password" }).fill("MYPASS");
    await page.keyboard.press("Enter");

    await expect(page.getByText(`Credentials updated for profile ${constants.PROFILE_NAME}`, { exact: true })).toBeVisible();
  });

  test("Should show the profile in correct order", async ({ page }) => {
    await expect(getTreeItem(page, constants.ACE_PROFILE_NAME)).toBeVisible();

    const allLabels = await page.locator(".tree-explorer-viewlet-tree-view .monaco-highlighted-label").allTextContents();
    const profileNames = allLabels.map((s) => s.trim()).filter((name) => expectedProfileOrder.includes(name));
    expect(profileNames).toEqual(expectedProfileOrder);
  });
});

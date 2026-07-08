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

import { Page, expect, test } from "@playwright/test";
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

async function openResourceInspector(page: Page, resourceType: string, resourceName: string, notificationName?: string) {
  await findAndClickTreeItem(page, constants.PROFILE_NAME);
  await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
  await findAndClickTreeItem(page, constants.REGION_NAME);
  await findAndClickTreeItem(page, resourceType);

  await findAndClickTreeItem(page, resourceName);
  await findAndClickTreeItem(page, resourceName, "right", false);
  await page.waitForTimeout(200);
  await findAndClickText(page, "Inspect Resource");

  await waitForNotification(page, `Loading CICS resource '${notificationName ?? resourceName}'...`);
}

async function openContextMenu(page: Page) {
  const contextMenuButton = getResourceInspector(page).locator(".codicon.codicon-kebab-vertical").first();
  await expect(contextMenuButton).toBeVisible({ timeout: 10000 });
  await contextMenuButton.click();
  await page.waitForTimeout(200);
}

test.setTimeout(60 * 1000);

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("Resource Inspector Actions - Library", () => {

  test("should disable then enable MYLIB1 from Resource Inspector", async ({ page }) => {
    // Open MYLIB1 (ENABLED) in the Resource Inspector
    await openResourceInspector(page, "Libraries", constants.LIBRARY_1_NAME);

    // Verify initial state shows ENABLED
    await expect(getResourceInspector(page).getByText("Status: ENABLED")).toBeVisible();

    // --- Disable ---
    await openContextMenu(page);
    await getResourceInspector(page).getByText("Disable Library", { exact: true }).click();

    // RI refreshes automatically (refreshResourceInspector defaults to true for library actions)
    // Assert the RI panel now shows the library as DISABLED
    await expect(getResourceInspector(page).getByText("Status: DISABLED")).toBeVisible({ timeout: 10000 });

    // --- Enable ---
    await openContextMenu(page);
    await getResourceInspector(page).getByText("Enable Library", { exact: true }).click();

    // Assert the RI panel shows ENABLED again
    await expect(getResourceInspector(page).getByText("Status: ENABLED")).toBeVisible({ timeout: 10000 });
  });

  test("should show Compare to option for library in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Libraries", constants.LIBRARY_1_NAME);

    await openContextMenu(page);
    await expect(getResourceInspector(page).getByText("Compare to...", { exact: true })).toBeVisible();
  });
});

test.describe("Resource Inspector Actions - Task", () => {
  test("should purge task from Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Tasks", constants.TASK_1_NAME, "00001");

    await openContextMenu(page);
    await getResourceInspector(page).getByText("Purge Task", { exact: true }).click();

    // Confirmation dialog must offer both Purge and Force Purge options
    await expect(page.getByRole("button", { name: "Purge", exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: "Force Purge", exact: true })).toBeVisible({ timeout: 5000 });

    // Choose "Purge" — wiremock scenario transitions to task-purged state
    await page.getByRole("button", { name: "Purge", exact: true }).click();

    // After a successful purge the tree refreshes and the task is no longer listed
    await expect(getTreeItem(page, constants.TASK_1_NAME)).not.toBeVisible({ timeout: 10000 });
  });

  test("should show Inquire Transaction action for task in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Tasks", constants.TASK_1_NAME, "00001");

    await openContextMenu(page);
    await getResourceInspector(page).getByText("Inquire Transaction", { exact: true }).click();

    // Inquire Transaction navigates to the Transactions tree for the associated tranid (CEMT)
    await expect(getTreeItem(page, "Transactions")).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(500);
  });

  test("should show Compare to option for task in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Tasks", constants.TASK_1_NAME, "00001");

    await openContextMenu(page);
    await expect(getResourceInspector(page).getByText("Compare to...", { exact: true })).toBeVisible();
  });
});

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
  prepareZoweExplorerView,
  resetWiremock,
  resetZoweExplorerView,
} from "../utils/helpers";

async function openResourceInspector(page: Page, resourceType: string, resourceName: string) {
  await findAndClickTreeItem(page, constants.PROFILE_NAME);
  await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
  await findAndClickTreeItem(page, constants.REGION_NAME);
  await findAndClickTreeItem(page, resourceType);

  await findAndClickTreeItem(page, resourceName);
  await findAndClickTreeItem(page, resourceName, "right", false);
  await page.waitForTimeout(200);
  await findAndClickText(page, "Inspect Resource");

  await page.waitForTimeout(3000);
}

async function openContextMenu(page: Page) {
  const contextMenuButton = getResourceInspector(page).locator(".codicon.codicon-kebab-vertical").first();
  await expect(contextMenuButton).toBeVisible({ timeout: 10000 });
  await contextMenuButton.click();
  await page.waitForTimeout(200);
}

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("Resource Inspector Actions - Library", () => {
  test("should display Disable Library action in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Libraries", constants.LIBRARY_1_NAME);
    await getResourceInspector(page).getByText("Status:", { exact: false }).waitFor({ timeout: 30000 });
    await openContextMenu(page);

    const disableLibraryAction = getResourceInspector(page).getByText("Disable Library", { exact: true });
    await expect(disableLibraryAction).toBeVisible();
    await disableLibraryAction.click();

    await page.waitForTimeout(500);
  });

  test("should display Enable Library action in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Libraries", constants.LIBRARY_2_NAME);
    await getResourceInspector(page).getByText("Status:", { exact: false }).waitFor({ timeout: 30000 });
    await openContextMenu(page);

    const enableLibraryAction = getResourceInspector(page).getByText("Enable Library", { exact: true });
    await expect(enableLibraryAction).toBeVisible();
    await enableLibraryAction.click();

    await page.waitForTimeout(500);
  });
});

test.describe("Resource Inspector Actions - Task", () => {
  test("should display Purge Task action in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Tasks", constants.TASK_1_NAME);
    await getResourceInspector(page).getByText("Run Status:", { exact: false }).waitFor({ timeout: 30000 });
    await openContextMenu(page);

    const purgeTask = getResourceInspector(page).getByText("Purge Task", { exact: true });
    await expect(purgeTask).toBeVisible();
    await purgeTask.click();

    await page.waitForTimeout(500);
  });

  test("should display Inquire Transaction action in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Tasks", constants.TASK_1_NAME);
    await getResourceInspector(page).getByText("Run Status:", { exact: false }).waitFor({ timeout: 30000 });
    await openContextMenu(page);

    const inquireTransaction = getResourceInspector(page).getByText("Inquire Transaction", { exact: true });
    await expect(inquireTransaction).toBeVisible();
    await inquireTransaction.click();

    await page.waitForTimeout(500);
  });
});

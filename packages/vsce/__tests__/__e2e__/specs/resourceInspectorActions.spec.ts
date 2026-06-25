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
  waitForNotification,
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

  await waitForNotification(page, `Loading CICS resource '${resourceName}'...`);
}

async function openContextMenu(page: Page) {
  const contextMenuButton = getResourceInspector(page).locator('button[aria-label="Actions"]');
  await expect(contextMenuButton).toBeVisible();
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
  test("should display Enable Library action in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Libraries", constants.LIBRARY_1_NAME);
    await getResourceInspector(page).getByText(`${constants.LIBRARY_1_NAME}(Library)`).waitFor();
    await openContextMenu(page);

    await expect(getResourceInspector(page).getByText("Enable Library", { exact: true })).toBeVisible();
  });

  test("should display Disable Library action in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Libraries", constants.LIBRARY_1_NAME);
    await getResourceInspector(page).getByText(`${constants.LIBRARY_1_NAME}(Library)`).waitFor();
    await openContextMenu(page);

    await expect(getResourceInspector(page).getByText("Disable Library", { exact: true })).toBeVisible();
  });
});

test.describe("Resource Inspector Actions - Task", () => {
  const TASK_NAME = "00001";

  test("should display Purge Task action in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Tasks", TASK_NAME);
    await getResourceInspector(page).getByText(`${TASK_NAME}(Task)`).waitFor();
    await openContextMenu(page);

    await expect(getResourceInspector(page).getByText("Purge Task", { exact: true })).toBeVisible();
  });

  test("should display Inquire Transaction action in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Tasks", TASK_NAME);
    await getResourceInspector(page).getByText(`${TASK_NAME}(Task)`).waitFor();
    await openContextMenu(page);

    await expect(getResourceInspector(page).getByText("Inquire Transaction", { exact: true })).toBeVisible();
  });
});

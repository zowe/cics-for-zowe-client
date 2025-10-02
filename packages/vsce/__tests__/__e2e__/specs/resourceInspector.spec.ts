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
import { constants, findAndClickText, findAndClickTreeItem, getResourceInspector, prepareZoweExplorerView, resetWiremock, resetZoweExplorerView } from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("Resource Inspector tests", async () => {
  test("should inspect a program resource", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right");
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");

    await getResourceInspector(page).locator("#th-1").waitFor();
    await expect(getResourceInspector(page).locator("th").first()).toHaveText(new RegExp(constants.PROGRAM_1_NAME));
  });

  test("should have a filterable table", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right");
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");

    await getResourceInspector(page).locator("#th-1").waitFor();
    await expect(getResourceInspector(page).getByText("cedfstatus")).toBeDefined();

    await getResourceInspector(page).locator("input").first().fill("library");
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/1.png" });
    await expect(getResourceInspector(page).locator("input").first()).toHaveValue("library");
    await expect(getResourceInspector(page).locator("th").first()).toHaveText(new RegExp(constants.PROGRAM_1_NAME));
  });

  test("should show loading message", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right");
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");

    await expect(page.getByText(`Loading CICS resource '${constants.PROGRAM_1_NAME}'...`, { exact: true })).toBeVisible();
  });
});

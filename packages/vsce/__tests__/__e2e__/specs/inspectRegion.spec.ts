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
  findAndClickText,
  findAndClickTreeItem,
  getResourceInspector,
  getTreeItem,
  prepareZoweExplorerView,
  resetWiremock,
  resetZoweExplorerView,
  runInCommandPalette,
  waitForNotification,
} from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});
test.describe("Inspect Region tests", async () => {
  test("should have a filterable table", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await expect(getTreeItem(page, constants.REGION_NAME)).toBeVisible();
    await findAndClickTreeItem(page, constants.REGION_NAME, "right", false);
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Region");

    await waitForNotification(page, `Loading CICS resource '${constants.REGION_NAME}'...`);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/inspectRegion/3.png" });

    await getResourceInspector(page).getByText("MYREG1(Region)").waitFor();
    await expect(getResourceInspector(page).getByText("MYREG1(Region)")).toBeVisible();

    await getResourceInspector(page).locator("input").first().fill("name");
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/inspectRegion/2.png" });
    await expect(getResourceInspector(page).locator("input").first()).toHaveValue("name");
    await expect(getResourceInspector(page).getByRole("cell", { name: "MYREG1" })).toHaveText(new RegExp(constants.REGION_NAME));
  });

  test("Should open inspect Region from command palette", async ({ page }) => {
    await runInCommandPalette(page, "Zowe Explorer for IBM CICS TS: Inspect CICS Region");
    await page.getByRole("option", { name: "wiremock_localhost" }).click();
    await page.getByRole("option", { name: constants.CICSPLEX_NAME }).click();
    await page.getByRole("option", { name: constants.REGION_NAME }).click();
    await page.keyboard.press("Enter");

    await getResourceInspector(page).getByText("MYREG1(Region)").waitFor();
    await expect(getResourceInspector(page).getByText("MYREG1(Region)")).toBeVisible();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/inspectRegion/4.png" });
    await expect(getResourceInspector(page).getByText("CICS Name: MYREG1")).toBeVisible();
  });
});

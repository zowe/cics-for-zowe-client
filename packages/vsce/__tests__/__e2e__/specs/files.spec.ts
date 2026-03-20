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

test.describe("LocalFile tests", () => {
  test("should enable and disable a local file", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Files");

    await expect(getTreeItem(page, constants.LOCAL_FILE_1_NAME)).toHaveText(constants.LOCAL_FILE_1_NAME);
    await expect(getTreeItem(page, constants.LOCAL_FILE_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.REMOTE_FILE_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.REMOTE_FILE_1_NAME)).toHaveText(constants.REMOTE_FILE_1_NAME);

    await findAndClickTreeItem(page, constants.LOCAL_FILE_1_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Disable Local File");

    await expect(page.getByRole("button", { name: "Wait", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Wait", exact: true }).click();

    await expect(getTreeItem(page, `${constants.LOCAL_FILE_1_NAME} (Disabled)`)).toHaveText(`${constants.LOCAL_FILE_1_NAME} (Disabled)`);

    await findAndClickTreeItem(page, `${constants.LOCAL_FILE_1_NAME} (Disabled)`, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Enable Local File");

    await expect(getTreeItem(page, constants.LOCAL_FILE_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.LOCAL_FILE_1_NAME)).toHaveText(constants.LOCAL_FILE_1_NAME);
  });
  test("should disable the local-file action when a CICS Local File is Un-enabled", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Files");

    await findAndClickTreeItem(page, constants.LOCAL_FILE_1_NAME, "right");
    await page.waitForTimeout(200);
    await findAndClickText(page, "Close Local File");

    await expect(page.getByRole("button", { name: "Wait", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Wait", exact: true }).click();
    await page.waitForTimeout(200);

    await expect(getTreeItem(page, `${constants.LOCAL_FILE_1_NAME} (Unenabled) (Closed)`)).toHaveText(
      `${constants.LOCAL_FILE_1_NAME} (Unenabled) (Closed)`
    );

    await findAndClickTreeItem(page, `${constants.LOCAL_FILE_1_NAME} (Unenabled) (Closed)`, "right");
    await page.waitForTimeout(200);
    await expect(page.getByRole("menuitem", { name: "Enable Local File" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Disable Local File" })).toBeVisible();
    await page.keyboard.press("Escape");
  });
});

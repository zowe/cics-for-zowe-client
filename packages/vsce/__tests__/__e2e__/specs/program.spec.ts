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
  getClipboardContent,
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

test.describe("Program tests", () => {
  test("should enable and disable a program", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await expect(getTreeItem(page, constants.PROGRAM_1_NAME)).toHaveText(constants.PROGRAM_1_NAME);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/enable-disable-program/1.png" });
    await expect(getTreeItem(page, constants.PROGRAM_1_NAME)).toBeVisible();

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right");

    await page.waitForTimeout(200);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/enable-disable-program/1.5.png" });
    await findAndClickText(page, "Disable Program");

    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/enable-disable-program/2.png" });
    await expect(getTreeItem(page, `${constants.PROGRAM_1_NAME} (Disabled)`)).toHaveText(`${constants.PROGRAM_1_NAME} (Disabled)`);

    await findAndClickTreeItem(page, `${constants.PROGRAM_1_NAME} (Disabled)`, "right");

    await page.waitForTimeout(200);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/enable-disable-program/3.png" });
    await findAndClickText(page, "Enable Program");

    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/enable-disable-program/4.png" });
    await expect(getTreeItem(page, constants.PROGRAM_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.PROGRAM_1_NAME)).toHaveText(constants.PROGRAM_1_NAME);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/enable-disable-program/5.png" });
  });

  test("should new copy a program", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/newcopy-program/1.png" });
    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right");

    await page.waitForTimeout(200);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/newcopy-program/2.png" });
    await findAndClickText(page, "New Copy");

    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/newcopy-program/3.png" });
    await expect(getTreeItem(page, `${constants.PROGRAM_1_NAME} (New copy count: 1)`, false)).toHaveCount(1);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/newcopy-program/4.png" });
  });

  test("should show library for program", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Show Library");

    await expect(getTreeItem(page, `${constants.LIBRARY_1_NAME} (DSNAME='MYLIBDS1') AND (LIBRARY='${constants.LIBRARY_1_NAME}')`, false)).toHaveCount(
      1
    );
    await expect(getTreeItem(page, constants.LIBRARY_DS_1_NAME)).toHaveCount(1);
  });

  test("should copy program name", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");

    await expect(getTreeItem(page, constants.PROGRAM_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.PROGRAM_1_NAME)).toHaveText(constants.PROGRAM_1_NAME);

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Copy Name");
    await page.waitForTimeout(200);

    const resNameInClipboard = await getClipboardContent(page);
    expect(resNameInClipboard).toEqual("MYPROG1");
  });
});

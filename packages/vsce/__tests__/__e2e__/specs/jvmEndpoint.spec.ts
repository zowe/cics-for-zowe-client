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

test.describe("JVM Endpoint tests", () => {
  test("should enable and disable a jvm endpoint", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "JVM Servers");
    await findAndClickTreeItem(page, constants.JVM_SERVER_1_NAME);
    await findAndClickTreeItem(page, constants.JVM_ENDPOINT_1_NAME);

    await expect(getTreeItem(page, constants.JVM_ENDPOINT_1_NAME)).toHaveText(constants.JVM_ENDPOINT_1_NAME);
    await expect(getTreeItem(page, constants.JVM_ENDPOINT_1_NAME)).toBeVisible();

    await findAndClickTreeItem(page, constants.JVM_ENDPOINT_1_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Disable JVM Endpoint");

    await page.waitForTimeout(200);
    await expect(getTreeItem(page, `${constants.JVM_ENDPOINT_1_NAME} (Disabled)`)).toHaveText("MYJVMENDPOINT1 (9080) (Disabled)");

    await findAndClickTreeItem(page, `${constants.JVM_ENDPOINT_1_NAME} (Disabled)`, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Enable JVM Endpoint");

    await page.waitForTimeout(200);
    await expect(getTreeItem(page, constants.JVM_ENDPOINT_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.JVM_ENDPOINT_1_NAME)).toHaveText("MYJVMENDPOINT1 (9080)");
  });
});

test.describe("JVM Endpoint should be visible from plex-level", () => {
  test("All JVM Servers should be visible", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.ALL_JVM_SERVERS);

    const filterButton = page.getByRole("button", { name: "Filter Resources", exact: true });
    await expect(filterButton).toBeVisible();
    await filterButton.click();

    const textBox = page.getByRole("textbox", { name: "Select a Filter", exact: true });
    await expect(textBox).toBeEditable();
    await textBox.fill("MYJVM1");
    await textBox.press("Enter");
    await page.waitForTimeout(200);

    await expect(getTreeItem(page, constants.ALL_JVMSERVER_NAME1)).toBeVisible();
    await expect(getTreeItem(page, constants.ALL_JVMSERVER_NAME2)).toBeVisible();
  });

  test("JVM Server has correct JVM Endpoint", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.ALL_JVM_SERVERS);

    const filterButton = page.getByRole("button", { name: "Filter Resources", exact: true });
    await expect(filterButton).toBeVisible();
    await filterButton.click();

    const textBox = page.getByRole("textbox", { name: "Select a Filter", exact: true });
    await expect(textBox).toBeEditable();
    await textBox.fill("MYJVM1");
    await textBox.press("Enter");
    await page.waitForTimeout(200);

    await expect(getTreeItem(page, constants.ALL_JVMSERVER_NAME1)).toBeVisible();
    await page.waitForTimeout(200);
    await page.getByRole("treeitem", { name: "MYJVM1 (MYREG1)" }).click();
    await expect(getTreeItem(page, constants.JVM_ENDPOINT_1_NAME)).toBeVisible();
  });
});

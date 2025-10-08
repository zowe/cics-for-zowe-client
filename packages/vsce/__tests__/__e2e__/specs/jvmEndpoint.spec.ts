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
import { constants, findAndClickTreeItem, getTreeItem, prepareZoweExplorerView, resetWiremock, resetZoweExplorerView, findAndClickText } from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("JVM Endpoint tests", () => {

  test("should expand JVM server tree to reveal JVM endpoint", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "JVM Servers");
    await findAndClickTreeItem(page, constants.JVM_SERVER_1_NAME);

    await expect(getTreeItem(page, constants.JVM_ENDPOINT_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.JVM_ENDPOINT_1_NAME)).toHaveText("MYJVMENDPOINT1 (N/A|9080)");

  });

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
      await expect(getTreeItem(page, `${constants.JVM_ENDPOINT_1_NAME} (Disabled)`)).toHaveText("MYJVMENDPOINT1 (N/A|9080) (Disabled)");

      await findAndClickTreeItem(page, `${constants.JVM_ENDPOINT_1_NAME} (Disabled)`, "right");

      await page.waitForTimeout(200);
      await findAndClickText(page, "Enable JVM Endpoint");

      await page.waitForTimeout(200);
      await expect(getTreeItem(page, constants.JVM_ENDPOINT_1_NAME)).toBeVisible();
      await expect(getTreeItem(page, constants.JVM_ENDPOINT_1_NAME)).toHaveText("MYJVMENDPOINT1 (N/A|9080)");
  });

});
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
  waitForNotification,
} from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("Hyperlink navigation tests", async () => {
  test("should click on hyperlink and navigate to job in JOBS section", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "JVM Servers");

    await findAndClickTreeItem(page, constants.JVM_SERVER_NAME, "right");
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Resource");
    await waitForNotification(page, `Loading CICS resource '${constants.JVM_SERVER_NAME}'...`);

    await getResourceInspector(page).locator("span").filter({ hasText: constants.JVM_SERVER_NAME }).waitFor();
    await expect(getResourceInspector(page).getByText("cedfstatus")).toBeDefined();

    await getResourceInspector(page).locator("input").first().fill("LOG");
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/hyperlinks/2.png" });
    await expect(getResourceInspector(page).locator("input").first()).toHaveValue("LOG");

    const jvmlogLink = getResourceInspector(page).getByRole("cell", { name: "//DD:JVMLOG" }).getByRole("link");
    await jvmlogLink.waitFor({ state: "visible", timeout: 500 });
    await jvmlogLink.click();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/hyperlinks/3.png" });

    await page.waitForTimeout(500);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/hyperlinks/4.png" });

    const jobsTree = page.getByRole("button", { name: "Jobs Section", exact: true });
    if (await jobsTree.isVisible()) {
      const isExpanded = (await jobsTree.getAttribute("aria-expanded")) === "true";
      if (!isExpanded) {
        await jobsTree.click();
        await page.waitForTimeout(500);
      }
    }
    const zosmfWiremockItem = getTreeItem(page, constants.ZOSMF_PROFILE_NAME, false);
    await expect(zosmfWiremockItem).toBeVisible();

    await zosmfWiremockItem.click();
    await page.waitForTimeout(500);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/hyperlinks/5.png" });

    const jobItem = getTreeItem(page, "job1(jobid1) - ACTIVE", false);
    await expect(jobItem).toBeVisible();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/hyperlinks/6.png" });
  });
});

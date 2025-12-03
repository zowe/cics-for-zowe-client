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

import { expect, Page, test } from "@playwright/test";
import {
  constants,
  findAndClickText,
  findAndClickTreeItem,
  getResourceInspector,
  prepareZoweExplorerView,
  resetWiremock,
  resetZoweExplorerView,
  runInCommandPalette,
} from "../utils/helpers";

let ssCount = 1;
let testId: string;

const screenshot = async (page: Page) => {
  await page.screenshot({ fullPage: true, path: `./__tests__/screenshots/extenders-${testId}/${ssCount}.png` });
  ssCount++;
};
const ssCountReset = () => {
  ssCount = 1;
};
const setTestId = () => {
  testId = `${Math.random()}`.slice(2, 10);
};

test.beforeEach(async () => {
  setTestId();
  ssCountReset();
});

test.describe("Extender tests", () => {
  test("should install extension extending CICS", async ({ page }) => {
    await page.goto("http://localhost:1234");

    await screenshot(page);

    await page.getByLabel("Extensions").first().click();
    await screenshot(page);
    await expect(page.getByText("Zowe Explorer", { exact: true })).toBeVisible();
    await screenshot(page);
    await page.getByRole("toolbar", { name: "Extensions actions" }).getByLabel("Views and More Actions...").click();
    await screenshot(page);
    await page.waitForTimeout(200);
    await screenshot(page);
    await page.getByRole("menuitem", { name: "Install from VSIX..." }).click();
    await page.waitForTimeout(200);
    await screenshot(page);
    await expect(page.getByRole("textbox", { name: "Install from VSIX" }).first()).toBeVisible();
    await screenshot(page);
    await page
      .getByRole("textbox", { name: "Install from VSIX" })
      .first()
      .fill("/config/workspace/resources/extender-extension/cics-extension-extender-0.0.1.vsix");
    await screenshot(page);
    await page.getByRole("button", { name: "Install", exact: true }).click();
    await screenshot(page);
    await expect(page.getByText("Completed installing extension.", { exact: true })).toBeVisible();
    await screenshot(page);
    await expect(page.getByText("TEST EXTENSION ACTIVATED", { exact: true })).toBeVisible();
    await screenshot(page);
    await expect(page.getByText("Registered TEST.ACTION.1", { exact: true })).toBeVisible();
    await screenshot(page);
  });

  test("should contribute to RI actions", async ({ page, request }) => {
    await resetWiremock(request);
    await prepareZoweExplorerView(page);

    await screenshot(page);

    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Programs");
    await screenshot(page);

    await page.getByRole("button", { name: "Notifications" }).click();
    await screenshot(page);
    await page.getByRole("button", { name: "Clear All Notifications" }).click();
    await screenshot(page);
    await runInCommandPalette(page, "View: Close All Editors");
    await screenshot(page);

    await findAndClickTreeItem(page, constants.PROGRAM_1_NAME, "right");
    await page.waitForTimeout(200);
    await screenshot(page);
    await findAndClickText(page, "Inspect Resource");
    await screenshot(page);

    await getResourceInspector(page).locator("#resource-title").waitFor();
    await screenshot(page);
    await expect(getResourceInspector(page).locator("th").first()).toHaveText(new RegExp(constants.PROGRAM_1_NAME));
    await screenshot(page);

    await getResourceInspector(page).getByText("...").click();
    await page.waitForTimeout(200);
    await screenshot(page);
    await expect(getResourceInspector(page).getByText("MY TEST ACTION")).toBeVisible();
    await screenshot(page);
    await getResourceInspector(page).getByText("MY TEST ACTION").click();
    await screenshot(page);

    await expect(page.locator("h2").filter({ hasText: "Get Started with VS Code for the Web" })).toBeVisible();
    await screenshot(page);

    await page.getByLabel("Extensions").first().click();
    await screenshot(page);
    await expect(page.getByText("cics-extension-extender", { exact: true })).toBeVisible();
    await screenshot(page);
    await page.getByRole("listitem", { name: "cics-extension-extender, 0.0." }).getByLabel("Manage").click();
    await page.waitForTimeout(200);
    await screenshot(page);
    await expect(page.getByText("Uninstall", { exact: true })).toBeVisible();
    await screenshot(page);
    await page.getByRole("menuitem", { name: "Uninstall" }).click();
    await screenshot(page);

    await page.getByRole("tab", { name: "Zowe Explorer" }).locator("a").click();
    await screenshot(page);
    await resetZoweExplorerView(page);
    await screenshot(page);
  });
});

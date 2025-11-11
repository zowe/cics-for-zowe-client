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
import { constants, findAndClickTreeItem, getTreeItem, prepareZoweExplorerView, resetWiremock, resetZoweExplorerView} from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("Bundle tests", () => {
  test("should expand bundle tree to reveal bundles", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Bundles");

    await expect(getTreeItem(page, constants.BUNDLE_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.BUNDLE_1_NAME)).toHaveText(constants.BUNDLE_1_NAME);
  });

  test("should trigger show bundle directory command and select USS profile", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "Bundles");

    await expect(getTreeItem(page, constants.BUNDLE_1_NAME)).toBeVisible();
    await findAndClickTreeItem(page, constants.BUNDLE_1_NAME, "right");

    // Verify "Show Bundle Directory" context menu option appears
    const showBundleDirOption = page.getByText("Show Bundle Directory");
    await expect(showBundleDirOption).toBeVisible();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/show-bundle-dir/1.png" });
    await showBundleDirOption.click();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/show-bundle-dir/2.png" });

    // verify USS profile node to appear in the tree (with "Profile: " prefix)
    const ussProfileNodeName = `Profile: ${constants.ZOSMF_PROFILE_NAME}`;
    const ussProfileNode = getTreeItem(page, ussProfileNodeName, false);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/show-bundle-dir/3.png" });
    await expect(ussProfileNode).toBeVisible();

    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/show-bundle-dir/4.png" });

    // Verify the USS path is visible
    const bundlePathElement = page.getByText(`${constants.BUNDLE_1_USS_PATH}`);
    await expect(bundlePathElement).toBeVisible();

    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/show-bundle-dir/5.png" });

    // Wait for bundle contents to load with increased timeout for API call and tree rendering
    await expect(page.getByText("test_app-0.0.1-SNAPSHOT.war", { exact: true })).toBeVisible();
    await expect(page.getByText("test_app-0.0.1-SNAPSHOT.warbundle", { exact: true })).toBeVisible();
    
    });
});

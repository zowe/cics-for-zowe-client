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
} from "../utils/helpers";

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
    await expect(getTreeItem(page, constants.REGION_NAME)).toBeVisible();
    await findAndClickTreeItem(page, constants.REGION_NAME, "right", false);
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Region");

    await getResourceInspector(page).locator("#resource-title").waitFor();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/resourceInspector/1.png" });
    await expect(getResourceInspector(page).locator("th").first()).toHaveText(new RegExp(constants.REGION_NAME));
  });
});

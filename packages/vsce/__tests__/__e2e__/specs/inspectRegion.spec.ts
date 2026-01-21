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
  test("should inspect a region", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await expect(getTreeItem(page, constants.REGION_NAME)).toBeVisible();
    await findAndClickTreeItem(page, constants.REGION_NAME, "right", false);
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Region");

    await getResourceInspector(page).locator("#resource-title").waitFor();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/inspectRegion/1.png" });
    await expect(getResourceInspector(page).locator("th").first()).toHaveText(new RegExp(constants.REGION_NAME));
  });
  test("should have a filterable table", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await expect(getTreeItem(page, constants.REGION_NAME)).toBeVisible();
    await findAndClickTreeItem(page, constants.REGION_NAME, "right", false);
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Region");

    await getResourceInspector(page).locator("#resource-title").waitFor();
    await expect(getResourceInspector(page).getByText("cedfstatus")).toBeDefined();

    await getResourceInspector(page).locator("input").first().fill("name");
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/inspectRegion/2.png" });
    await expect(getResourceInspector(page).locator("input").first()).toHaveValue("name");
    await expect(getResourceInspector(page).locator("th").first()).toHaveText(new RegExp(constants.REGION_NAME));
  });
  test("should show loading message", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await expect(getTreeItem(page, constants.REGION_NAME)).toBeVisible();
    await findAndClickTreeItem(page, constants.REGION_NAME, "right", false);
    await page.waitForTimeout(200);
    await findAndClickText(page, "Inspect Region");

    await waitForNotification(page, `Loading CICS resource '${constants.REGION_NAME}'...`);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/inspectRegion/3.png" });
  });
  test("Should open inspect Region from command palette", async ({ page }) => {
    await runInCommandPalette(page, "Zowe Explorer for IBM CICS TS: Inspect Region");
    await page.getByRole("option", { name: "wiremock_localhost" }).click();
    await page.getByRole("option", { name: constants.CICSPLEX_NAME }).click();
    await page.getByRole("textbox", { name: "Region name" }).fill("MYREG1");
    await page.keyboard.press("Enter");

    await getResourceInspector(page).locator("#resource-title").waitFor();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/inspectRegion/4.png" });
    await expect(getResourceInspector(page).locator("th").first()).toHaveText(new RegExp(constants.REGION_NAME));
  });
});

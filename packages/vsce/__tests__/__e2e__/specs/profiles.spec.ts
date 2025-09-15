import { expect, test } from "@playwright/test";
import { constants, findAndClickText, findAndClickTreeItem, getTreeItem, prepareZoweExplorerView, resetWiremock, resetZoweExplorerView } from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("Profile tests", () => {
  test("should hide profile from tree", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Manage Profile");
    await findAndClickText(page, "Hide Profile");

    await expect(getTreeItem(page, constants.PROFILE_NAME)).toHaveCount(0);
  });

  test("should add profile to tree", async ({ page }) => {
    await expect(getTreeItem(page, constants.PROFILE_NAME)).toHaveCount(0);

    await page.locator(".tree-explorer-viewlet-tree-view").first().click();
    await expect(page.getByRole("button", { name: "Create a CICS Profile" })).toBeVisible();
    await page.getByRole("button", { name: "Create a CICS Profile" }).click();

    await page.waitForTimeout(200);

    await findAndClickText(page, constants.PROFILE_NAME);
    await expect(getTreeItem(page, constants.PROFILE_NAME)).toBeVisible();
  });

  test("should open team config file for edit profile", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Manage Profile");
    await findAndClickText(page, "Edit Profile");

    await expect(page.getByRole("tab", { name: `${constants.ZOWE_CONFIG_FILE_NAME}, preview` })).toBeVisible();
    await expect(page.getByLabel(`~/workspace/${constants.ZOWE_CONFIG_FILE_NAME}`).getByText(constants.ZOWE_CONFIG_FILE_NAME)).toBeVisible();
    await expect(page.getByRole("code").locator("div").filter({ hasText: '"type": "zosmf"' }).nth(4)).toBeVisible();
  });

  test("should open team config file for delete profile", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Manage Profile");
    await findAndClickText(page, "Delete Profile");

    await expect(page.getByRole("tab", { name: `${constants.ZOWE_CONFIG_FILE_NAME}, preview` })).toBeVisible();
    await expect(page.getByLabel(`~/workspace/${constants.ZOWE_CONFIG_FILE_NAME}`).getByText(constants.ZOWE_CONFIG_FILE_NAME)).toBeVisible();
    await expect(page.getByRole("code").locator("div").filter({ hasText: '"type": "zosmf"' }).nth(4)).toBeVisible();
  });
});

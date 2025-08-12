import { test, expect } from '@playwright/test';
import { PROFILE_NAME, getTree, getTreeItem, isTreeItemExpanded } from "../playwright-utils/utils";

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:1234');

  await page.getByRole('tab', { name: 'Zowe Explorer' }).locator('a').click();

  const dsTree = getTree(page, 'Data Sets Section');
  const ussTree = getTree(page, 'Unix System Services (USS) Section');
  const jobTree = getTree(page, 'Jobs Section');

  if (await isTreeItemExpanded(dsTree)) {
    await dsTree.click();
  }
  if (await isTreeItemExpanded(ussTree)) {
    await ussTree.click();
  }
  if (await isTreeItemExpanded(jobTree)) {
    await jobTree.click();
  }
});

test.afterEach(async ({ page }) => {
  const profileTreeItem = getTreeItem(page, PROFILE_NAME);
  if (await profileTreeItem.isVisible() && await isTreeItemExpanded(profileTreeItem)) {
    await profileTreeItem.click();
  }

  const dsTree = getTree(page, 'Data Sets Section');
  const ussTree = getTree(page, 'Unix System Services (USS) Section');
  const jobTree = getTree(page, 'Jobs Section');

  if (!await isTreeItemExpanded(dsTree)) {
    await dsTree.click();
  }
  if (!await isTreeItemExpanded(ussTree)) {
    await ussTree.click();
  }
  if (!await isTreeItemExpanded(jobTree)) {
    await jobTree.click();
  }
});


test.describe("Profile tests", () => {

  test("should hide profile from tree", async ({ page }) => {
    await expect(getTreeItem(page, PROFILE_NAME)).toBeVisible();
    await getTreeItem(page, PROFILE_NAME).click({ button: "right" });

    await page.waitForTimeout(200);
    await page.getByText("Manage Profile", { exact: true }).click();
    await page.waitForTimeout(200);

    await page.getByText("Hide Profile").click();
    await expect(getTreeItem(page, PROFILE_NAME)).toHaveCount(0);
  });

  test("should add profile to tree", async ({ page }) => {
    await expect(getTreeItem(page, PROFILE_NAME)).toHaveCount(0);

    await page.locator('.tree-explorer-viewlet-tree-view').first().click();
    await page.getByRole('button', { name: 'Create a CICS Profile' }).click();

    await page.waitForTimeout(200);

    await page.getByText(PROFILE_NAME, { exact: true }).click();
    await expect(getTreeItem(page, PROFILE_NAME)).toBeVisible();
  });

  test("should open team config file for edit profile", async ({ page }) => {
    await expect(getTreeItem(page, PROFILE_NAME)).toBeVisible();
    await getTreeItem(page, PROFILE_NAME).click({ button: "right" });

    await page.waitForTimeout(200);
    await page.getByText("Manage Profile", { exact: true }).click();
    await page.waitForTimeout(200);

    await page.getByText("Edit Profile").click();

    await expect(page.getByRole('tab', { name: 'zowe.config.json, preview' })).toBeVisible();
    await expect(page.getByLabel('~/workspace/zowe.config.json').getByText('zowe.config.json')).toBeVisible();
    await expect(page.getByRole('code').locator('div').filter({ hasText: '"type": "zosmf"' }).nth(4)).toBeVisible();
  });

  test("should open team config file for delete profile", async ({ page }) => {
    await expect(getTreeItem(page, PROFILE_NAME)).toBeVisible();
    await getTreeItem(page, PROFILE_NAME).click({ button: "right" });

    await page.waitForTimeout(200);
    await page.getByText("Manage Profile", { exact: true }).click();
    await page.waitForTimeout(200);

    await page.getByText("Delete Profile").click();

    await expect(page.getByRole('tab', { name: 'zowe.config.json, preview' })).toBeVisible();
    await expect(page.getByLabel('~/workspace/zowe.config.json').getByText('zowe.config.json')).toBeVisible();
    await expect(page.getByRole('code').locator('div').filter({ hasText: '"type": "zosmf"' }).nth(4)).toBeVisible();
  });

});
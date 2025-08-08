import { test, expect, Page, Locator } from '@playwright/test';

const PROFILE_NAME = "wiremock_localhost";

const getTree = (page: Page, exactText: string) => {
  return page.getByRole('button', { name: exactText, exact: true });
};

const getTreeItem = (page: Page, exactText: string) => {
  return page.getByRole('treeitem', { name: exactText, exact: true });
};

const isTreeItemExpanded = async (treeItem: Locator) => {
  return await treeItem.getAttribute("aria-expanded") === "true";
};

test.beforeEach(async ({ page, request }) => {
  const response = await request.post(`http://localhost:8080/__admin/scenarios/reset`, {});
  expect(response.ok()).toBeTruthy();

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
  if (await isTreeItemExpanded(profileTreeItem)) {
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


test.describe("Program tests", () => {

  test("should expand programs tree to reveal programs", async ({ page }) => {
    await getTreeItem(page, PROFILE_NAME).click();
    await getTreeItem(page, 'CICSEX61').click();
    await getTreeItem(page, 'IYCWENK1').click();
    await getTreeItem(page, 'Programs').click();
    await expect(getTreeItem(page, 'IBMRLIB1')).toHaveAttribute("aria-label", "IBMRLIB1 ");
  });
  test("should enable and disable a program", async ({ page }) => {
    await getTreeItem(page, PROFILE_NAME).click();
    await getTreeItem(page, 'CICSEX61').click();
    await getTreeItem(page, 'IYCWENK1').click();
    await getTreeItem(page, 'Programs').click();
    await expect(getTreeItem(page, 'C128N')).toHaveAttribute("aria-label", "C128N ");
    await getTreeItem(page, "C128N").click({ button: "right" });

    await page.waitForTimeout(200);
    await page.getByText("Disable Program").click();

    await expect(getTreeItem(page, 'C128N (Disabled)')).toHaveAttribute("aria-label", "C128N (Disabled) ");

    await getTreeItem(page, "C128N (Disabled)").click({ button: "right" });

    await page.waitForTimeout(200);
    await page.getByText("Enable Program").click();

    await expect(getTreeItem(page, 'C128N')).toHaveAttribute("aria-label", "C128N ");
  });
});
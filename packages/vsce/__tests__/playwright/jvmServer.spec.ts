import { test, expect } from '@playwright/test';
import { PROFILE_NAME, getTree, getTreeItem, isTreeItemExpanded } from "../playwright-utils/utils";
import { WireMock } from 'wiremock-captain';
import { mockJVMServers } from '../playwright-utils/mocks/programs';

const wiremock = new WireMock("http://localhost:8080");

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

  await wiremock.clearAllExceptDefault();
  await wiremock.resetAllScenarios();
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


test.describe("JVM server tests", () => {

  test("should expand JVM servers tree to reveal JVM servers", async ({ page }) => {

    await mockJVMServers(wiremock);

    await getTreeItem(page, PROFILE_NAME).click();
    await getTreeItem(page, 'CICSEX61').click();
    await getTreeItem(page, '2PRGTST').click();
    await getTreeItem(page, 'JVM Servers').click();
    await expect(getTreeItem(page, 'EYUCMCIJ')).toHaveAttribute("aria-label", "EYUCMCIJ ");
  });

});

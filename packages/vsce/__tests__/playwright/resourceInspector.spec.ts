import { test, expect } from '@playwright/test';
import { PROFILE_NAME, getTree, getTreeItem, isTreeItemExpanded } from "../playwright-utils/utils";
import { WireMock } from 'wiremock-captain';
import { mockFetchOneProgram, mockPrograms } from '../playwright-utils/mocks/programs';

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

test('Resource Inspector on Program', async ({ page }) => {

  await mockPrograms(wiremock);
  await mockFetchOneProgram(wiremock, "C128N");

  await getTreeItem(page, 'wiremock_localhost').click();
  await getTreeItem(page, 'CICSEX61').click();
  await getTreeItem(page, '2PRGTST').click();
  await getTreeItem(page, 'Programs').click();
  await getTreeItem(page, 'C128N').click({ button: "right" });

  await page.waitForTimeout(200);
  await page.getByText("Inspect Resource").click();

  await page.frameLocator('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]').frameLocator("#active-frame").locator("#th-1").waitFor();
  await expect(page.frameLocator('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]').frameLocator("#active-frame").getByText("cedfstatus")).toBeDefined();

  await page.frameLocator('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]').frameLocator("#active-frame").locator("input").first().fill("library");
  await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/1.png" });
  await expect(page.frameLocator('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]').frameLocator("#active-frame").locator("input").first()).toHaveValue("library");
  await expect(page.frameLocator('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]').frameLocator("#active-frame").locator("th").first()).toHaveText(/C128N/);
});;

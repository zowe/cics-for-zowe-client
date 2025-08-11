import { test, expect } from '@playwright/test';
import { PROFILE_NAME, getTree, getTreeItem, isTreeItemExpanded } from "../playwright-utils/utils";
import { WireMock } from 'wiremock-captain';
import { mockEnableDisableProgram, mockNewCopyProgram, mockPrograms } from '../playwright-utils/mocks/programs';

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


test.describe("Program tests", () => {

  test("should expand programs tree to reveal programs", async ({ page }) => {

    await mockPrograms(wiremock);

    await getTreeItem(page, PROFILE_NAME).click();
    await getTreeItem(page, 'CICSEX61').click();
    await getTreeItem(page, '2PRGTST').click();
    await getTreeItem(page, 'Programs').click();
    await expect(getTreeItem(page, 'C128N')).toHaveAttribute("aria-label", "C128N ");
  });

  test("should enable and disable a program", async ({ page }) => {

    await mockPrograms(wiremock);
    await mockEnableDisableProgram(wiremock);

    await getTreeItem(page, PROFILE_NAME).click();
    await getTreeItem(page, 'CICSEX61').click();
    await getTreeItem(page, '2PRGTST').click();
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

  test("should new copy a program", async ({ page }) => {

    await mockPrograms(wiremock);
    await mockNewCopyProgram(wiremock, "DSNCUEXT");

    await getTreeItem(page, PROFILE_NAME).click();
    await getTreeItem(page, 'CICSEX61').click();
    await getTreeItem(page, '2PRGTST').click();
    await getTreeItem(page, 'Programs').click();
    await expect(getTreeItem(page, 'DSNCUEXT')).toHaveAttribute("aria-label", "DSNCUEXT ");
    await getTreeItem(page, "DSNCUEXT").click({ button: "right" });

    await page.waitForTimeout(200);
    await page.getByText("New Copy").click();

    await expect(getTreeItem(page, 'DSNCUEXT (New copy count: 1)')).toHaveAttribute("aria-label", "DSNCUEXT (New copy count: 1) ");
  });
});
import { expect, test } from "@playwright/test";
import { PROFILE_NAME, getTree, getTreeItem, isTreeItemExpanded } from "../utils/utils";

test.beforeEach(async ({ page, request }) => {
  const response = await request.post(`http://localhost:8080/__admin/scenarios/reset`, {});
  expect(response.ok()).toBeTruthy();

  await page.goto("http://localhost:1234");

  await page.getByRole("tab", { name: "Zowe Explorer" }).locator("a").click();

  const dsTree = getTree(page, "Data Sets Section");
  const ussTree = getTree(page, "Unix System Services (USS) Section");
  const jobTree = getTree(page, "Jobs Section");

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

  const dsTree = getTree(page, "Data Sets Section");
  const ussTree = getTree(page, "Unix System Services (USS) Section");
  const jobTree = getTree(page, "Jobs Section");

  if (!(await isTreeItemExpanded(dsTree))) {
    await dsTree.click();
  }
  if (!(await isTreeItemExpanded(ussTree))) {
    await ussTree.click();
  }
  if (!(await isTreeItemExpanded(jobTree))) {
    await jobTree.click();
  }
});

test.describe("Program tests", () => {
  test("should expand programs tree to reveal programs", async ({ page }) => {
    await getTreeItem(page, PROFILE_NAME).click();
    await getTreeItem(page, "MYPLEX1").click();
    await getTreeItem(page, "MYREG1").click();
    await getTreeItem(page, "Programs").click();
    await expect(getTreeItem(page, "MYPROG1")).toHaveAttribute("aria-label", "MYPROG1 ");
  });

  test("should enable and disable a program", async ({ page }) => {
    await getTreeItem(page, PROFILE_NAME).click();
    await getTreeItem(page, "MYPLEX1").click();
    await getTreeItem(page, "MYREG1").click();
    await getTreeItem(page, "Programs").click();
    await expect(getTreeItem(page, "MYPROG1")).toHaveAttribute("aria-label", "MYPROG1 ");
    await getTreeItem(page, "MYPROG1").click({ button: "right" });

    await page.waitForTimeout(200);
    await page.getByText("Disable Program").click();

    await expect(getTreeItem(page, "MYPROG1 (Disabled)")).toHaveAttribute("aria-label", "MYPROG1 (Disabled) ");

    await getTreeItem(page, "MYPROG1 (Disabled)").click({ button: "right" });

    await page.waitForTimeout(200);
    await page.getByText("Enable Program").click();

    await expect(getTreeItem(page, "MYPROG1")).toHaveAttribute("aria-label", "MYPROG1 ");
  });

  test("should new copy a program", async ({ page }) => {
    await getTreeItem(page, PROFILE_NAME).click();
    await getTreeItem(page, "MYPLEX1").click();
    await getTreeItem(page, "MYREG1").click();
    await getTreeItem(page, "Programs").click();
    await expect(getTreeItem(page, "MYPROG1")).toHaveAttribute("aria-label", "MYPROG1 ");
    await getTreeItem(page, "MYPROG1").click({ button: "right" });

    await page.waitForTimeout(200);
    await page.getByText("New Copy").click();

    await expect(getTreeItem(page, "MYPROG1 (New copy count: 1)", false)).toHaveCount(1);
  });

  test("should show library for program", async ({ page }) => {
    await getTreeItem(page, PROFILE_NAME).click();
    await getTreeItem(page, "MYPLEX1").click();
    await getTreeItem(page, "MYREG1").click();
    await getTreeItem(page, "Programs").click();
    await expect(getTreeItem(page, "MYPROG1")).toHaveAttribute("aria-label", "MYPROG1 ");
    await getTreeItem(page, "MYPROG1").click({ button: "right" });

    await page.waitForTimeout(200);
    await page.getByText("Show Library").click();

    await expect(getTreeItem(page, "MYLIB1 (LIBRARY='MYLIB1')", false)).toHaveCount(1);
    await expect(getTreeItem(page, "MYLIBDS1")).toHaveCount(1);
  });
});

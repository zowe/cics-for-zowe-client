import { expect, test } from "@playwright/test";
import { constants, getTreeItem, prepareZoweExplorerView, resetWiremock, resetZoweExplorerView } from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("Program tests", () => {
  test("should expand programs tree to reveal programs", async ({ page }) => {
    await getTreeItem(page, constants.PROFILE_NAME).click();
    await getTreeItem(page, constants.CICSPLEX_NAME).click();
    await getTreeItem(page, constants.REGION_NAME).click();
    await getTreeItem(page, "Programs").click();
    await expect(getTreeItem(page, constants.PROGRAM_1_NAME)).toHaveAttribute("aria-label", `${constants.PROGRAM_1_NAME} `);
  });

  test("should enable and disable a program", async ({ page }) => {
    await getTreeItem(page, constants.PROFILE_NAME).click();
    await getTreeItem(page, constants.CICSPLEX_NAME).click();
    await getTreeItem(page, constants.REGION_NAME).click();
    await getTreeItem(page, "Programs").click();
    await expect(getTreeItem(page, constants.PROGRAM_1_NAME)).toHaveAttribute("aria-label", `${constants.PROGRAM_1_NAME} `);

    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/enable-disable-program/1.png" });

    await getTreeItem(page, constants.PROGRAM_1_NAME).click({ button: "right" });

    await page.waitForTimeout(200);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/enable-disable-program/1.5.png" });
    await page.getByText("Disable Program").click();

    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/enable-disable-program/2.png" });
    await expect(getTreeItem(page, `${constants.PROGRAM_1_NAME} (Disabled)`)).toHaveAttribute("aria-label", `${constants.PROGRAM_1_NAME} (Disabled) `);

    await getTreeItem(page, `${constants.PROGRAM_1_NAME} (Disabled)`).click({ button: "right" });

    await page.waitForTimeout(200);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/enable-disable-program/3.png" });
    await page.getByText("Enable Program").click();

    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/enable-disable-program/4.png" });
    await expect(getTreeItem(page, constants.PROGRAM_1_NAME)).toHaveAttribute("aria-label", `${constants.PROGRAM_1_NAME} `);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/enable-disable-program/5.png" });
  });

  test("should new copy a program", async ({ page }) => {
    await getTreeItem(page, constants.PROFILE_NAME).click();
    await getTreeItem(page, constants.CICSPLEX_NAME).click();
    await getTreeItem(page, constants.REGION_NAME).click();
    await getTreeItem(page, "Programs").click();
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/newcopy-program/1.png" });
    await expect(getTreeItem(page, constants.PROGRAM_1_NAME)).toHaveAttribute("aria-label", `${constants.PROGRAM_1_NAME} `);
    await getTreeItem(page, constants.PROGRAM_1_NAME).click({ button: "right" });

    await page.waitForTimeout(200);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/newcopy-program/2.png" });
    await page.getByText("New Copy").click();

    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/newcopy-program/3.png" });
    await expect(getTreeItem(page, `${constants.PROGRAM_1_NAME} (New copy count: 1)`, false)).toHaveCount(1);
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/newcopy-program/4.png" });
  });

  test("should show library for program", async ({ page }) => {
    await getTreeItem(page, constants.PROFILE_NAME).click();
    await getTreeItem(page, constants.CICSPLEX_NAME).click();
    await getTreeItem(page, constants.REGION_NAME).click();
    await getTreeItem(page, "Programs").click();
    await expect(getTreeItem(page, constants.PROGRAM_1_NAME)).toHaveAttribute("aria-label", `${constants.PROGRAM_1_NAME} `);
    await getTreeItem(page, constants.PROGRAM_1_NAME).click({ button: "right" });

    await page.waitForTimeout(200);
    await page.getByText("Show Library").click();

    await expect(getTreeItem(page, `${constants.LIBRARY_1_NAME} (DSNAME='MYLIBDS1') AND (LIBRARY='${constants.LIBRARY_1_NAME}')`, false)).toHaveCount(1);
    await expect(getTreeItem(page, constants.LIBRARY_DS_1_NAME)).toHaveCount(1);
  });
});

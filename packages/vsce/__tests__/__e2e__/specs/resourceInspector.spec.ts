import { expect, test } from "@playwright/test";
import { constants, getTreeItem, prepareZoweExplorerView, resetWiremock, resetZoweExplorerView } from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("Resource Inspector tests", async () => {
  test("should inspect a program resource", async ({ page }) => {
    await getTreeItem(page, constants.PROFILE_NAME).click();
    await getTreeItem(page, constants.CICSPLEX_NAME).click();
    await getTreeItem(page, constants.REGION_NAME).click();
    await getTreeItem(page, "Programs").click();
    await getTreeItem(page, constants.PROGRAM_1_NAME).click({ button: "right" });

    await page.waitForTimeout(200);
    await page.getByText("Inspect Resource").click();

    await page.frameLocator('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]').frameLocator("#active-frame").locator("#th-1").waitFor();
    await expect(
      page.frameLocator('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]').frameLocator("#active-frame").locator("th").first()
    ).toHaveText(new RegExp(constants.PROGRAM_1_NAME));
  });

  test("should have a filterable table", async ({ page }) => {
    await getTreeItem(page, constants.PROFILE_NAME).click();
    await getTreeItem(page, constants.CICSPLEX_NAME).click();
    await getTreeItem(page, constants.REGION_NAME).click();
    await getTreeItem(page, "Programs").click();
    await getTreeItem(page, constants.PROGRAM_1_NAME).click({ button: "right" });

    await page.waitForTimeout(200);
    await page.getByText("Inspect Resource").click();

    await page.frameLocator('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]').frameLocator("#active-frame").locator("#th-1").waitFor();
    await expect(
      page.frameLocator('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]').frameLocator("#active-frame").getByText("cedfstatus")
    ).toBeDefined();

    await page
      .frameLocator('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]')
      .frameLocator("#active-frame")
      .locator("input")
      .first()
      .fill("library");
    await page.screenshot({ fullPage: true, path: "./__tests__/screenshots/1.png" });
    await expect(
      page.frameLocator('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]').frameLocator("#active-frame").locator("input").first()
    ).toHaveValue("library");
    await expect(
      page.frameLocator('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]').frameLocator("#active-frame").locator("th").first()
    ).toHaveText(new RegExp(constants.PROGRAM_1_NAME));
  });

  test("should show loading message", async ({ page }) => {
    await getTreeItem(page, constants.PROFILE_NAME).click();
    await getTreeItem(page, constants.CICSPLEX_NAME).click();
    await getTreeItem(page, constants.REGION_NAME).click();
    await getTreeItem(page, "Programs").click();
    await getTreeItem(page, constants.PROGRAM_1_NAME).click({ button: "right" });

    await page.waitForTimeout(200);
    await page.getByText("Inspect Resource").click();

    await expect(page.getByText(`Loading CICS resource '${constants.PROGRAM_1_NAME}'...`, { exact: true })).toBeVisible();
  });
});

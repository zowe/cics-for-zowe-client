import { expect, test } from "@playwright/test";
import { constants, findAndClickText, findAndClickTreeItem, getTreeItem, prepareZoweExplorerView, resetWiremock, resetZoweExplorerView } from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("JVM server tests", () => {
  test("should expand JVM servers tree to reveal JVM servers", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "JVM Servers");

    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toHaveText(constants.JVM_SERVER_1_NAME);
  });

  test("should provide options when disabling JVM server", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "JVM Servers");

    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toHaveText(constants.JVM_SERVER_1_NAME);

    await findAndClickTreeItem(page, constants.JVM_SERVER_1_NAME, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Disable JVM Server");

    await expect(page.getByRole("button", { name: "Phase Out", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Purge", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Force Purge", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Kill", exact: true })).toBeVisible();
  });

  test("should disable and enable JVM server", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "JVM Servers");

    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toHaveText(constants.JVM_SERVER_1_NAME);

    // Perform Disable
    await findAndClickTreeItem(page, constants.JVM_SERVER_1_NAME, "right");
    await page.waitForTimeout(200);
    await findAndClickText(page, "Disable JVM Server");

    await expect(page.getByRole("button", { name: "Phase Out", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Phase Out", exact: true }).click();
    await expect(getTreeItem(page, `${constants.JVM_SERVER_1_NAME} (Disabled) `)).toBeVisible();
    await expect(getTreeItem(page, `${constants.JVM_SERVER_1_NAME} (Disabled) `)).toHaveText(`${constants.JVM_SERVER_1_NAME} (Disabled)`);

    // Perform Enable
    await findAndClickText(page, `${constants.JVM_SERVER_1_NAME} (Disabled) `, "right");

    await page.waitForTimeout(200);
    await findAndClickText(page, "Enable JVM Server");

    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toHaveText(constants.JVM_SERVER_1_NAME);
  });

  test("should error when killing JVM early", async ({ page }) => {
    await findAndClickTreeItem(page, constants.PROFILE_NAME);
    await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
    await findAndClickTreeItem(page, constants.REGION_NAME);
    await findAndClickTreeItem(page, "JVM Servers");

    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toBeVisible();
    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toHaveText(constants.JVM_SERVER_1_NAME);

    // Perform Disable
    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toBeVisible();
    await getTreeItem(page, constants.JVM_SERVER_1_NAME).click({ button: "right" });

    await page.waitForTimeout(200);
    await findAndClickText(page, "Disable JVM Server");

    await expect(page.getByRole("button", { name: "Kill", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Kill", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "TABLEERROR", exact: false })).toBeVisible();
  });
});

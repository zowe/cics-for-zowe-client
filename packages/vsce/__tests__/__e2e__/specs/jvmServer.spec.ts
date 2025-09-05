import { expect, test } from "@playwright/test";
import { constants, getTreeItem, prepareZoweExplorerView, resetWiremock, resetZoweExplorerView } from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("JVM server tests", () => {
  test("should expand JVM servers tree to reveal JVM servers", async ({ page }) => {
    await getTreeItem(page, constants.PROFILE_NAME).click();
    await getTreeItem(page, constants.CICSPLEX_NAME).click();
    await getTreeItem(page, constants.REGION_NAME).click();
    await getTreeItem(page, "JVM Servers").click();
    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toHaveAttribute("aria-label", `${constants.JVM_SERVER_1_NAME} `);
  });

  test("should provide options when disabling JVM server", async ({ page }) => {
    await getTreeItem(page, constants.PROFILE_NAME).click();
    await getTreeItem(page, constants.CICSPLEX_NAME).click();
    await getTreeItem(page, constants.REGION_NAME).click();
    await getTreeItem(page, "JVM Servers").click();
    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toHaveAttribute("aria-label", `${constants.JVM_SERVER_1_NAME} `);

    await getTreeItem(page, constants.JVM_SERVER_1_NAME).click({ button: "right" });

    await page.waitForTimeout(200);
    await page.getByText("Disable JVM Server").click();

    await expect(page.getByRole("button", { name: "Phase Out", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Purge", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Force Purge", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Kill", exact: true })).toBeVisible();
  });

  test("should disable and enable JVM server", async ({ page }) => {
    await getTreeItem(page, constants.PROFILE_NAME).click();
    await getTreeItem(page, constants.CICSPLEX_NAME).click();
    await getTreeItem(page, constants.REGION_NAME).click();
    await getTreeItem(page, "JVM Servers").click();
    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toHaveAttribute("aria-label", `${constants.JVM_SERVER_1_NAME} `);

    // Perform Disable
    await getTreeItem(page, constants.JVM_SERVER_1_NAME).click({ button: "right" });

    await page.waitForTimeout(200);
    await page.getByText("Disable JVM Server").click();
    await expect(page.getByRole("button", { name: "Phase Out", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Phase Out", exact: true }).click();
    await expect(getTreeItem(page, `${constants.JVM_SERVER_1_NAME} (Disabled) `)).toHaveAttribute("aria-label", `${constants.JVM_SERVER_1_NAME} (Disabled) `);

    // Perform Enable
    await getTreeItem(page, `${constants.JVM_SERVER_1_NAME} (Disabled) `).click({ button: "right" });
    await page.waitForTimeout(200);
    await page.getByText("Enable JVM Server").click();
    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toHaveAttribute("aria-label", `${constants.JVM_SERVER_1_NAME} `);
  });

  test("should error when killing JVM early", async ({ page }) => {
    await getTreeItem(page, constants.PROFILE_NAME).click();
    await getTreeItem(page, constants.CICSPLEX_NAME).click();
    await getTreeItem(page, constants.REGION_NAME).click();
    await getTreeItem(page, "JVM Servers").click();
    await expect(getTreeItem(page, constants.JVM_SERVER_1_NAME)).toHaveAttribute("aria-label", `${constants.JVM_SERVER_1_NAME} `);

    // Perform Disable
    await getTreeItem(page, constants.JVM_SERVER_1_NAME).click({ button: "right" });
    await page.waitForTimeout(200);
    await page.getByText("Disable JVM Server").click();
    await expect(page.getByRole("button", { name: "Kill", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Kill", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "TABLEERROR", exact: false })).toBeVisible();
  });
});

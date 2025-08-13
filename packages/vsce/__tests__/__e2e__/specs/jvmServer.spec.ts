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
});

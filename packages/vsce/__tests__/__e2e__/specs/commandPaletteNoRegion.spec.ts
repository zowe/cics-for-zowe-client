import { test } from "@playwright/test";
import { constants, prepareZoweExplorerView, resetWiremock, resetZoweExplorerView, runInCommandPalette } from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("Correct feedback if 0 regions found in inspect resource command ", () => {
  test("should show notification if no regions found", async ({ page }) => {
    await runInCommandPalette(page, "Zowe Explorer for IBM CICS TS: Inspect CICS Resource");
    //select Other CICS Region
    await page.getByRole("option", { name: "wiremock_localhost" }).click();
    // select region
    await page.getByRole("option", { name: constants.CICSPLEX_NAME_2 }).click();
    // check for notification
    await page.getByRole("alert").getByText("No Active Regions found in MYPLEX2").waitFor();
  });
});

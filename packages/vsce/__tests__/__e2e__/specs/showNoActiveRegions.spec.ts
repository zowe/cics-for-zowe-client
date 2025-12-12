import { test } from "@playwright/test";
import { constants, prepareZoweExplorerView, resetWiremock, resetZoweExplorerView, runInCommandPalette } from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("Show no active regions found if 0 regions present in plex ", () => {
  test("should show notification if no regions found", async ({ page }) => {
    await runInCommandPalette(page, "Zowe Explorer for IBM CICS TS: Inspect CICS Resource");
    await page.getByRole("option", { name: "wiremock_localhost" }).click();
    await page.getByRole("option", { name: constants.CICSPLEX_NAME_2 }).click();
    await page.getByRole("alert").getByText("No Active Regions found in MYPLEX2").waitFor();
  });
});

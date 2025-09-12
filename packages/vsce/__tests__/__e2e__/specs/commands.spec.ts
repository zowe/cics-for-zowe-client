import { expect, test } from "@playwright/test";
import { constants, findAndClickText, findAndClickTreeItem, getTreeItem, prepareZoweExplorerView, resetWiremock, resetZoweExplorerView } from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("Command tests", () => {
  test("should copy user agent header", async ({ page }) => {
    await page.keyboard.down("Control");
    await page.keyboard.down("Shift");
    await page.keyboard.press("p");
    await page.keyboard.up("Shift");
    await page.keyboard.up("Control");

    await expect(page.getByRole("textbox").first()).toHaveValue(">");
    await page.getByRole("textbox").fill(">Copy User Agent Header");
    await page.keyboard.press("Enter");

    await expect(page.getByText("Copied User-Agent header to clipboard", { exact: true })).toBeVisible();

    let clipboardHeader = await page.evaluate("navigator.clipboard.readText()");
    expect(clipboardHeader).toContain("zowe.cics-extension-for-zowe/3.");
    expect(clipboardHeader).toContain("zowe.vscode-extension-for-zowe/3.");
  });
});

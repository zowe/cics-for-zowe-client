/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 */

import { expect, test } from "@playwright/test";
import { getClipboardContent, prepareZoweExplorerView, resetWiremock, resetZoweExplorerView, runInCommandPalette } from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("Command tests", () => {
  test("should copy user agent header", async ({ page }) => {
    await runInCommandPalette(page, "Copy User Agent header");
    await expect(page.getByText("Copied User-Agent header to clipboard", { exact: true })).toBeVisible();

    const clipboardHeader = await getClipboardContent(page);
    expect(clipboardHeader).toContain("zowe.cics-extension-for-zowe/3.");
    expect(clipboardHeader).toContain("zowe.vscode-extension-for-zowe/3.");
  });
});

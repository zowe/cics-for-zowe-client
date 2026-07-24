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

import { Page, expect, test } from "@playwright/test";
import {
  constants,
  findAndClickText,
  findAndClickTreeItem,
  getClipboardContent,
  getResourceInspector,
  getTreeItem,
  prepareZoweExplorerView,
  resetWiremock,
  resetZoweExplorerView,
  waitForNotification,
} from "../utils/helpers";

async function openResourceInspector(page: Page, resourceType: string, resourceName: string, notificationName?: string) {
  await findAndClickTreeItem(page, constants.PROFILE_NAME);
  await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
  await findAndClickTreeItem(page, constants.REGION_NAME);
  await findAndClickTreeItem(page, resourceType);

  await findAndClickTreeItem(page, resourceName, "left", true, 15000);
  await findAndClickTreeItem(page, resourceName, "right", false);
  await page.waitForTimeout(200);
  await findAndClickText(page, "Inspect Resource");

  await waitForNotification(page, `Loading CICS resource '${notificationName ?? resourceName}'...`);
}

async function openJVMEndpointResourceInspector(page: Page, jvmEndpointName: string) {
  await findAndClickTreeItem(page, constants.PROFILE_NAME);
  await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
  await findAndClickTreeItem(page, constants.REGION_NAME);
  await findAndClickTreeItem(page, "JVM Servers");
  await findAndClickTreeItem(page, constants.JVM_SERVER_1_NAME);

  await findAndClickTreeItem(page, jvmEndpointName);
  await findAndClickTreeItem(page, jvmEndpointName, "right", false);
  await page.waitForTimeout(200);
  await findAndClickText(page, "Inspect Resource");

  const endpointResourceName = jvmEndpointName.split(" ")[0]; // strip the port suffix e.g. "MYJVMENDPOINT1 (9080)" → "MYJVMENDPOINT1"
  await waitForNotification(page, `Loading CICS resource '${endpointResourceName}'...`);
}

async function openContextMenu(page: Page) {
  const contextMenuButton = getResourceInspector(page).locator(".codicon.codicon-kebab-vertical").first();
  await expect(contextMenuButton).toBeVisible({ timeout: 10000 });
  await contextMenuButton.click();
  await page.waitForTimeout(200);
}

test.setTimeout(60 * 1000);

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test.describe("Resource Inspector Actions - Library", () => {

  test("should disable then enable MYLIB1 from Resource Inspector", async ({ page }) => {
    // Open MYLIB1 (ENABLED) in the Resource Inspector
    await openResourceInspector(page, "Libraries", constants.LIBRARY_1_NAME);

    // Verify initial state shows ENABLED
    await expect(getResourceInspector(page).getByText("Status: ENABLED")).toBeVisible();

    // --- Disable ---
    await openContextMenu(page);
    await getResourceInspector(page).getByText("Disable Library", { exact: true }).click();

    // RI refreshes automatically (refreshResourceInspector defaults to true for library actions)
    // Assert the RI panel now shows the library as DISABLED
    await expect(getResourceInspector(page).getByText("Status: DISABLED")).toBeVisible({ timeout: 10000 });

    // --- Enable ---
    await openContextMenu(page);
    await getResourceInspector(page).getByText("Enable Library", { exact: true }).click();

    // Assert the RI panel shows ENABLED again
    await expect(getResourceInspector(page).getByText("Status: ENABLED")).toBeVisible({ timeout: 10000 });
  });

  test("should show Compare to option for library in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Libraries", constants.LIBRARY_1_NAME);

    await openContextMenu(page);
    await expect(getResourceInspector(page).getByText("Compare to...", { exact: true })).toBeVisible();
  });
});

test.describe("Resource Inspector Actions - Task", () => {
  test("should purge task from Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Tasks", constants.TASK_1_NAME, "00001");

    await openContextMenu(page);
    await getResourceInspector(page).getByText("Purge Task", { exact: true }).click();

    // Confirmation dialog must offer both Purge and Force Purge options
    await expect(page.getByRole("button", { name: "Purge", exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: "Force Purge", exact: true })).toBeVisible({ timeout: 5000 });

    // Choose "Purge" — wiremock scenario transitions to task-purged state
    await page.getByRole("button", { name: "Purge", exact: true }).click();

    // After a successful purge the tree refreshes and the task is no longer listed
    await expect(getTreeItem(page, constants.TASK_1_NAME)).not.toBeVisible({ timeout: 10000 });
  });

  test("should show Inquire Transaction action for task in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Tasks", constants.TASK_1_NAME, "00001");

    await openContextMenu(page);
    await getResourceInspector(page).getByText("Inquire Transaction", { exact: true }).click();

    // Inquire Transaction navigates to the Transactions tree for the associated tranid (CEMT)
    await expect(getTreeItem(page, "Transactions")).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(500);
  });

  test("should show Compare to option for task in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Tasks", constants.TASK_1_NAME, "00001");

    await openContextMenu(page);
    await expect(getResourceInspector(page).getByText("Compare to...", { exact: true })).toBeVisible();
  });
});

test.describe("Resource Inspector Actions - JVM Server", () => {
  test("should show Enable and Disable actions for an enabled JVM Server in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "JVM Servers", constants.JVM_SERVER_1_NAME);

    await openContextMenu(page);

    // MYJVM1 is ENABLED — Disable should be visible, Enable should not
    await expect(getResourceInspector(page).getByText("Disable JVM Server", { exact: true })).toBeVisible();
    await expect(getResourceInspector(page).getByText("Enable JVM Server", { exact: true })).not.toBeVisible();
  });

  test("should show Compare to option for JVM Server in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "JVM Servers", constants.JVM_SERVER_1_NAME);

    await openContextMenu(page);
    await expect(getResourceInspector(page).getByText("Compare to...", { exact: true })).toBeVisible();
  });
});

test.describe("Resource Inspector Actions - JVM Endpoint", () => {
  test("should show Disable but not Enable for an ENABLED JVM Endpoint in Resource Inspector", async ({ page }) => {
    await openJVMEndpointResourceInspector(page, constants.JVM_ENDPOINT_1_NAME);

    await openContextMenu(page);

    // MYJVMENDPOINT1 is ENABLED — Disable should be visible, Enable should not
    await expect(getResourceInspector(page).getByText("Disable JVM Endpoint", { exact: true })).toBeVisible();
    await expect(getResourceInspector(page).getByText("Enable JVM Endpoint", { exact: true })).not.toBeVisible();
  });

  test("should show Enable but not Disable for a DISABLED JVM Endpoint in Resource Inspector", async ({ page }) => {
    await openJVMEndpointResourceInspector(page, constants.JVM_ENDPOINT_2_NAME);

    await openContextMenu(page);

    // MYJVMENDPOINT2 is DISABLED — Enable should be visible, Disable should not
    await expect(getResourceInspector(page).getByText("Enable JVM Endpoint", { exact: true })).toBeVisible();
    await expect(getResourceInspector(page).getByText("Disable JVM Endpoint", { exact: true })).not.toBeVisible();
  });

  test("should show Compare to option for JVM Endpoint in Resource Inspector", async ({ page }) => {
    await openJVMEndpointResourceInspector(page, constants.JVM_ENDPOINT_1_NAME);

    await openContextMenu(page);
    await expect(getResourceInspector(page).getByText("Compare to...", { exact: true })).toBeVisible();
  });
});

test.describe("Resource Inspector Actions - Pipeline", () => {
  test("should show Copy Name and Compare to actions for Pipeline in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Pipelines", constants.PIPELINE_1_NAME);

    await openContextMenu(page);
    await expect(getResourceInspector(page).getByText("Copy Name", { exact: true })).toBeVisible();
    await expect(getResourceInspector(page).getByText("Compare to...", { exact: true })).toBeVisible();
  });

  test("should copy Pipeline name to clipboard from Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Pipelines", constants.PIPELINE_1_NAME);

    await openContextMenu(page);
    await getResourceInspector(page).getByText("Copy Name", { exact: true }).click();
    await page.waitForTimeout(200);

    expect(await getClipboardContent(page)).toEqual("MYPIPE1");
  });

  test("should compare Pipeline MYPIPE1 to MYPIPE2 from Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Pipelines", constants.PIPELINE_1_NAME);

    await openContextMenu(page);
    await getResourceInspector(page).getByText("Compare to...", { exact: true }).click();

    // Select region: "Other CICS Region" → profile → plex → region
    await page.getByRole("option", { name: "Other CICS Region", exact: true }).click();
    await page.getByRole("option", { name: constants.PROFILE_NAME, exact: true }).click();
    await page.getByRole("option", { name: constants.CICSPLEX_NAME, exact: true }).click();
    await page.getByRole("option", { name: constants.REGION_NAME, exact: true }).click();

    // Enter the second resource name to compare against
    await page.locator("input.input").fill(constants.PIPELINE_2_NAME);
    await page.keyboard.press("Enter");

    await expect(getResourceInspector(page).locator("span.font-normal", { hasText: "MYPIPE1" }).first()).toBeVisible({ timeout: 20000 });
    await expect(getResourceInspector(page).locator("span.font-normal", { hasText: "MYPIPE2" }).first()).toBeVisible({ timeout: 20000 });
  });
});

test.describe("Resource Inspector Actions - Web Service", () => {
  test("should show Copy Name and Compare to actions for Web Service in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Web Services", constants.WEBSERVICE_1_NAME);

    await openContextMenu(page);
    await expect(getResourceInspector(page).getByText("Copy Name", { exact: true })).toBeVisible();
    await expect(getResourceInspector(page).getByText("Compare to...", { exact: true })).toBeVisible();
  });

  test("should copy Web Service name to clipboard from Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Web Services", constants.WEBSERVICE_1_NAME);

    await openContextMenu(page);
    await getResourceInspector(page).getByText("Copy Name", { exact: true }).click();
    await page.waitForTimeout(200);

    expect(await getClipboardContent(page)).toEqual("MYWS1");
  });

  test("should compare Web Service MYWS1 to MYWS2 from Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "Web Services", constants.WEBSERVICE_1_NAME);

    await openContextMenu(page);
    await getResourceInspector(page).getByText("Compare to...", { exact: true }).click();

    // Select region: "Other CICS Region" → profile → plex → region
    await page.getByRole("option", { name: "Other CICS Region", exact: true }).click();
    await page.getByRole("option", { name: constants.PROFILE_NAME, exact: true }).click();
    await page.getByRole("option", { name: constants.CICSPLEX_NAME, exact: true }).click();
    await page.getByRole("option", { name: constants.REGION_NAME, exact: true }).click();

    // Enter the second resource name to compare against
    await page.locator("input.input").fill(constants.WEBSERVICE_2_NAME);
    await page.keyboard.press("Enter");

    await expect(getResourceInspector(page).locator("span.font-normal", { hasText: "MYWS1" }).first()).toBeVisible({ timeout: 20000 });
    await expect(getResourceInspector(page).locator("span.font-normal", { hasText: "MYWS2" }).first()).toBeVisible({ timeout: 20000 });
  });
});

test.describe("Resource Inspector Actions - TCP/IP Service", () => {
  test("should show Copy Name and Compare to actions for TCP/IP Service in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "TCP/IP Services", constants.TCPIP_1_NAME, "MYTCPIP1");

    await openContextMenu(page);
    await expect(getResourceInspector(page).getByText("Copy Name", { exact: true })).toBeVisible();
    await expect(getResourceInspector(page).getByText("Compare to...", { exact: true })).toBeVisible();
  });

  test("should copy TCP/IP Service name to clipboard from Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "TCP/IP Services", constants.TCPIP_1_NAME, "MYTCPIP1");

    await openContextMenu(page);
    await getResourceInspector(page).getByText("Copy Name", { exact: true }).click();
    await page.waitForTimeout(200);

    expect(await getClipboardContent(page)).toEqual("MYTCPIP1");
  });

  test("should compare TCP/IP Service MYTCPIP1 to MYTCPIP2 from Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "TCP/IP Services", constants.TCPIP_1_NAME, "MYTCPIP1");

    await openContextMenu(page);
    await getResourceInspector(page).getByText("Compare to...", { exact: true }).click();

    // Select region: "Other CICS Region" → profile → plex → region
    await page.getByRole("option", { name: "Other CICS Region", exact: true }).click();
    await page.getByRole("option", { name: constants.PROFILE_NAME, exact: true }).click();
    await page.getByRole("option", { name: constants.CICSPLEX_NAME, exact: true }).click();
    await page.getByRole("option", { name: constants.REGION_NAME, exact: true }).click();

    // Enter the second resource name to compare against
    await page.locator("input.input").fill("MYTCPIP2");
    await page.keyboard.press("Enter");

    await expect(getResourceInspector(page).locator("span.font-normal", { hasText: "MYTCPIP1" }).first()).toBeVisible({ timeout: 10000 });
    await expect(getResourceInspector(page).locator("span.font-normal", { hasText: "MYTCPIP2" }).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Resource Inspector Actions - URIMap", () => {
  test("should show Copy Name and Compare to actions for URI Map in Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "URI Maps", constants.URIMAP_1_FULL_NAME, constants.URIMAP_1_NAME);

    await openContextMenu(page);
    await expect(getResourceInspector(page).getByText("Copy Name", { exact: true })).toBeVisible();
    await expect(getResourceInspector(page).getByText("Compare to...", { exact: true })).toBeVisible();
  });

  test("should copy URI Map name to clipboard from Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "URI Maps", constants.URIMAP_1_FULL_NAME, constants.URIMAP_1_NAME);

    await openContextMenu(page);
    await getResourceInspector(page).getByText("Copy Name", { exact: true }).click();
    await page.waitForTimeout(200);

    expect(await getClipboardContent(page)).toEqual("URI1");
  });

  test("should compare URI Map URI1 to URI2 from Resource Inspector", async ({ page }) => {
    await openResourceInspector(page, "URI Maps", constants.URIMAP_1_FULL_NAME, constants.URIMAP_1_NAME);

    await openContextMenu(page);
    await getResourceInspector(page).getByText("Compare to...", { exact: true }).click();

    // Select region: "Other CICS Region" → profile → plex → region
    await page.getByRole("option", { name: "Other CICS Region", exact: true }).click();
    await page.getByRole("option", { name: constants.PROFILE_NAME, exact: true }).click();
    await page.getByRole("option", { name: constants.CICSPLEX_NAME, exact: true }).click();
    await page.getByRole("option", { name: constants.REGION_NAME, exact: true }).click();

    // Enter the second resource name to compare against
    await page.locator("input.input").fill("URI2");
    await page.keyboard.press("Enter");

    await expect(getResourceInspector(page).locator("span.font-normal", { hasText: "URI1" }).first()).toBeVisible({ timeout: 10000 });
    await expect(getResourceInspector(page).locator("span.font-normal", { hasText: "URI2" }).first()).toBeVisible({ timeout: 10000 });
  });
});
import { expect, test } from "@playwright/test";
import { constants, findAndClickTreeItem, getTreeItem, prepareZoweExplorerView, resetWiremock, resetZoweExplorerView } from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test("CICSPlexTree is organised in correct order", async ({ page }) => {
  const expectedOrder = [
    "Bundles",
    "Files",
    "JVM Servers",
    "Libraries",
    "Pipelines",
    "Programs",
    "Tasks",
    "TCP/IP Services",
    "Transactions",
    "TS Queues",
    "URI Maps",
    "Web Services",
  ];

  //open the CICS Region tree
  await findAndClickTreeItem(page, constants.PROFILE_NAME);
  await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
  await findAndClickTreeItem(page, constants.REGION_NAME);
  let currentTop = 1;
  for (const order of expectedOrder) {
    const item = getTreeItem(page, order);
    await expect(item).toBeVisible();
    const style = await item.getAttribute("style");
    let styles = style?.split(";");

    if (styles) {
      styles = styles[0].split(":");
      styles = styles[1].split("px");
      const topValue = Number(styles[0]);
      expect(currentTop).toBeLessThan(topValue);
      currentTop = topValue;
    }
  }
});
test("CICSRegionTree is organised in correct order", async ({ page }) => {
  const expectedOrder = [
    "Regions",
    "All Bundles",
    "All Files",
    "All JVM Servers",
    "All Libraries",
    "All Pipelines",
    "All Programs",
    "All Tasks",
    "All TCP/IP Services",
    "All Transactions",
    "All TS Queues",
    "All URI Maps",
    "All Web Services",
  ];

  await findAndClickTreeItem(page, constants.PROFILE_NAME);
  await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
  let currentTop = 1;
  for (const order of expectedOrder) {
    const item = getTreeItem(page, order);
    await expect(item).toBeVisible();
    const style = await item.getAttribute("style");
    let styles = style?.split(";");

    if (styles) {
      styles = styles[0].split(":");
      styles = styles[1].split("px");
      const topValue = Number(styles[0]);
      expect(currentTop).toBeLessThan(topValue);
      currentTop = topValue;
    }
  }
});

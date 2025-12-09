import { test } from "@playwright/test";
import {
  assertTreeItemsOrder,
  constants,
  expectedPlexOrder,
  expectedRegionOrder,
  findAndClickTreeItem,
  prepareZoweExplorerView,
  resetWiremock,
  resetZoweExplorerView,
} from "../utils/helpers";

test.beforeEach(async ({ page, request }) => {
  await resetWiremock(request);
  await prepareZoweExplorerView(page);
});

test.afterEach(async ({ page }) => {
  await resetZoweExplorerView(page);
});

test("CICSRegionTree is organised in correct order", async ({ page }) => {
  await findAndClickTreeItem(page, constants.PROFILE_NAME);
  await findAndClickTreeItem(page, constants.CICSPLEX_NAME);
  await findAndClickTreeItem(page, constants.REGION_NAME);

  await assertTreeItemsOrder(page, expectedRegionOrder, { waitForLabel: expectedRegionOrder[0], includeAll: false });
});

test("CICSPlexTree is organised in correct order", async ({ page }) => {
  await findAndClickTreeItem(page, constants.PROFILE_NAME);
  await findAndClickTreeItem(page, constants.CICSPLEX_NAME);

  await assertTreeItemsOrder(page, expectedPlexOrder, { waitForLabel: expectedPlexOrder[0], includeAll: true });
});

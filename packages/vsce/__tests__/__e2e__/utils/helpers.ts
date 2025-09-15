import { APIRequestContext, Locator, Page, expect } from "@playwright/test";

export const constants = {
  ZOWE_CONFIG_FILE_NAME: "zowe.config.json",

  PROFILE_NAME: "wiremock_localhost",
  CICSPLEX_NAME: "MYPLEX1",
  REGION_NAME: "MYREG1",
  PROGRAM_1_NAME: "MYPROG1",
  LIBRARY_1_NAME: "MYLIB1",
  LIBRARY_DS_1_NAME: "MYLIBDS1",
  JVM_SERVER_1_NAME: "MYJVM1",
};

export const getTree = (page: Page, exactText: string) => {
  return page.getByRole("button", { name: exactText, exact: true });
};

export const getTreeItem = (page: Page, text: string, exact: boolean = true) => {
  return page.getByRole("treeitem", { name: text, exact });
};

export const isTreeItemExpanded = async (treeItem: Locator) => {
  return (await treeItem.getAttribute("aria-expanded")) === "true";
};

export const resetWiremock = async (request: APIRequestContext) => {
  const response = await request.post(`http://localhost:8080/__admin/scenarios/reset`, {});
  expect(response.ok()).toBeTruthy();
};

const getZoweExplorerTrees = async (page: Page) => {
  const dsTree = getTree(page, "Data Sets Section");
  const ussTree = getTree(page, "Unix System Services (USS) Section");
  const jobTree = getTree(page, "Jobs Section");

  return [dsTree, ussTree, jobTree];
};

export const prepareZoweExplorerView = async (page: Page) => {
  await page.goto("http://localhost:1234");

  await page.getByRole("tab", { name: "Zowe Explorer" }).locator("a").click();

  // If each of the trees are expanded, collapse them
  for (const tree of await getZoweExplorerTrees(page)) {
    if (await isTreeItemExpanded(tree)) {
      await tree.click();
    }
  }
};

export const resetZoweExplorerView = async (page: Page) => {
  // If the profile tree item is expanded, collapse it
  const profileTreeItem = getTreeItem(page, constants.PROFILE_NAME);
  if ((await profileTreeItem.isVisible()) && (await isTreeItemExpanded(profileTreeItem))) {
    await profileTreeItem.click();
  }

  // If each of the trees are collapsed, expand them
  for (const tree of await getZoweExplorerTrees(page)) {
    if (!(await isTreeItemExpanded(tree))) {
      await tree.click();
    }
  }
};

export const getResourceInspector = (page: Page) => {
  return page.frameLocator('iframe[src *= "extensionId=Zowe.cics-extension-for-zowe"]').frameLocator("#active-frame");
};

export const findAndClickTreeItem = async (page: Page, label: string, button: "left" | "right" | "middle" = "left") => {
  await expect(getTreeItem(page, label)).toBeVisible();
  await expect(getTreeItem(page, label)).toHaveText(label);
  await getTreeItem(page, label).click({ button });
};

export const findAndClickText = async (page: Page, label: string, button: "left" | "right" | "middle" = "left") => {
  await expect(page.getByText(label)).toBeVisible();
  await page.getByText(label).click({ button });
};

export const runInCommandPalette = async (page: Page, command: string) => {
  await page.keyboard.down("Control");
  await page.keyboard.down("Shift");
  await page.keyboard.press("p");
  await page.keyboard.up("Shift");
  await page.keyboard.up("Control");

  await expect(page.getByRole("textbox").first()).toHaveValue(">");
  await page.getByRole("textbox").fill(`>${command}`);
  await page.keyboard.press("Enter");
};

export const getClipboardContent = async (page: Page) => {
  return await page.evaluate("navigator.clipboard.readText()");
};

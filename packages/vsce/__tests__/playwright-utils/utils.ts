import { Page, Locator } from '@playwright/test';

export const PROFILE_NAME = "wiremock_localhost";

export const getTree = (page: Page, exactText: string) => {
  return page.getByRole('button', { name: exactText, exact: true });
};

export const getTreeItem = (page: Page, exactText: string) => {
  return page.getByRole('treeitem', { name: exactText, exact: true });
};

export const isTreeItemExpanded = async (treeItem: Locator) => {
  return await treeItem.getAttribute("aria-expanded") === "true";
};
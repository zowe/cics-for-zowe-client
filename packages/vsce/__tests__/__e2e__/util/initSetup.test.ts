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

import { assert, expect } from "chai";
import {
  ActivityBar,
  By,
  DefaultTreeSection,
  EditorView,
  InputBox,
  Key,
  SideBarView,
  TreeItem,
  ViewPanelAction,
  WebDriver,
  WebElement,
  WebView,
} from "vscode-extension-tester";
import { CICS, EDIT_TEAM_CONFIG_FILE, PROJECT_CURRENT_WORKING_DIRECTORY, REGIONS_LOADED, ZOWE_EXPLORER } from "./constants";

export async function openZoweExplorer(): Promise<SideBarView> {
  const zoweExplorer = await new ActivityBar().getViewControl(ZOWE_EXPLORER);
  assert(zoweExplorer !== undefined);
  const view = await zoweExplorer.openView();
  return view;
}

export async function getCicsSection(view: SideBarView): Promise<DefaultTreeSection> {
  let cicsTree: DefaultTreeSection;
  cicsTree = await view.getContent().getSection(CICS);
  await cicsTree.click();
  return cicsTree;
}

export async function clickRefreshIconInCicsTree(cicsTree: DefaultTreeSection): Promise<void> {
  await cicsTree.click();
  const refreshIcon: ViewPanelAction | undefined = await cicsTree.getAction(`Refresh`);
  await refreshIcon?.click();
}
export async function clickPlusIconInCicsTree(cicsTree: DefaultTreeSection): Promise<void> {
  await cicsTree.click();
  const plusIcon: ViewPanelAction | undefined = await cicsTree.getAction(`Create a CICS Profile`);
  await plusIcon?.click();
}

export async function clickCollapseAllsIconInCicsTree(cicsTree: DefaultTreeSection): Promise<void> {
  await cicsTree.click();
  const collapseAllIcon: ViewPanelAction | undefined = await cicsTree.getAction(`Collapse All`);
  await collapseAllIcon?.click();
}

export async function selectEditProjectTeamConfigFile(cicsTree: DefaultTreeSection): Promise<void> {
  // Open the quick pick to add a new connection by clicking the plus icon in the cics section
  // Select the option to edit project team configuration file from the quickpicks
  await clickPlusIconInCicsTree(cicsTree);

  let quickPick: InputBox;
  quickPick = await InputBox.create();

  let qpItems = await quickPick.getQuickPicks();
  const label1 = await qpItems[1].getLabel();
  expect(label1).contains(EDIT_TEAM_CONFIG_FILE);
  await quickPick.selectQuickPick(1);

  qpItems = await quickPick.getQuickPicks();
  const label2 = await qpItems[1].getLabel();
  expect(label2).contains(PROJECT_CURRENT_WORKING_DIRECTORY);
  await quickPick.selectQuickPick(1);
}

export async function checkIfEditorTabIsOpened(editorTabName: string): Promise<void> {
  // Find open editors
  const editorView = new EditorView();
  const titles = await editorView.getOpenEditorTitles();

  // Check if the required tab is opened
  expect(titles.some((title) => title.startsWith(editorTabName))).is.true;
}

export async function closeAllEditorsTabs(): Promise<void> {
  const editorView = new EditorView();
  await editorView.closeAllEditors();
  const titles = editorView.getOpenEditorTitles();
  expect(titles).to.be.empty;
}

export async function getPlexChildren(cicsTree: DefaultTreeSection, profileName: string, plexName: string): Promise<TreeItem[]> {
  return await cicsTree.openItem(profileName, plexName);
}

export async function getPlexChildIndex(plexChildren: TreeItem[], plexChildName: string): Promise<number> {
  for (const plexChild of plexChildren) {
    if ((await plexChild.getLabel()).trim().startsWith(plexChildName)) {
      return plexChildren.indexOf(plexChild);
    }
  }
  return -1;
}

export async function getRegionsInPlex(cicsTree: DefaultTreeSection, profileName: string, plexName: string): Promise<TreeItem[]> {
  const plexChildren = await getPlexChildren(cicsTree, profileName, plexName);
  const regionsIndex = await getPlexChildIndex(plexChildren, "Regions");
  expect(regionsIndex).to.be.greaterThan(-1);
  return cicsTree.openItem(profileName, plexName, await plexChildren[regionsIndex].getLabel());
}

export async function getRegionIndex(regions: TreeItem[], regionName: string): Promise<number> {
  for (const region of regions) {
    if ((await region.getLabel()).trim().startsWith(regionName)) {
      return regions.indexOf(region);
    }
  }
  return -1;
}

export async function getRegionResources(
  cicsTree: DefaultTreeSection,
  profileName: string,
  plexName: string,
  regions: string,
  regionName: string
): Promise<TreeItem[]> {
  return cicsTree.openItem(profileName, plexName, regions, regionName);
}

export async function getRegionResourceIndex(regionResources: TreeItem[], resourceName: string): Promise<number> {
  for (const resource of regionResources) {
    if ((await resource.getLabel()).trim().startsWith(resourceName)) {
      return regionResources.indexOf(resource);
    }
  }
  return -1;
}

export async function expectTreeItemIsSelected(treeItem: TreeItem | undefined) {
  const isSelected = await treeItem?.getAttribute("aria-selected");
  expect(isSelected).to.equal("true");
}

export async function verifyProgramAttributes(programName: string, expectedAttributes: { [key: string]: string }) {
  const editorView = new EditorView();

  const webView = (await editorView.openEditor(`CICSProgram PROGLIB(${programName})`)) as WebView;
  expect(webView).not.undefined;
  await webView.switchToFrame();

  const table = await webView.findWebElement(By.id("resultsTable"));
  expect(table).not.undefined;

  const tableRows = await table.findElements(By.css("tr"));
  expect(tableRows).not.empty;

  const searchBar = await webView.findWebElement(By.id("searchBox"));
  expect(searchBar).not.undefined;

  for (const [attributeKey, expectedValue] of Object.entries(expectedAttributes)) {
    await searchBar.clear();
    await searchBar.sendKeys(attributeKey);
    await searchBar.sendKeys("\uE007"); // Enter key

    const visibleRows: WebElement[] = [];
    for (const row of tableRows) {
      if (await row.isDisplayed()) {
        visibleRows.push(row);
      }
    }

    let found = false;
    for (const row of visibleRows) {
      const keyElement = await row.findElement(By.css("th"));
      const key = (await keyElement.getText()).trim().toLowerCase();

      if (key === attributeKey.toLowerCase()) {
        const value = await row.findElement(By.css("td")).getText();
        expect(value).contains(expectedValue);
        found = true;
        break;
      }
    }

    expect(found, `Attribute ${attributeKey} not found`).to.be.true;
  }

  await searchBar.clear();
  await webView.switchBack();
}

export async function getLabelAfterArrowDown(driver: WebDriver): Promise<string> {
  await driver.actions().sendKeys(Key.ARROW_DOWN).perform();
  const activeElement: WebElement = await driver.switchTo().activeElement();
  const fullText: string = await activeElement.getText();
  const label: string = fullText.split("\n")[0].trim();
  return label;
}

export async function setupCICSTreeSelectedResourceParams(
  cicsTree: DefaultTreeSection,
  profileName: string,
  plexName: string,
  regionName: string,
  resourceName: string
) {
  // Get children of the plex
  const cicsPlexChildren = await getPlexChildren(cicsTree, profileName, plexName);
  expect(cicsPlexChildren).not.empty;

  const regionIndex = await getPlexChildIndex(cicsPlexChildren, "Regions");
  expect(regionIndex).to.be.greaterThan(-1);

  // Get regions inside the plex
  const regions = await getRegionsInPlex(cicsTree, profileName, plexName);
  expect(regions).not.empty;

  const selectedRegionIndex = await getRegionIndex(regions, regionName);
  expect(selectedRegionIndex).to.be.greaterThan(-1);

  // Get resources inside the region
  const selectedRegionResources = await getRegionResources(
    cicsTree,
    profileName,
    plexName,
    REGIONS_LOADED,
    await regions[selectedRegionIndex].getLabel()
  );
  expect(selectedRegionResources).not.empty;

  const selectedResourceIndex = await getRegionResourceIndex(selectedRegionResources, resourceName);
  expect(selectedResourceIndex).to.be.greaterThan(-1);

  // Open the Programs resource
  await selectedRegionResources[selectedResourceIndex].click();
  const selectedResource = await cicsTree.openItem(
    profileName,
    plexName,
    REGIONS_LOADED,
    await regions[selectedRegionIndex].getLabel(),
    await selectedRegionResources[selectedResourceIndex].getLabel()
  );
  expect(selectedResource).not.empty;

  return {
    cicsPlexChildren,
    regionIndex,
    regions,
    selectedRegionIndex,
    selectedRegionResources,
    selectedResourceIndex,
    selectedResource,
  };
}

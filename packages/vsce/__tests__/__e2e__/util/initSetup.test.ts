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
import { ActivityBar, DefaultTreeSection, EditorView, InputBox, SideBarView, TreeItem, ViewPanelAction } from "vscode-extension-tester";
import { CICS, EDIT_TEAM_CONFIG_FILE, PROJECT_CURRENT_WORKING_DIRECTORY, ZOWE_EXPLORER } from "./constants";

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

export async function getResourceInRegion(
  cicsTree: DefaultTreeSection,
  profileName: string,
  plexName: string,
  regionName: string,
  resourceName: string
): Promise<TreeItem[]> {
  const plexChildren = await getPlexChildren(cicsTree, profileName, plexName);
  expect(plexChildren).not.empty;

  const regionsIndex = await getPlexChildIndex(plexChildren, "Regions");
  expect(regionsIndex).to.be.greaterThan(-1);

  const regions = await getRegionsInPlex(cicsTree, profileName, plexName);
  expect(regions).not.empty;

  const regionIndex = await getRegionIndex(regions, regionName);
  expect(regionIndex).to.be.greaterThan(-1);

  const regionResources = await getRegionResources(
    cicsTree,
    profileName,
    plexName,
    await plexChildren[regionIndex].getLabel(),
    await regions[regionIndex].getLabel()
  );
  expect(regionResources).not.empty;

  const resourceIndex = await getRegionResourceIndex(regionResources, resourceName);
  expect(resourceIndex).to.be.greaterThan(-1);

  await regionResources[resourceIndex].click();
  return cicsTree.openItem(
    profileName,
    plexName,
    await plexChildren[regionIndex].getLabel(),
    await regions[regionIndex].getLabel(),
    await regionResources[resourceIndex].getLabel()
  );
}

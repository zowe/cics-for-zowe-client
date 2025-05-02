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
import { ActivityBar, DefaultTreeSection, EditorView, InputBox, SideBarView, ViewPanelAction } from "vscode-extension-tester";

export async function openZoweExplorer(): Promise<SideBarView> {
  // Open the Zowe Explorer
  const zoweExplorer = await new ActivityBar().getViewControl("Zowe Explorer");
  assert(zoweExplorer !== undefined);
  const view = await zoweExplorer.openView();
  return view;
}

export async function getCicsSection(view: SideBarView): Promise<DefaultTreeSection> {
  // Get the cics section
  let cicsTree: DefaultTreeSection;
  cicsTree = await view.getContent().getSection("cics");
  await cicsTree.click();
  return cicsTree;
}

export async function clickPlusIconInCicsTree(cicsTree: DefaultTreeSection): Promise<void> {
  // Click the plus icon in the cics section
  await cicsTree.click();
  const plusIcon: ViewPanelAction | undefined = await cicsTree?.getAction(`Create a CICS Profile`);
  await plusIcon?.click();
}

export async function selectEditProjectTeamConfigFile(cicsTree: DefaultTreeSection): Promise<void> {
  // Select the option to edit project team configuration file from the quickpick
  // Click the plus icon in cics section
  await clickPlusIconInCicsTree(cicsTree);

  // Select the option to edit project team configuration file
  let quickPick: InputBox;
  quickPick = await InputBox.create();

  let qpItems = await quickPick.getQuickPicks();
  const label1 = await qpItems[1].getLabel();
  expect(label1).contains("Edit Team Configuration File");
  await quickPick.selectQuickPick(1);

  qpItems = await quickPick.getQuickPicks();
  const label2 = await qpItems[1].getLabel();
  expect(label2).contains("Project: in the current working directory");
  await quickPick.selectQuickPick(1);
}

export async function checkIfZoweConfigJsonFileIsOpened(): Promise<void> {
  // Find open editors
  const configFileName = "zowe.config.json";
  const editorView = new EditorView();
  const titles = await editorView.getOpenEditorTitles();

  // Check zowe.config.json was opened - could check content here
  expect(titles.some((title) => title.startsWith(configFileName))).is.true;
}

export async function closeAllEditorsTabs(): Promise<void> {
  // Close all open editor tabs
  const editorView = new EditorView();
  await editorView.closeAllEditors();
  const titles = editorView.getOpenEditorTitles();
  expect(titles).to.be.empty;
}

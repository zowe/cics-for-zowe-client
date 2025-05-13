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
import { CICS, CONFIG_FILE_NAME, ZOWE_EXPLORER } from "./constants";

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

export async function selectEditProjectTeamConfigFile(cicsTree: DefaultTreeSection): Promise<void> {
  // Open the quick pick to add a new connection by clicking the plus icon in the cics section
  // Select the option to edit project team configuration file from the quickpicks

  await clickPlusIconInCicsTree(cicsTree);

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
  const editorView = new EditorView();
  const titles = await editorView.getOpenEditorTitles();

  // Check zowe.config.json was opened - could check content here
  expect(titles.some((title) => title.startsWith(CONFIG_FILE_NAME))).is.true;
}

export async function closeAllEditorsTabs(): Promise<void> {
  const editorView = new EditorView();
  await editorView.closeAllEditors();
  const titles = editorView.getOpenEditorTitles();
  expect(titles).to.be.empty;
}

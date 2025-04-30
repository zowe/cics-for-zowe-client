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
import { ActivityBar, DefaultTreeSection, EditorView, InputBox, ModalDialog, WebElement, Workbench } from "vscode-extension-tester";

describe("Create New Global Team Configuration File Scenario", () => {
  let cicsTree: DefaultTreeSection;
  let quickPick: InputBox;
  let dialog: ModalDialog;
  let element: WebElement;
  let editorView: EditorView;

  before(async function () {
    // open the cics extension view
    const zoweExplorer = await new ActivityBar().getViewControl("Zowe Explorer");
    assert(zoweExplorer !== undefined);
    const view = await zoweExplorer.openView();

    //handle notifications if config file is missing
    const notifications = await new Workbench().getNotifications();
    if (notifications.length > 0) {
      await notifications[0].click();
      const actions = await notifications[0].getActions();
      await actions[0].click();

      //select qp option
      quickPick = await InputBox.create();
      await quickPick.selectQuickPick(0);
    }

    cicsTree = await view.getContent().getSection("cics");
    await cicsTree.click();
  });

  after(async () => {
    // Close all open editor tabs
    editorView.closeAllEditors();
  });

  it("CICS Section title Check", async () => {
    // title check for cics section
    const title = await cicsTree.getTitle();
    expect(title).equals("cics");
  });

  it("+ (plus) button clickable test", async () => {
    // selecting cics view and clicking + icon
    await cicsTree.click();
    await cicsTree.expand();
    const potentialPlusIcon = await cicsTree.getAction(`Create a CICS Profile`);
    assert(typeof potentialPlusIcon !== "undefined");
    const plusIcon = potentialPlusIcon;
    expect(plusIcon).exist;
    cicsTree.takeScreenshot();
    await plusIcon.click();
  });

  it("Quick Pick Option test", async () => {
    // Find quickpick
    quickPick = await InputBox.create();
    const qpItems = await quickPick.getQuickPicks();

    const label1 = await qpItems[0].getLabel();
    expect(label1).contains("＋ Create a New Team Configuration File");

    if (qpItems.length > 1) {
      const label2 = await qpItems[1].getLabel();
      expect(label2).contains("Edit Team Configuration File");
    }

    const placeholder = await quickPick.getPlaceHolder();
    expect(placeholder).equals('Choose "Create new..." to define or select a profile to add to the CICS tree');
    cicsTree.takeScreenshot();
  });

  it("Create New Configuration File Test", async () => {
    quickPick = await InputBox.create();
    await quickPick.selectQuickPick(0);
    dialog = new ModalDialog();
    await dialog.click();

    element = dialog.getEnclosingElement();
    await element.click();

    const buttons = await dialog.getButtons();

    // there should be 2 buttons
    expect(buttons.length).equals(2);

    // or we can directly push a button by title
    await dialog.pushButton(`Create New`);

    // Find open editors
    editorView = new EditorView();
    const titles = await editorView.getOpenEditorTitles();

    // Check zowe.config.json was opened - could check content here
    expect(titles.some((title) => title.startsWith("zowe.config.json"))).is.true;
  });
});

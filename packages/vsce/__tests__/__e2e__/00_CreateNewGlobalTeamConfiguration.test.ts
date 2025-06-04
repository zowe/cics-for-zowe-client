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

import { expect } from "chai";
import { DefaultTreeSection, EditorView, InputBox, ModalDialog, SideBarView, ViewPanelAction, WebElement, Workbench } from "vscode-extension-tester";
import {
  CICS,
  CONFIG_FILE_NAME,
  CREATE_A_CICS_PROFILE,
  CREATE_A_NEW_TEAM_CONFIGURATION_FILE,
  EDIT_TEAM_CONFIG_FILE,
  QUICKPICK_PLACEHOLDER,
} from "./util/constants";
import { sleep } from "./util/globalMocks";
import { checkIfEditorTabIsOpened, closeAllEditorsTabs, getCicsSection, openZoweExplorer } from "./util/initSetup.test";

describe("Test Suite For Creating New Global Team Configuration File", () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let quickPick: InputBox;
  let editorView: EditorView;
  let dialog: ModalDialog;
  let element: WebElement;

  before(async () => {
    await sleep(2000);
    view = await openZoweExplorer();

    // Handle notifications if config file is missing
    const notifications = await new Workbench().getNotifications();
    if (notifications.length > 0) {
      await notifications[0].click();
      const actions = await notifications[0].getActions();
      await actions[0].click();

      quickPick = await InputBox.create();
      await quickPick.selectQuickPick(0);
    }

    cicsTree = await getCicsSection(view);
  });

  after(async () => {
    await closeAllEditorsTabs();
  });

  it("Should Check The CICS Section Title", async () => {
    // Title check for cics section
    const cicsTreeTitle = await cicsTree.getTitle();
    expect(cicsTreeTitle).equals(CICS);
  });

  it("Should Test If The + (Plus) Button Is Clickable", async () => {
    // Click the + icon in the cics section
    await cicsTree.click();
    const plusIcon: ViewPanelAction | undefined = await cicsTree.getAction(CREATE_A_CICS_PROFILE);
    expect(plusIcon).exist;
    await plusIcon?.click();
    cicsTree.takeScreenshot();
  });

  it("Should Verify If The Quick Pick Options Are Correct", async () => {
    // Find quickpick
    quickPick = await InputBox.create();
    const qpItems = await quickPick.getQuickPicks();

    const label1 = await qpItems[0].getLabel();
    expect(label1).contains(CREATE_A_NEW_TEAM_CONFIGURATION_FILE);

    if (qpItems.length > 1) {
      const label2 = await qpItems[1].getLabel();
      expect(label2).contains(EDIT_TEAM_CONFIG_FILE);
    }

    const placeholder = await quickPick.getPlaceHolder();
    expect(placeholder).equals(QUICKPICK_PLACEHOLDER);
    cicsTree.takeScreenshot();
  });

  it("Should Create A New Configuration File", async () => {
    // Select the option to create a new team configuration file in the quickpick
    quickPick = await InputBox.create();
    await quickPick.selectQuickPick(0);
    dialog = new ModalDialog();
    await dialog.click();

    element = dialog.getEnclosingElement();
    await element.click();

    const buttons = await dialog.getButtons();

    // There should be 2 buttons
    expect(buttons.length).equals(2);

    // Push the button by title to create new configuration file
    await dialog.pushButton(`Create New`);

    await checkIfEditorTabIsOpened(CONFIG_FILE_NAME);
    cicsTree.takeScreenshot();
  });

  it("Should Check If CICS Profile Is Present In The Configuration File", async () => {
    editorView = new EditorView();
    const editor = await editorView.openEditor(CONFIG_FILE_NAME);
    const isCicsProfileAvailable = await editor.getText();
    expect(isCicsProfileAvailable.includes(CICS)).to.be.true;
    cicsTree.takeScreenshot();
  });
});

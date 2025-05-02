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
import { DefaultTreeSection, InputBox, ModalDialog, SideBarView, ViewPanelAction, WebElement, Workbench } from "vscode-extension-tester";
import { sleep } from "./util/globalMocks";
import { checkIfZoweConfigJsonFileIsOpened, closeAllEditorsTabs, getCicsSection, openZoweExplorer } from "./util/initSetup.test";

describe("Test Suite For Creating New Global Team Configuration File", () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let quickPick: InputBox;
  let dialog: ModalDialog;
  let element: WebElement;

  before(async () => {
    await sleep(2000);
    // Open the Zowe Explorer
    view = await openZoweExplorer();

    // Handle notifications if config file is missing
    const notifications = await new Workbench().getNotifications();
    if (notifications.length > 0) {
      await notifications[0].click();
      const actions = await notifications[0].getActions();
      await actions[0].click();

      // Select qp option
      quickPick = await InputBox.create();
      await quickPick.selectQuickPick(0);
    }

    // Open the cics section in the zowe explorer
    cicsTree = await getCicsSection(view);
  });

  after(async () => {
    // Close all open editors
    await closeAllEditorsTabs();
  });

  it("Should Check The CICS Section Title", async () => {
    // Title check for cics section
    const cicsTreeTitle = await cicsTree.getTitle();
    expect(cicsTreeTitle).equals("cics");
  });

  it("Should Test If The + (Plus) Button Is Clickable", async () => {
    // Click the + icon in the cics section
    await cicsTree.click();
    const plusIcon: ViewPanelAction | undefined = await cicsTree.getAction(`Create a CICS Profile`);
    expect(plusIcon).exist;
    await plusIcon?.click();
    cicsTree?.takeScreenshot();
  });

  it("Should Verify If The Quick Pick Options Are Correct", async () => {
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

    // Check if zowe.config.json is opened
    await checkIfZoweConfigJsonFileIsOpened();
    cicsTree.takeScreenshot();
  });
});

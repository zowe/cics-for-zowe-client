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
import * as path from "path";
import { ActivityBar, DefaultTreeSection, InputBox, QuickPickItem, SideBarView, VSBrowser } from "vscode-extension-tester";
import { sleep } from "./util/globalMocks";
import {
  checkIfZoweConfigJsonFileIsOpened,
  clickPlusIconInCicsTree,
  closeAllEditorsTabs,
  getCicsSection,
  openZoweExplorer,
} from "./util/initSetup.test";

describe("Test Suite For Editing Global And Project Team Configuration Files", () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let quickPick: InputBox;
  let qpItems: QuickPickItem[];

  before(async () => {
    await sleep(2000);
    // open the Explorer view into the folder where configuration files are available
    await VSBrowser.instance.openResources(path.join("__tests__", "__e2e__", "resources", "test", "config-files"));
    (await new ActivityBar().getViewControl("Explorer"))?.openView();

    // Open the Zowe explorer
    view = await openZoweExplorer();

    // Open the cics section in the Zowe explorer and expand it
    cicsTree = await getCicsSection(view);
  });

  beforeEach(async () => {
    // Click the plus icon in cics section
    await clickPlusIconInCicsTree(cicsTree);

    // Find quickpick and select the option to edit team configuration file
    quickPick = await InputBox.create();
    qpItems = await quickPick.getQuickPicks();

    const label = await qpItems[1].getLabel();
    expect(label).contains("Edit Team Configuration File");
    await quickPick.selectQuickPick(1);

    qpItems = await quickPick.getQuickPicks();
  });

  afterEach(async () => {
    // Should open the configuration file
    await checkIfZoweConfigJsonFileIsOpened();

    // Close all open editors
    await closeAllEditorsTabs();
  });

  describe("Opening The Global Team Configuration File", async () => {
    it("Should Select The Global Option From The Quickpick", async () => {
      // Select the option "Global: in the Zowe home directory" from the quickpick
      const label1 = await qpItems[0].getLabel();
      expect(label1).contains("Global: in the Zowe home directory");

      await quickPick.selectQuickPick(0);
      cicsTree.takeScreenshot();
    });
  });

  describe("Opening The Project Team Configuration File", async () => {
    it("Should Select The Project Option From The Quickpick", async () => {
      // Select the option "Project: in the current working directory" from the quickpick
      const label2 = await qpItems[1].getLabel();
      expect(label2).contains("Project: in the current working directory");

      await quickPick.selectQuickPick(1);
      cicsTree.takeScreenshot();
    });
  });
});

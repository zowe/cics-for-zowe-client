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
import { CONFIG_FILE_NAME, EDIT_TEAM_CONFIG_FILE, GLOBAL_ZOWE_HOME_DIRECTORY, PROJECT_CURRENT_WORKING_DIRECTORY } from "./util/constants";
import { sleep } from "./util/globalMocks";
import { checkIfEditorTabIsOpened, clickPlusIconInCicsTree, closeAllEditorsTabs, getCicsSection, openZoweExplorer } from "./util/initSetup.test";

describe("Edit Global And Project Config Files", () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let quickPick: InputBox;
  let qpItems: QuickPickItem[];

  before(async () => {
    await sleep(1900);
    // open the Explorer view into the folder where configuration files are available
    await VSBrowser.instance.openResources(path.join("__tests__", "__e2e__", "resources", "test", "config-files"));
    (await new ActivityBar().getViewControl("Explorer"))?.openView();

    view = await openZoweExplorer();
    cicsTree = await getCicsSection(view);
    await sleep(100);
  });

  beforeEach(async () => {
    // Open the quick pick by clicking the plus icon in the cics section
    // Select the option to edit project team configuration file from the quickpicks
    await clickPlusIconInCicsTree(cicsTree);

    quickPick = await InputBox.create();
    qpItems = await quickPick.getQuickPicks();

    const label = await qpItems[1].getLabel();
    expect(label).contains(EDIT_TEAM_CONFIG_FILE);
    await quickPick.selectQuickPick(1);

    qpItems = await quickPick.getQuickPicks();
  });

  afterEach(async () => {
    await checkIfEditorTabIsOpened(CONFIG_FILE_NAME);
    await closeAllEditorsTabs();
  });

  describe("Open Global Config", async () => {
    it("Choose Global From Quickpick", async () => {
      // Select the option "Global: in the Zowe home directory" from the quickpick
      const label1 = await qpItems[0].getLabel();
      expect(label1).contains(GLOBAL_ZOWE_HOME_DIRECTORY);

      await quickPick.selectQuickPick(0);
      cicsTree.takeScreenshot();
    });
  });

  describe("Open Project Config", async () => {
    it("Choose Project From Quickpick", async () => {
      // Select the option "Project: in the current working directory" from the quickpick
      const label2 = await qpItems[1].getLabel();
      expect(label2).contains(PROJECT_CURRENT_WORKING_DIRECTORY);

      await quickPick.selectQuickPick(1);
      cicsTree.takeScreenshot();
    });
  });
});

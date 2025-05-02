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
import { ActivityBar, DefaultTreeSection, EditorView, InputBox, SideBarView, TreeItem, VSBrowser } from "vscode-extension-tester";
import { addWiremockProfileToConfigFile, sleep } from "./util/globalMocks";
import {
  checkIfZoweConfigJsonFileIsOpened,
  clickPlusIconInCicsTree,
  closeAllEditorsTabs,
  getCicsSection,
  openZoweExplorer,
  selectEditProjectTeamConfigFile,
} from "./util/initSetup.test";

describe("Test Suite For Adding Wiremock Profile And Listing The CICSplexes", () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let quickPick: InputBox;
  let editorView: EditorView;
  const configFileName = "zowe.config.json";
  const profileName = "wiremock_server";

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
    // Expand the cics section
    await cicsTree.click();
  });

  after(async () => {
    // Close all open editors
    await closeAllEditorsTabs();
  });

  describe("Adding Wiremock Profile In The Configuration File", () => {
    it("Should Add Wiremock Profile", async () => {
      // Add wiremock profile to the zowe.config.json
      addWiremockProfileToConfigFile();

      // Select the option to edit project team configuration file from the quickpick
      await selectEditProjectTeamConfigFile(cicsTree);

      // Should open the configuration file
      await checkIfZoweConfigJsonFileIsOpened();

      // Check if wiremock profile is added to the zowe.config.json
      editorView = new EditorView();
      const editor = await editorView.openEditor(configFileName);
      const isWmAvailable = await editor.getText();
      expect(isWmAvailable.includes(profileName)).to.be.true;
      cicsTree.takeScreenshot();
    });
  });

  describe("Check For The Wiremock Profile And List The Plexes", async () => {
    let wiremockServer: TreeItem | undefined;

    it("Should Add The Wiremock CICS Profile To The Tree Using The Create Profile Toolbar Option", async () => {
      // Click the plus icon in cics section
      await clickPlusIconInCicsTree(cicsTree);

      // Find quickpick
      quickPick = await InputBox.create();
      const qpItems = await quickPick.getQuickPicks();
      const qpLen = qpItems.length;

      // Selecting wiremock_server from the quickpick
      let i, wiremockLabel;
      for (i = 0; i < qpLen; i++) {
        wiremockLabel = await qpItems[i].getLabel();
        if (wiremockLabel.includes(profileName)) {
          break;
        }
      }
      expect(wiremockLabel).contains(profileName);
      if (i < qpLen) {
        await quickPick.selectQuickPick(i);
      }
      cicsTree.takeScreenshot();
    });

    it("Should Display Wiremock Profile Under CICS Section And Title Check For The Wiremock Profile", async () => {
      // Checking if wiremock_server profile is available under the cics section
      wiremockServer = await cicsTree.findItem(profileName);
      expect(wiremockServer).exist;

      // Title check for wiremork profile
      const wmSeverLabel = await wiremockServer?.getLabel();
      expect(wmSeverLabel).equals(profileName);
      cicsTree.takeScreenshot();
    });

    it("Should List The CICSplexes Under Wiremock Profile", async () => {
      // Should expand the wiremock_profile and check for the plexes present under it
      const plexes = await cicsTree.openItem(profileName);
      expect(plexes).exist;

      const plex1 = await plexes[0].getLabel();
      expect(plex1).contains("CICSEX61");

      const plex2 = await plexes[1].getLabel();
      expect(plex2).contains("DUMMY907");
      cicsTree.takeScreenshot();
    });
  });
});

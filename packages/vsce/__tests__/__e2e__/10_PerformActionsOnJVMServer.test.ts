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
import { DefaultTreeSection, SideBarView, TreeItem } from "vscode-extension-tester";
import { HERSHWLP, CICSEX61, IYCWENW2, JVMSERVERS, WIREMOCK_PROFILE_NAME } from "./util/constants";
import { findJVMServerTreeNodeByLabel, sleep, updateUserSetting, openCommandPaletteAndType} from "./util/globalMocks";
import {
  clickCollapseAllsIconInCicsTree,
  clickRefreshIconInCicsTree,
  closeAllEditorsTabs,
  collapseSectionInZoweExplorer,
  getCicsSection,
  openZoweExplorer,
  setupCICSTreeSelectedResourceParams,
} from "./util/initSetup.test";
import { resetAllScenarios } from "./util/resetScenarios";

describe("Perform Actions On JVM Servers", () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let wiremockServer: TreeItem | undefined;
  let cicsPlexChildren: TreeItem[];
  let regionIndex: number;
  let regions: TreeItem[];
  let regionIIYCWENW2ndex: number;
  let regionResources: TreeItem[];
  let jvmResourceIndex: number;
  let jvmservers: TreeItem[];

  before(async () => {
    await sleep(1900);
    view = await openZoweExplorer();

    await collapseSectionInZoweExplorer(view, "Data Sets");
    await collapseSectionInZoweExplorer(view, "Unix System Services (USS)");
    await collapseSectionInZoweExplorer(view, "Jobs");

    cicsTree = await getCicsSection(view);
    await clickRefreshIconInCicsTree(cicsTree);

    wiremockServer = await cicsTree.findItem(WIREMOCK_PROFILE_NAME);
    expect(wiremockServer).exist;
    await updateUserSetting("zowe.cics.showAllCommandsInPalette",true);

    await resetAllScenarios();
  });

  after(async () => {
    await closeAllEditorsTabs();
    await clickCollapseAllsIconInCicsTree(cicsTree);
    await resetAllScenarios();
  });

  describe("Performing Disable And Enable On JVM Server CICSEX61 -> IYCWENW2 -> JVM Servers -> HERSHWLP", () => {
    let HERSHWLPJVMServer: TreeItem | undefined;

    it("Verify CICSEX61 -> Regions -> IYCWENW2 -> JVM Servers", async () => {
      ({
        cicsPlexChildren,
        regionIndex,
        regions,
        selectedRegionIndex: regionIIYCWENW2ndex,
        selectedRegionResources: regionResources,
        selectedResourceIndex: jvmResourceIndex,
        selectedResource: jvmservers,
      } = await setupCICSTreeSelectedResourceParams(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61, IYCWENW2, JVMSERVERS));

      cicsTree.takeScreenshot();
      await resetAllScenarios();

    });

    it("Verify JVM Servers -> HERSHWLP", async () => {
      HERSHWLPJVMServer = await findJVMServerTreeNodeByLabel(jvmservers, HERSHWLP);
      expect(HERSHWLPJVMServer).not.undefined;
      expect(await HERSHWLPJVMServer?.getLabel()).contains(HERSHWLP);
      cicsTree.takeScreenshot();
      await resetAllScenarios();
    });

    it("Disable JVM Server", async () => {
        await resetAllScenarios();
        await HERSHWLPJVMServer?.click();
        
        // Clear all notifications before running the command
        const inputBoxfornotification = await openCommandPaletteAndType(">Notifications: Clear All Notifications");
        await inputBoxfornotification.confirm();

        // Now select the disable command from the command palette
        const inputBoxforcommand = await openCommandPaletteAndType(">IBM CICS for Zowe Explorer: Disable JVM Server");
        await inputBoxforcommand.confirm();

        // Now select the disable command from the command palette
        const inputBoxforaction = await openCommandPaletteAndType(">Notifications: Accept Notification Primary Action");
        await inputBoxforaction.confirm();

        await HERSHWLPJVMServer?.click();
        expect(await HERSHWLPJVMServer?.getLabel()).contains(HERSHWLP);
        expect(await HERSHWLPJVMServer?.getLabel()).contains("Disabled");
        cicsTree.takeScreenshot();

});

    it("Enable JVM Server", async () => {
        //await resetAllScenarios();
        await HERSHWLPJVMServer?.click();

        // Now select the enable command from the command palette
        const inputBoxtoenable = await openCommandPaletteAndType(">IBM CICS for Zowe Explorer: Enable JVM Server");
        await inputBoxtoenable.confirm();

        await HERSHWLPJVMServer?.click();
        expect(await HERSHWLPJVMServer?.getLabel()).contains(HERSHWLP);
        expect(await HERSHWLPJVMServer?.getLabel()).not.contains("Disabled");
        cicsTree.takeScreenshot();
    });
  });
});

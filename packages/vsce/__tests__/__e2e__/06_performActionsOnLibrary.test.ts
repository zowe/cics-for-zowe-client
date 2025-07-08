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
import { CBSA, CICSEX61, IYCWENK1, LIBRARIES, REGIONS_LOADED, WIREMOCK_PROFILE_NAME } from "./util/constants";
import { findLibraryTreeNodeByLabel, runCommandAndGetTreeItems, sleep } from "./util/globalMocks";
import {
  clickCollapseAllsIconInCicsTree,
  closeAllEditorsTabs,
  getCicsSection,
  openZoweExplorer,
  setupCICSTreeSelectedResourceParams,
} from "./util/initSetup.test";
import { resetAllScenarios } from "./util/resetScenarios";

describe("Perform Actions On Libraries", () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let wiremockServer: TreeItem | undefined;
  let cicsPlexChildren: TreeItem[];
  let regionIndex: number;
  let regions: TreeItem[];
  let regionIYCWENK1Index: number;
  let regionK1Resources: TreeItem[];
  let libraryResourceIndex: number;
  let libraries: TreeItem[];

  before(async () => {
    await sleep(1900);
    view = await openZoweExplorer();
    cicsTree = await getCicsSection(view);

    wiremockServer = await cicsTree.findItem(WIREMOCK_PROFILE_NAME);
    expect(wiremockServer).exist;
    await sleep(100);
    await resetAllScenarios();
  });

  after(async () => {
    await closeAllEditorsTabs();
    await clickCollapseAllsIconInCicsTree(cicsTree);
  });

  describe("Performing Disable And Enable On Library CICSEX61 -> IYCWENK1 -> LIBRARY -> CBSA", () => {
    let CBSALibrary: TreeItem | undefined;

    it("Verify CICSEX61 -> Regions -> IYCWENK1 -> Libraries", async () => {
      ({
        cicsPlexChildren,
        regionIndex,
        regions,
        selectedRegionIndex: regionIYCWENK1Index,
        selectedRegionResources: regionK1Resources,
        selectedResourceIndex: libraryResourceIndex,
        selectedResource: libraries,
      } = await setupCICSTreeSelectedResourceParams(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61, IYCWENK1, LIBRARIES));

      cicsTree.takeScreenshot();
    });

    it("Verify LIBRARIES -> CBSA", async () => {
      CBSALibrary = await findLibraryTreeNodeByLabel(libraries, CBSA);
      expect(CBSALibrary).not.undefined;
      expect(await CBSALibrary?.getLabel()).contains(CBSA);
      cicsTree.takeScreenshot();
    });

    it("Disable CBSA Library", async () => {
      // Navigate to the CBSA Library in the tree
      await CBSALibrary?.click();

      // Run the disable command from the command palette
      // And get the Libraries in region IYCWENK1 in plex CICSEX61 to get updated state
      libraries = await runCommandAndGetTreeItems(
        cicsTree,
        ">IBM CICS for Zowe Explorer: Disable Library",
        WIREMOCK_PROFILE_NAME,
        CICSEX61,
        REGIONS_LOADED,
        await regions[regionIYCWENK1Index].getLabel(),
        await regionK1Resources[libraryResourceIndex].getLabel()
      );

      expect(await CBSALibrary?.getLabel()).contains(CBSA + " (Disabled)");
      cicsTree.takeScreenshot();
    });

    it("Enable CBSA Library", async () => {
      await resetAllScenarios();
      await CBSALibrary?.click();

      // Run the enable command from the command palette
      // And get the Library in region IYCWENK1 in plex CICSEX61 to get updated state
      libraries = await runCommandAndGetTreeItems(
        cicsTree,
        ">IBM CICS for Zowe Explorer: Enable Library",
        WIREMOCK_PROFILE_NAME,
        CICSEX61,
        REGIONS_LOADED,
        await regions[regionIYCWENK1Index].getLabel(),
        await regionK1Resources[libraryResourceIndex].getLabel()
      );

      expect(await CBSALibrary?.getLabel()).contains(CBSA);
      expect(await CBSALibrary?.getLabel()).not.contains("Disabled");
      cicsTree.takeScreenshot();
    });
  });
});

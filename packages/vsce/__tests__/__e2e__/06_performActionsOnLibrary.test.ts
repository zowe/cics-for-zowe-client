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
import { CBSA, CICSEX61, REGIONS_LOADED, WIREMOCK_PROFILE_NAME } from "./util/constants";
import { findLibraryByLabel, runCommandAndGetTreeItems, sleep } from "./util/globalMocks";
import {
  clickCollapseAllsIconInCicsTree,
  closeAllEditorsTabs,
  getCicsSection,
  openZoweExplorer,
  setupCICSTreeSelectedResourceParams,
} from "./util/initSetup.test";
import { resetAllScenarios } from "./util/resetScenarios";

describe("Test Suite For Performing Actions On The Library In CICSEX61", () => {
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
    await sleep(2000);
    view = await openZoweExplorer();
    cicsTree = await getCicsSection(view);

    wiremockServer = await cicsTree.findItem(WIREMOCK_PROFILE_NAME);
    expect(wiremockServer).exist;

    await resetAllScenarios();
  });

  after(async () => {
    await closeAllEditorsTabs();
    await clickCollapseAllsIconInCicsTree(cicsTree);
  });

  describe("Test Suite For Performing Disable And Enable on Library resources", () => {
    let CBSALibrary: TreeItem | undefined;

    it("Should Setup Tree and Verify Library List", async () => {
      ({
        cicsPlexChildren,
        regionIndex,
        regions,
        selectedRegionIndex: regionIYCWENK1Index,
        selectedRegionResources: regionK1Resources,
        selectedResourceIndex: libraryResourceIndex,
        selectedResource: libraries,
      } = await setupCICSTreeSelectedResourceParams(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61, "IYCWENK1", "Libraries"));

      cicsTree.takeScreenshot();
    });

    it("Should Check If The Library CBSA Is Present In Region IYCWENK1", async () => {
      CBSALibrary = await findLibraryByLabel(libraries, CBSA);
      expect(CBSALibrary).not.undefined;
      expect(await CBSALibrary?.getLabel()).contains(CBSA);
      cicsTree.takeScreenshot();
    });

    it("Should Disable The Library CBSA", async () => {
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

    it("Should Enable The Library CBSA", async () => {
      

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

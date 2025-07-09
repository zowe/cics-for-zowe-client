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
import { DefaultTreeSection, SideBarView, TreeItem, VSBrowser } from "vscode-extension-tester";
import { CICSEX61, LIB2, LIBRARIES_LIB2_LABEL, PIPELINES, PLIB2NONE, PROGLIB, PROGRAMS, WIREMOCK_PROFILE_NAME } from "./util/constants";
import { findProgramTreeNodeByLabel, runCommandFromCommandPalette, sleep } from "./util/globalMocks";
import {
  clickCollapseAllsIconInCicsTree,
  clickRefreshIconInCicsTree,
  closeAllEditorsTabs,
  getCicsSection,
  getLabelAfterArrowDown,
  openZoweExplorer,
  setupCICSTreeSelectedResourceParams,
  verifyProgramAttributes,
} from "./util/initSetup.test";
import { resetAllScenarios } from "./util/resetScenarios";

describe("Show Library Action on Program without LIBDSNAME", () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let wiremockServer: TreeItem | undefined;
  let cicsPlexChildren: TreeItem[];
  let regions: TreeItem[];
  let regionResources: TreeItem[];
  let programs: TreeItem[];
  let regionPROGLIBIndex: number;
  let programsResourceIndex: number;
  let regionIndex: number;

  before(async () => {
    await sleep(1900);
    view = await openZoweExplorer();
    cicsTree = await getCicsSection(view);
    clickRefreshIconInCicsTree(cicsTree);
    wiremockServer = await cicsTree.findItem(WIREMOCK_PROFILE_NAME);
    expect(wiremockServer).exist;
    await resetAllScenarios();
    await sleep(100);
  });

  after(async () => {
    await closeAllEditorsTabs();
    await clickCollapseAllsIconInCicsTree(cicsTree);
  });

  it("Setup Tree and Verify Programs", async () => {
    ({
      cicsPlexChildren,
      regionIndex,
      regions,
      selectedRegionIndex: regionPROGLIBIndex,
      selectedRegionResources: regionResources,
      selectedResourceIndex: programsResourceIndex,
      selectedResource: programs,
    } = await setupCICSTreeSelectedResourceParams(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61, PROGLIB, PROGRAMS));

    cicsTree.takeScreenshot();
  });

  let PLIB2NONEPROGRAM: TreeItem | undefined;
  it("Check Program PLIB2NONE Is In Region PROGLIB", async () => {
    PLIB2NONEPROGRAM = await findProgramTreeNodeByLabel(programs, PLIB2NONE);
    expect(PLIB2NONEPROGRAM).not.undefined;
    expect(await PLIB2NONEPROGRAM?.getLabel()).contains(PLIB2NONE);
  });

  it("Check the attributes of PLIB2NONE", async () => {
    await PLIB2NONEPROGRAM?.click();
    await runCommandFromCommandPalette(">IBM CICS for Zowe Explorer: Show Attributes cics-extension-for-zowe.showPrgramAttributes");
    await verifyProgramAttributes(PLIB2NONE, {
      Program: PLIB2NONE,
      Library: LIB2,
      Librarydsn: "",
    });
  });

  it("Show Library on PLIB2NONE", async () => {
    await PLIB2NONEPROGRAM?.click();
    await runCommandFromCommandPalette(">IBM CICS for Zowe Explorer: Show Library");
    const driver = VSBrowser.instance.driver;
    for (const item of regionResources) {
      const resourceLabel = (await item.getLabel()).trim();
      if (resourceLabel.includes("Programs")) {
        await driver.actions().move({ origin: regionResources[programsResourceIndex] }).click().perform();
        continue;
      }
      if (resourceLabel.includes(LIBRARIES_LIB2_LABEL)) {
        let label = "";
        let foundLIB = false;
        //need to scroll down to find the lib and stop when we find it
        let count = 0;
        while (!label.includes(PIPELINES) && count < 10) {
          count++;
          label = await getLabelAfterArrowDown(driver);
          if (label === LIBRARIES_LIB2_LABEL) {
            foundLIB = true;
            break;
          }
        }
        expect(foundLIB).to.be.equal(true);
      }
    }
  });
});

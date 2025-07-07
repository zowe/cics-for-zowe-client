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
import { CICSEX61, DS11, LIB1, LIBRARIES_LIB1_LABEL, PIPELINES, PLIB1DS1, PROGLIB, PROGRAMS, WIREMOCK_PROFILE_NAME } from "./util/constants";
import { findProgramByLabel, runCommandFromCommandPalette, sleep } from "./util/globalMocks";
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

describe("Show Library Action on Program with Library and LIBDSNAME", () => {
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
    await sleep(1900); // Wait for the extension to load
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

  let PLIB1DS1PROGRAM: TreeItem | undefined;
  it("Check Program PLIB1DS1 Is In Region PROGLIB", async () => {
    PLIB1DS1PROGRAM = await findProgramByLabel(programs, PLIB1DS1);
    expect(PLIB1DS1PROGRAM).not.undefined;
    expect(await PLIB1DS1PROGRAM?.getLabel()).contains(PLIB1DS1);
  });

  it("Check PLIB1DS1 attributes", async () => {
    await PLIB1DS1PROGRAM?.click();
    await runCommandFromCommandPalette(">IBM CICS for Zowe Explorer: Show Attributes");
    await verifyProgramAttributes(PLIB1DS1, {
      Program: PLIB1DS1,
      Library: LIB1,
      Librarydsn: DS11,
    });
  });

  it("Show Library on PLIB1DS1", async () => {
    await PLIB1DS1PROGRAM?.click();
    await runCommandFromCommandPalette(">IBM CICS for Zowe Explorer: Show Library");
    const driver = VSBrowser.instance.driver;
    for (const item of regionResources) {
      const resourceLabel = (await item.getLabel()).trim();
      if (resourceLabel.includes("Programs")) {
        await driver.actions().move({ origin: regionResources[programsResourceIndex] }).click().perform();
        continue;
      }
      if (resourceLabel.includes(LIBRARIES_LIB1_LABEL)) {
        let label = "";
        let foundDSN = false;
        let foundLIB = true;
        //need to scroll down to find the DSN and stop when we find it
        let count = 0;
        while (!label.includes(PIPELINES) && count < 10) {
          count++;
          label = await getLabelAfterArrowDown(driver);
          if (label === DS11) {
            foundDSN = true;
            break;
          }
        }
        expect(foundDSN).to.be.equal(true);
        expect(foundLIB).to.be.equal(true);
      }
    }
  });
});

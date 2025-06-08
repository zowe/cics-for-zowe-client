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
import { CICSEX61, LIB2, LIBRARIES_LIB2_LABEL, PIPELINES, PLIB2NONE, WIREMOCK_PROFILE_NAME } from "./util/constants";
import { runCommandFromCommandPalette, sleep } from "./util/globalMocks";
import {
  closeAllEditorsTabs,
  getCicsSection,
  getLabelAfterArrowDown,
  openZoweExplorer,
  setupCICSTreeProgramParams,
  verifyProgramAttributes,
} from "./util/initSetup.test";
import { resetAllScenarios } from "./util/resetScenarios";

describe("Test Suite For Performing navigation On The Programs In CICSEX61", () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let wiremockServer: TreeItem | undefined;
  let cicsex61Children: TreeItem[];
  let regions: TreeItem[];
  let regionResources: TreeItem[];
  let programs: TreeItem[];
  let regionPROGLIBIndex: number;
  let programsResourceIndex: number;
  let regionIndex: number;

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
  });

  describe("Test Suite For Checking Children Of Plex CICSEX61", async () => {
    it("Should Setup Tree and Verify Program List", async () => {
      ({ cicsex61Children, regionIndex, regions, regionPROGLIBIndex, regionResources, programsResourceIndex, programs } =
        await setupCICSTreeProgramParams(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61));

      cicsTree.takeScreenshot();
    });
    let PLIB2NONEPROGRAM: TreeItem | undefined;
    it("Should Check If The Program PLIB2NONE Is Present In Region PROGLIB", async () => {
      for (const program of programs) {
        if ((await program.getLabel()).trim() === PLIB2NONE) {
          PLIB2NONEPROGRAM = program;
        }
      }
      expect(PLIB2NONEPROGRAM).not.undefined;
      expect(await PLIB2NONEPROGRAM?.getLabel()).contains(PLIB2NONE);
    });

    it("Should Show Attributes Of The Program PLIB2NONEN", async () => {
      await PLIB2NONEPROGRAM?.click();
      await runCommandFromCommandPalette(">IBM CICS for Zowe Explorer: Show Attributes cics-extension-for-zowe.showPrgramAttributes");
    });

    it("Should Check If The Attributes Of The Program PLIB2NONE Are Shown", async () => {
      await verifyProgramAttributes(PLIB2NONE, {
        Program: PLIB2NONE,
        Library: LIB2,
        Librarydsn: "",
      });
    });

    it("Should Select PLIB2NONE Program", async () => {
      await PLIB2NONEPROGRAM?.click();
      await runCommandFromCommandPalette(">IBM CICS for Zowe Explorer: Show Library");
    });

    it("Should Check The LIB1 Library Under Region PROGLIB", async () => {
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
          while (true || !label.includes(PIPELINES)) {
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
});

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
import { CICSEX61, DS11, LIB1, LIBRARIES_LIB1_LABEL, PIPELINES, PLIB1DS1, WIREMOCK_PROFILE_NAME } from "./util/constants";
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
    await sleep(2000); // Wait for the extension to load
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
    let PLIB1DS1PROGRAM: TreeItem | undefined;

    it("Should Check If The Program PLIB1DS1 Is Present In Region PROGLIB", async () => {
      for (const program of programs) {
        if ((await program.getLabel()).trim() === PLIB1DS1) {
          PLIB1DS1PROGRAM = program;
          break;
        }
      }
      expect(PLIB1DS1PROGRAM).not.undefined;
      expect(await PLIB1DS1PROGRAM?.getLabel()).contains(PLIB1DS1);
    });

    it("Should Show Attributes Of The Program PLIB1DS1N", async () => {
      await PLIB1DS1PROGRAM?.click();
      await runCommandFromCommandPalette(">IBM CICS for Zowe Explorer: Show Attributes cics-extension-for-zowe.showPrgramAttributes");
    });

    it("Should Check If The Attributes Of The Program PLIB1DS1 Are Shown", async () => {
      await verifyProgramAttributes(PLIB1DS1, {
        Program: PLIB1DS1,
        Library: LIB1,
        Librarydsn: DS11,
      });
    });

    it("Should select PLIB1DS1 program", async () => {
      await PLIB1DS1PROGRAM?.click();
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
        if (resourceLabel.includes(LIBRARIES_LIB1_LABEL)) {
          let label = "";
          let foundDSN = false;
          let foundLIB = true;
          //need to scroll down to find the DSN and stop when we find it
          while (true || !label.includes(PIPELINES)) {
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
});

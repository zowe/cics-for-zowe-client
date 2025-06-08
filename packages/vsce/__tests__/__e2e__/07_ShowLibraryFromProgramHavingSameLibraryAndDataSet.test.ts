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
import { DefaultTreeSection, EditorView, Key, SideBarView, TreeItem, VSBrowser, WebView } from "vscode-extension-tester";
import { CICSEX61, DS11, DS12, LIB1, LIB1_PROGLIB_DS11_DS12_LABEL, LIBRARIES_LIB1_LIB1_LABEL, PIPELINES, PLIB1DS1, PLIB1DS2, PROFILE_NAME } from "./util/constants";
import { runCommandAndGetTreeItems, runCommandFromCommandPalette } from "./util/globalMocks";
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
  let editorView: EditorView;
  let webView: WebView;
  let wiremockServer: TreeItem | undefined;
  let cicsex61Children: TreeItem[];
  let regions: TreeItem[];
  let regionK1Resources: TreeItem[];
  let programs: TreeItem[];
  let regionPROGLIBIndex: number;
  let programsResourceIndex: number;
  let regionIndex: number;

  before(async () => {
    view = await openZoweExplorer();
    cicsTree = await getCicsSection(view);
    wiremockServer = await cicsTree.findItem(PROFILE_NAME);
    expect(wiremockServer).exist;
  });

  after(async () => {
    await closeAllEditorsTabs();
  });

  describe("Test Suite For Checking Children Of Plex CICSEX61", async () => {
    it("Should Setup Tree and Verify Program List", async () => {
      ({ cicsex61Children, regionIndex, regions, regionPROGLIBIndex, regionK1Resources, programsResourceIndex, programs } =
        await setupCICSTreeProgramParams(cicsTree, PROFILE_NAME, CICSEX61));

      cicsTree.takeScreenshot();
    });
    let PLIB1DS1PROGRAM: TreeItem | undefined;
    let PLIB1DS2PROGRAM: TreeItem | undefined;

    it("Should Check If The Program PLIB1DS2 Is Present In Region PROGLIB", async () => {
      for (const program of programs) {
        if ((await program.getLabel()).trim() === PLIB1DS2) {
          PLIB1DS2PROGRAM = program;
        }
        if ((await program.getLabel()).trim() === PLIB1DS1) {
          PLIB1DS1PROGRAM = program;
        }
      }
      expect(PLIB1DS2PROGRAM).not.undefined;
      expect(await PLIB1DS2PROGRAM?.getLabel()).contains(PLIB1DS2);

      expect(PLIB1DS1PROGRAM).not.undefined;
      expect(await PLIB1DS1PROGRAM?.getLabel()).contains(PLIB1DS1);
    });

    it("Should Show Attributes Of The Program PLIB1DS2N", async () => {
      await PLIB1DS2PROGRAM?.click();
      await runCommandFromCommandPalette(">IBM CICS for Zowe Explorer: Show Attributes cics-extension-for-zowe.showPrgramAttributes");
    });

    it("Should Check If The Attributes Of The Program PLIB1DS2 Are Shown", async () => {
      await verifyProgramAttributes(PLIB1DS2, {
        Program: PLIB1DS2,
        Library: LIB1,
        Librarydsn: DS12,
      });
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

    it("Should Select PLIB1DS2 and PLIB1DS1 Programs", async () => {
      const driver = VSBrowser.instance.driver;

      // First click normally on PLIB1DS2PROGRAM
      await PLIB1DS2PROGRAM?.click();

      // Hold Shift and click PLIB1DS1PROGRAM
      if (PLIB1DS1PROGRAM) {
        await driver.actions().keyDown(Key.SHIFT).click(PLIB1DS1PROGRAM).keyUp(Key.SHIFT).perform();
      }
      resetAllScenarios();

      // Run the show library command from the command palette
      await runCommandAndGetTreeItems(
        cicsTree,
        ">IBM CICS for Zowe Explorer: Show Library",
        PROFILE_NAME,
        CICSEX61,
        await cicsex61Children[0].getLabel(),
        await regions[regionPROGLIBIndex].getLabel(),
        await regionK1Resources[programsResourceIndex].getLabel()
      );
    });

    it("Should Check The LIB1 With Different Datasets Under Region PROGLIB", async () => {
      const driver = VSBrowser.instance.driver;
      let foundLIB = false;
      let foundLIB1 = false;
      let foundLIB1DS1 = false;
      let foundLIB1DS2 = false;
      regionK1Resources[4].click();
      for (const item of regionK1Resources) {
        let resourceLabel = (await item.getLabel()).trim();
        if (resourceLabel.includes("Programs")) {
          await driver.actions().move({ origin: regionK1Resources[programsResourceIndex] }).click().perform();
          continue;
        }
        if (resourceLabel.includes(LIBRARIES_LIB1_LIB1_LABEL)) {
          foundLIB = true;
          while (true || !resourceLabel.includes(PIPELINES)) {
            resourceLabel = await getLabelAfterArrowDown(driver);
            if (resourceLabel === LIB1_PROGLIB_DS11_DS12_LABEL) {
              foundLIB1 = true;
            }
            if (resourceLabel === DS11) {
              foundLIB1DS1 = true;
            }
            if (resourceLabel === DS12) {
              foundLIB1DS2 = true;
              break;
            }
          }
        }
      }
      expect(foundLIB).to.be.equal(true);
      expect(foundLIB1).to.be.equal(true);
      expect(foundLIB1DS1).to.be.equal(true);
      expect(foundLIB1DS2).to.be.equal(true);
    });
  });
});

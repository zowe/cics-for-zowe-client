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
import { DefaultTreeSection, EditorView, SideBarView, TreeItem, VSBrowser, WebView } from "vscode-extension-tester";
import { CICSEX61, LIB3, LIBRARIES_LIB3_LABEL, PLIB3DS1, PROFILE_NAME, PROGRAMS } from "./util/constants";
import { runCommandAndGetTreeItems, runCommandFromCommandPalette } from "./util/globalMocks";
import { closeAllEditorsTabs, getCicsSection, openZoweExplorer, setupCICSTreeProgramParams, verifyProgramAttributes } from "./util/initSetup.test";
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
    let PLIB3DS1PROGRAM: TreeItem | undefined;
    it("Should Check If The Program PLIB3DS1 Is Present In Region PROGLIB", async () => {
      for (const program of programs) {
        if ((await program.getLabel()).trim() === PLIB3DS1) {
          PLIB3DS1PROGRAM = program;
        }
      }
      expect(PLIB3DS1PROGRAM).not.undefined;
      expect(await PLIB3DS1PROGRAM?.getLabel()).contains(PLIB3DS1);
    });

    it("Should Show Attributes Of The Program PLIB3DS1N", async () => {
      await PLIB3DS1PROGRAM?.click();
      await runCommandFromCommandPalette(">IBM CICS for Zowe Explorer: Show Attributes cics-extension-for-zowe.showPrgramAttributes");
    });

    it("Should Check If The Attributes Of The Program PLIB3DS1 Are Shown", async () => {
      await verifyProgramAttributes(PLIB3DS1, {
        Program: PLIB3DS1,
        Library: LIB3,
        Librarydsn: "",
      });
    });

    resetAllScenarios();

    it("Should Select PLIB3DS1 Program", async () => {
      await PLIB3DS1PROGRAM?.click();
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

    it("Should Check The LIB3 Library Under Region PROGLIB", async () => {
      const driver = VSBrowser.instance.driver;
      let foundLIB = false;
      for (const item of regionK1Resources) {
        const resourceLabel = (await item.getLabel()).trim();
        if (resourceLabel.includes(PROGRAMS)) {
          await driver.actions().move({ origin: regionK1Resources[programsResourceIndex] }).click().perform();
          continue;
        }
        if (resourceLabel.includes(LIBRARIES_LIB3_LABEL)) {
          foundLIB = true;
        }
      }
      expect(foundLIB).to.be.equal(true);
    });
  });
});

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
import { By, DefaultTreeSection, EditorView, SideBarView, TreeItem, WebElement, WebView } from "vscode-extension-tester";
import { resetAllScenarios } from "./resources/resetScenarios";
import { C128N, CICSEX61, DSNCUEXT, DSNTIA1, DSNTIAC, IBMRLIB1, IBMRSAD, PROFILE_NAME } from "./util/constants";
import { runCommandAndGetTreeItems, runCommandFromCommandPalette, sleep } from "./util/globalMocks";
import { closeAllEditorsTabs, getCicsSection, openZoweExplorer } from "./util/initSetup.test";

describe("Test Suite For Performing Actions On The Programs In CICSEX61", () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let editorView: EditorView;
  let wiremockServer: TreeItem | undefined;
  let cicsex61Children: TreeItem[];
  let regions: TreeItem[];
  let regionK1Resources: TreeItem[];
  let programs: TreeItem[];
  let regionIYCWENK1Index: number;
  let programsResourceIndex: number;

  before(async () => {
    await sleep(2000);
    view = await openZoweExplorer();
    cicsTree = await getCicsSection(view);

    wiremockServer = await cicsTree.findItem(PROFILE_NAME);
    expect(wiremockServer).exist;
  });

  after(async () => {
    await closeAllEditorsTabs();
  });

  describe("Test Suite For Checking Children Of Plex CICSEX61", () => {
    it("Should Check For Children Of Plex CICSEX61 And Verify If Regions Is Present", async () => {
      cicsex61Children = await cicsTree.openItem(PROFILE_NAME, CICSEX61);
      expect(cicsex61Children).not.empty;
      expect(await cicsex61Children[0].getLabel()).contains("Regions");
    });

    it("Should Check For Children Of Regions In CICSEX61 And Verify If Region IYCWENK1 Is Present", async () => {
      regions = await cicsTree.openItem(PROFILE_NAME, CICSEX61, await cicsex61Children[0].getLabel());
      expect(regions).not.empty;

      regionIYCWENK1Index = regions.findIndex(async (regionItem) => (await regionItem.getLabel()).trim().startsWith("IYCWENK1"));
      expect(regionIYCWENK1Index).to.be.greaterThan(-1);
    });

    it("Should Check For Children Of Region IYCWENK1 And Verify If Programs Is Present", async () => {
      // Open the CICStree and check for children of Region IYCWENK1 in CICSEX61 plex and make sure that Programs resource is present
      regionK1Resources = await cicsTree.openItem(PROFILE_NAME, CICSEX61, await cicsex61Children[0].getLabel(), await regions[0].getLabel());
      expect(regionK1Resources).not.empty;

      programsResourceIndex = regionK1Resources.findIndex(async (item) => (await item.getLabel()).trim().startsWith("Programs"));
      expect(programsResourceIndex).to.be.greaterThan(-1);
    });

    it("Should Check For Programs In Region IYCWENK1", async () => {
      await regionK1Resources[0].click();
      programs = await cicsTree.openItem(
        PROFILE_NAME,
        CICSEX61,
        await cicsex61Children[0].getLabel(),
        await regions[regionIYCWENK1Index].getLabel(),
        await regionK1Resources[programsResourceIndex].getLabel()
      );
      expect(programs).not.empty;
    });
    let C128NPROGRAM: TreeItem | undefined;
    let DSNCUEXTNPROGRAM: TreeItem | undefined;
    let DSNTIACPROGRAM: TreeItem | undefined;
    let DSNTIA1PROGRAM: TreeItem | undefined;
    let IBMRLIB1PROGRAM: TreeItem | undefined;
    let IBMRSADPROGRAM: TreeItem | undefined;

    it("Should Check If The Program C128N Is Present In Region IYCWENK1", async () => {
      for (const program of programs) {
        if ((await program.getLabel()).trim() === C128N) {
          C128NPROGRAM = program;
        }
        if ((await program.getLabel()).trim() === DSNCUEXT) {
          DSNCUEXTNPROGRAM = program;
        }
        if ((await program.getLabel()).trim() === DSNTIAC) {
          DSNTIACPROGRAM = program;
        }
        if ((await program.getLabel()).trim() === DSNTIA1) {
          DSNTIA1PROGRAM = program;
        }
        if ((await program.getLabel()).trim() === IBMRLIB1) {
          IBMRLIB1PROGRAM = program;
        }
        if ((await program.getLabel()).trim() === IBMRSAD) {
          IBMRSADPROGRAM = program;
        }
      }
      expect(C128NPROGRAM).not.undefined;
      expect(await C128NPROGRAM?.getLabel()).contains(C128N);
      expect(DSNCUEXTNPROGRAM).not.undefined;
      expect(await DSNCUEXTNPROGRAM?.getLabel()).contains(DSNCUEXT);
      expect(DSNTIACPROGRAM).not.undefined;
      expect(await DSNTIACPROGRAM?.getLabel()).contains(DSNTIAC);
      expect(DSNTIA1PROGRAM).not.undefined;
      expect(await DSNTIA1PROGRAM?.getLabel()).contains(DSNTIA1);
      expect(IBMRLIB1PROGRAM).not.undefined;
      expect(await IBMRLIB1PROGRAM?.getLabel()).contains(IBMRLIB1);
      expect(IBMRSADPROGRAM).not.undefined;
      expect(await IBMRSADPROGRAM?.getLabel()).contains(IBMRSAD);
    });

    it("Should Show Attributes Of The Program DSNCUEXTN", async () => {
      await DSNCUEXTNPROGRAM?.click();
      await runCommandFromCommandPalette(">IBM CICS for Zowe Explorer: Show Attributes cics-extension-for-zowe.showPrgramAttributes");
    });

    it("Should Check If The Attributes Of The Program DSNTIAC Are Shown", async () => {
      editorView = new EditorView();
      const editor = await editorView.openEditor(DSNTIAC); // or use the actual title if it's more complex
      const editorText = await editor.getText();

      // Now check if the expected attributes are present
      expect(editorText).to.include('"program": "DSNCUEXTN"');
      expect(editorText).to.include('"library": "CBSA"'); // replace with expected
      expect(editorText).to.include('"librarydsn": "CICSTS55.CICS.CBSA.LOADLIB"'); // replace with expected

    });


    it("Should Show Attributes Of The Program DSNTIAC", async () => {
      await DSNTIACPROGRAM?.click();
      await runCommandFromCommandPalette(">IBM CICS for Zowe Explorer: Show Attributes cics-extension-for-zowe.showPrgramAttributes");
    });

    it("Should Check If The Attributes Of The Program DSNTIAC Are Shown", async () => {
      editorView = new EditorView();
      const editor = await editorView.openEditor(DSNTIAC); // or use the actual title if it's more complex
      const editorText = await editor.getText();

      // Now check if the expected attributes are present
      expect(editorText).to.include('"program": "DSNTIAC"');
      expect(editorText).to.include('"library": "DFHR"'); // replace with expected
      expect(editorText).to.include('"librarydsn": "CICSTS55.CICS.SDFHLOAD"'); // replace with expected

    });


    it("Should select 2 programs", async () => {
      await DSNCUEXTNPROGRAM?.click();
      await DSNTIACPROGRAM?.click();

      // Run the show library command from the command palette
      await runCommandAndGetTreeItems(
        cicsTree,
        ">IBM CICS for Zowe Explorer: Show Library",
        PROFILE_NAME,
        CICSEX61,
        await cicsex61Children[0].getLabel(),
        await regions[regionIYCWENK1Index].getLabel(),
        await regionK1Resources[programsResourceIndex].getLabel()
      );

      //Now collapse the programs section
      await regionK1Resources[programsResourceIndex].collapse();

    });

    it("Should open the Libraries section under Region IYCWENK1", async () => {
      const librariesResourceIndex = regionK1Resources.findIndex(
        async (item) => (await item.getLabel()).trim().startsWith("Libraries")
    );

    expect(librariesResourceIndex).to.be.greaterThan(-1);

    const libraries = await cicsTree.openItem(
      PROFILE_NAME,
      CICSEX61,
      await cicsex61Children[0].getLabel(),
      await regions[regionIYCWENK1Index].getLabel(),
      await regionK1Resources[librariesResourceIndex].getLabel()
    );

    expect(libraries).not.empty;
  });

  });
});
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
import { C128N, CICSEX61, DSNCUEXT, DSNTIAC, REGIONS, REGIONS_LOADED, WIREMOCK_PROFILE_NAME } from "./util/constants";
import {
  findProgramByLabel,
  runCommandAndGetTreeItems,
  runCommandFromCommandPalette,
  sendArrowDownKeyAndPressEnter,
  sleep,
} from "./util/globalMocks";
import {
  clickCollapseAllsIconInCicsTree,
  closeAllEditorsTabs,
  getCicsSection,
  getPlexChildIndex,
  getPlexChildren,
  getRegionIndex,
  getRegionResourceIndex,
  getRegionsInPlex,
  openZoweExplorer,
} from "./util/initSetup.test";
import { resetAllScenarios } from "./util/resetScenarios";

describe("Test Suite For Performing Actions On The Programs In CICSEX61", () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let editorView: EditorView;
  let webView: WebView;
  let wiremockServer: TreeItem | undefined;
  let cicsex61Children: TreeItem[];
  let regionsIndex: number;
  let regions: TreeItem[];
  let regionK1Resources: TreeItem[];
  let programs: TreeItem[];
  let regionIYCWENK1Index: number;
  let programsResourceIndex: number;

  before(async () => {
    await sleep(2000);
    view = await openZoweExplorer();
    cicsTree = await getCicsSection(view);

    wiremockServer = await cicsTree.findItem(WIREMOCK_PROFILE_NAME);
    expect(wiremockServer).exist;
  });

  after(async () => {
    await closeAllEditorsTabs();
    await clickCollapseAllsIconInCicsTree(cicsTree);
  });

  describe("Test Suite For Checking Children Of Plex CICSEX61", () => {
    it("Should Check For Children Of Plex CICSEX61 And Verify If Regions Is Present", async () => {
      cicsex61Children = await getPlexChildren(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61);
      expect(cicsex61Children).not.empty;

      regionsIndex = await getPlexChildIndex(cicsex61Children, REGIONS);
      expect(regionsIndex).to.be.greaterThan(-1);
      cicsTree.takeScreenshot();
    });

    it("Should Check For Children Of Regions In CICSEX61 And Verify If Region IYCWENK1 Is Present", async () => {
      regions = await getRegionsInPlex(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61);
      expect(regions).not.empty;

      regionIYCWENK1Index = await getRegionIndex(regions, "IYCWENK1");
      expect(regionIYCWENK1Index).to.be.greaterThan(-1);
      cicsTree.takeScreenshot();
    });

    it("Should Check For Children Of Region IYCWENK1 And Verify If Programs Is Present", async () => {
      // Open the CICStree and check for children of Region IYCWENK1 in CICSEX61 plex and make sure that Programs resource is present
      regionK1Resources = await cicsTree.openItem(WIREMOCK_PROFILE_NAME, CICSEX61, REGIONS_LOADED, await regions[regionIYCWENK1Index].getLabel());
      expect(regionK1Resources).not.empty;

      programsResourceIndex = await getRegionResourceIndex(regionK1Resources, "Programs");
      expect(programsResourceIndex).to.be.greaterThan(-1);
      cicsTree.takeScreenshot();
    });

    it("Should Check For Programs In Region IYCWENK1", async () => {
      await resetAllScenarios();
      programs = await cicsTree.openItem(
        WIREMOCK_PROFILE_NAME,
        CICSEX61,
        REGIONS_LOADED,
        await regions[regionIYCWENK1Index].getLabel(),
        await regionK1Resources[programsResourceIndex].getLabel()
      );
      expect(programs).not.empty;
      cicsTree.takeScreenshot();
    });
  });

  describe("Test Suite For Performing Disable And Enable Program Actions On Program C128N In Region IYCWENK1 In Plex CICSEX61", () => {
    let C128NProgram: TreeItem | undefined;

    it("Should Check If The Program C128N Is Present In Region IYCWENK1", async () => {
      C128NProgram = await findProgramByLabel(programs, C128N);
      expect(C128NProgram).not.undefined;
      expect(await C128NProgram?.getLabel()).contains(C128N);
      cicsTree.takeScreenshot();
    });

    it("Should Disable The Program C128N", async () => {
      // Navigate to the C128N program in the tree
      await sendArrowDownKeyAndPressEnter(5);

      // Run the disable command from the command palette
      // And get the programs in region IYCWENK1 in plex CICSEX61 to get updated state
      programs = await runCommandAndGetTreeItems(
        cicsTree,
        ">IBM CICS for Zowe Explorer: Disable Program",
        WIREMOCK_PROFILE_NAME,
        CICSEX61,
        REGIONS_LOADED,
        await regions[regionIYCWENK1Index].getLabel(),
        await regionK1Resources[programsResourceIndex].getLabel()
      );

      expect(await C128NProgram?.getLabel()).contains(C128N + " (Disabled)");
      cicsTree.takeScreenshot();
    });

    it("Should Enable The Program C128N", async () => {
      await sendArrowDownKeyAndPressEnter(5);

      // Run the enable command from the command palette
      // And get the programs in region IYCWENK1 in plex CICSEX61 to get updated state
      programs = await runCommandAndGetTreeItems(
        cicsTree,
        ">IBM CICS for Zowe Explorer: Enable Program",
        WIREMOCK_PROFILE_NAME,
        CICSEX61,
        REGIONS_LOADED,
        await regions[regionIYCWENK1Index].getLabel(),
        await regionK1Resources[programsResourceIndex].getLabel()
      );

      expect(await C128NProgram?.getLabel()).contains(C128N);
      expect(await C128NProgram?.getLabel()).not.contains("Disabled");
      cicsTree.takeScreenshot();
    });
  });

  describe("Test Suite For Performing New Copy Action On Program DSNCUEXT In Region IYCWENK1 In Plex CICSEX61", () => {
    let DSNCUEXTprogram: TreeItem | undefined;

    it("Should Check If The Program DSNCUEXT Is Present In Region IYCWENK1", async () => {
      DSNCUEXTprogram = await findProgramByLabel(programs, DSNCUEXT);
      expect(DSNCUEXTprogram).not.undefined;
      expect(await DSNCUEXTprogram?.getLabel()).contains(DSNCUEXT);
    });

    it("Should Perform New Copy Action On The Program DSNCUEXT", async () => {
      await sendArrowDownKeyAndPressEnter(6);

      const newcopyIcon = await DSNCUEXTprogram?.getActionButton("New Copy");
      expect(newcopyIcon).not.undefined;
      await newcopyIcon?.click();

      programs = await cicsTree.openItem(
        WIREMOCK_PROFILE_NAME,
        CICSEX61,
        REGIONS_LOADED,
        await regions[regionIYCWENK1Index].getLabel(),
        await regionK1Resources[programsResourceIndex].getLabel()
      );

      expect(await DSNCUEXTprogram?.getLabel()).contains(DSNCUEXT + " (New copy count: 1)");
      cicsTree.takeScreenshot();
    });
  });

  describe("Test Suite For Performing Show Attributes Action On Program DSNTIAC In Region IYCWENK1 In Plex CICSEX61", () => {
    let DSNTIACProgram: TreeItem | undefined;

    it("Should Check If The Program DSNTIAC Is Present In Region IYCWENK1", async () => {
      DSNTIACProgram = await findProgramByLabel(programs, DSNTIAC);
      expect(DSNTIACProgram).not.undefined;
      expect(await DSNTIACProgram?.getLabel()).contains(DSNTIAC);
      cicsTree.takeScreenshot();
    });

    it("Should Show Attributes Of The Program DSNTIAC", async () => {
      await sendArrowDownKeyAndPressEnter(8);
      await runCommandFromCommandPalette(">IBM CICS for Zowe Explorer: Show Attributes cics-extension-for-zowe.showPrgramAttributes");

      editorView = new EditorView();
      const titles = await editorView.getOpenEditorTitles();
      expect(titles).not.empty;
      expect(titles.some((title) => title.includes("CICSProgram IYCWENK1(" + DSNTIAC + ")"))).is.true;
      cicsTree.takeScreenshot();
    });

    it("Should Check If The Search Bar Is Working And The Value Of Program Is Correct In The Attributes Editor", async () => {
      webView = (await new EditorView().openEditor("CICSProgram IYCWENK1(" + DSNTIAC + ")")) as WebView;
      expect(webView).not.undefined;
      await webView.switchToFrame();

      const table = await webView.findWebElement(By.id("resultsTable"));
      expect(table).not.undefined;

      const tableRows = await table.findElements(By.css("tr"));
      expect(tableRows).not.empty;

      const searchBar = await webView.findWebElement(By.id("searchBox"));
      expect(searchBar).not.undefined;

      // Type in the search bar in the attributes editor and press Enter
      await searchBar.sendKeys("P");
      await searchBar.sendKeys("\uE007");

      // Filter only visible rows
      const visibleSearchResults: WebElement[] = [];
      for (const row of tableRows) {
        if (await row.isDisplayed()) {
          visibleSearchResults.push(row);
        }
      }
      expect(visibleSearchResults.length).to.be.lessThan(tableRows.length);

      for (const row of visibleSearchResults) {
        // Find the <th> in this row to get the key
        const key = await row.findElement(By.css("th")).getText();
        if (key.trim().toLowerCase() === "program") {
          // Find the <td> in this row to get the value
          const value = await row.findElement(By.css("td")).getText();
          expect(value).contains(DSNTIAC);
        }
      }

      await searchBar.clear();
      await webView.switchBack();
      cicsTree.takeScreenshot();
    });
  });
});

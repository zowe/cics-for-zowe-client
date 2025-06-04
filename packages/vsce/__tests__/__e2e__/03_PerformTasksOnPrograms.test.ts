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
import { C128N, CICSEX61, DSNTIAC, PROFILE_NAME } from "./util/constants";
import { findProgramByLabel, runCommandAndGetTreeItems, runCommandFromCommandPalette, sleep } from "./util/globalMocks";
import { closeAllEditorsTabs, getCicsSection, openZoweExplorer } from "./util/initSetup.test";
import { resetAllScenarios } from "./util/resetScenarios";

describe("Test Suite For Performing Actions On The Programs In CICSEX61", () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let editorView: EditorView;
  let webView: WebView;
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
      cicsTree.takeScreenshot();
    });

    it("Should Check For Children Of Regions In CICSEX61 And Verify If Region IYCWENK1 Is Present", async () => {
      regions = await cicsTree.openItem(PROFILE_NAME, CICSEX61, await cicsex61Children[0].getLabel());
      expect(regions).not.empty;

      regionIYCWENK1Index = regions.findIndex(async (regionItem) => (await regionItem.getLabel()).trim().startsWith("IYCWENK1"));
      expect(regionIYCWENK1Index).to.be.greaterThan(-1);
      cicsTree.takeScreenshot();
    });

    it("Should Check For Children Of Region IYCWENK1 And Verify If Programs Is Present", async () => {
      // Open the CICStree and check for children of Region IYCWENK1 in CICSEX61 plex and make sure that Programs resource is present
      regionK1Resources = await cicsTree.openItem(PROFILE_NAME, CICSEX61, await cicsex61Children[0].getLabel(), await regions[0].getLabel());
      expect(regionK1Resources).not.empty;

      programsResourceIndex = regionK1Resources.findIndex(async (item) => (await item.getLabel()).trim().startsWith("Programs"));
      expect(programsResourceIndex).to.be.greaterThan(-1);
      cicsTree.takeScreenshot();
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
      cicsTree.takeScreenshot();
    });
  });

  describe("Test Suite For Performing Disable And Enable Program Actions On Program C128N In Region IYCWENK1 In Plex CICSEX61", () => {
    let C128Nprogram: TreeItem | undefined;

    before(async () => {
      await resetAllScenarios();
    });

    it("Should Check If The Program C128N Is Present In Region IYCWENK1", async () => {
      C128Nprogram = await findProgramByLabel(programs, C128N);
      expect(C128Nprogram).not.undefined;
      expect(await C128Nprogram?.getLabel()).contains(C128N);
      cicsTree.takeScreenshot();
    });

    it("Should Disable The Program C128N", async () => {
      expect(await C128Nprogram?.isSelected()).to.be.false;
      await C128Nprogram?.select();
      await sleep(1000);

      // Run the disable command from the command palette
      // And get the programs in region IYCWENK1 in plex CICSEX61 to get updated state
      await runCommandAndGetTreeItems(
        cicsTree,
        ">IBM CICS for Zowe Explorer: Disable Program",
        PROFILE_NAME,
        CICSEX61,
        await cicsex61Children[0].getLabel(),
        await regions[regionIYCWENK1Index].getLabel(),
        await regionK1Resources[programsResourceIndex].getLabel()
      );

      expect(await C128Nprogram?.getLabel()).contains(C128N + " (Disabled)");
      cicsTree.takeScreenshot();
    });

    it("Should Enable The Program C128N", async () => {
      await C128Nprogram?.select();
      await sleep(1000);
      // Run the enable command from the command palette
      // And get the programs in region IYCWENK1 in plex CICSEX61 to get updated state
      await runCommandAndGetTreeItems(
        cicsTree,
        ">IBM CICS for Zowe Explorer: Enable Program",
        PROFILE_NAME,
        CICSEX61,
        await cicsex61Children[0].getLabel(),
        await regions[regionIYCWENK1Index].getLabel(),
        await regionK1Resources[programsResourceIndex].getLabel()
      );

      expect(await C128Nprogram?.getLabel()).contains(C128N);
      expect(await C128Nprogram?.getLabel()).not.contains("Disabled");
      cicsTree.takeScreenshot();
    });
  });

  describe("Test Suite For Performing Show Attributes Action On Program DSNTIAC In Region IYCWENK1 In Plex CICSEX61", () => {
    let DSNTIACprogram: TreeItem | undefined;

    before(async () => {
      await resetAllScenarios();
    });

    it("Should Check If The Program DSNTIAC Is Present In Region IYCWENK1", async () => {
      DSNTIACprogram = await findProgramByLabel(programs, DSNTIAC);
      expect(DSNTIACprogram).not.undefined;
      expect(await DSNTIACprogram?.getLabel()).contains(DSNTIAC);
      cicsTree.takeScreenshot();
    });

    it("Should Show Attributes Of The Program DSNTIAC", async () => {
      await DSNTIACprogram?.select();
      await runCommandFromCommandPalette(">IBM CICS for Zowe Explorer: Show Attributes cics-extension-for-zowe.showPrgramAttributes");
      cicsTree.takeScreenshot();
    });

    it("Should Check If The Attributes Of The Program DSNTIAC Are Shown", async () => {
      editorView = new EditorView();
      const titles = await editorView.getOpenEditorTitles();
      expect(titles).not.empty;
      expect(titles.some((title) => title.includes("CICS Program IYCWENK1(" + DSNTIAC + ")"))).is.true;
      cicsTree.takeScreenshot();
    });

    it("Should Check If The Search Bar Is Working And The Value Of Program Is Correct In The Attributes Editor", async () => {
      webView = (await new EditorView().openEditor("CICS Program IYCWENK1(" + DSNTIAC + ")")) as WebView;
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

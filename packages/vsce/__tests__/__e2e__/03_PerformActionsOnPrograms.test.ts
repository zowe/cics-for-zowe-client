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
  findProgramTreeNodeByLabel,
  runCommandAndGetTreeItems,
  runCommandFromCommandPalette,
  sendArrowDownKeyAndPressEnter,
  sleep,
} from "./util/globalMocks";
import {
  clickCollapseAllsIconInCicsTree,
  closeAllEditorsTabs,
  expectTreeItemIsSelected,
  getCicsSection,
  getPlexChildIndex,
  getPlexChildren,
  getRegionIndex,
  getRegionResourceIndex,
  getRegionsInPlex,
  openZoweExplorer,
} from "./util/initSetup.test";
import { resetAllScenarios } from "./util/resetScenarios";

describe("Perform Actions On Programs", () => {
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
    await sleep(1900);
    view = await openZoweExplorer();
    cicsTree = await getCicsSection(view);

    wiremockServer = await cicsTree.findItem(WIREMOCK_PROFILE_NAME);
    expect(wiremockServer).exist;
    await sleep(100);
  });

  after(async () => {
    await closeAllEditorsTabs();
    await clickCollapseAllsIconInCicsTree(cicsTree);
  });

  describe("Checking Children of CICSEX61", () => {
    it("Verify CICSEX61 -> Regions", async () => {
      cicsex61Children = await getPlexChildren(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61);
      expect(cicsex61Children).not.empty;

      regionsIndex = await getPlexChildIndex(cicsex61Children, REGIONS);
      expect(regionsIndex).to.be.greaterThan(-1);
      cicsTree.takeScreenshot();
    });

    it("Verify CICSEX61 -> Regions -> IYCWENK1", async () => {
      regions = await getRegionsInPlex(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61);
      expect(regions).not.empty;

      regionIYCWENK1Index = await getRegionIndex(regions, "IYCWENK1");
      expect(regionIYCWENK1Index).to.be.greaterThan(-1);
      cicsTree.takeScreenshot();
    });

    it("Verify CICSEX61 -> Regions -> IYCWENK1 -> Programs", async () => {
      // Open the CICStree and check for children of Region IYCWENK1 in CICSEX61 plex and make sure that Programs resource is present
      regionK1Resources = await cicsTree.openItem(WIREMOCK_PROFILE_NAME, CICSEX61, REGIONS_LOADED, await regions[regionIYCWENK1Index].getLabel());
      expect(regionK1Resources).not.empty;

      programsResourceIndex = await getRegionResourceIndex(regionK1Resources, "Programs");
      expect(programsResourceIndex).to.be.greaterThan(-1);
      cicsTree.takeScreenshot();
    });

    it("Verify IYCWENK1 -> Programs", async () => {
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

  describe("Performing Disable And Enable On Program CICSEX61 -> IYCWENK1 -> C128N", () => {
    let C128NProgram: TreeItem | undefined;

    it("Check C128N Is Present In IYCWENK1", async () => {
      C128NProgram = await findProgramTreeNodeByLabel(programs, C128N);
      expect(C128NProgram).not.undefined;
      expect(await C128NProgram?.getLabel()).contains(C128N);
      cicsTree.takeScreenshot();
    });

    it("Disable C128N", async () => {
      // Navigate to the C128N program in the tree
      await sendArrowDownKeyAndPressEnter(5);
      await expectTreeItemIsSelected(C128NProgram);

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

    it("Enable C128N", async () => {
      await sendArrowDownKeyAndPressEnter(5);
      await expectTreeItemIsSelected(C128NProgram);

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

  describe("Performing New Copy Action On Program CICSEX61 -> IYCWENK1 -> DSNCUEXT", () => {
    let DSNCUEXTProgram: TreeItem | undefined;

    it("Check DSNCUEXT Is Present In IYCWENK1", async () => {
      DSNCUEXTProgram = await findProgramTreeNodeByLabel(programs, DSNCUEXT);
      expect(DSNCUEXTProgram).not.undefined;
      expect(await DSNCUEXTProgram?.getLabel()).contains(DSNCUEXT);
    });

    it("New Copy DSNCUEXT", async () => {
      await sendArrowDownKeyAndPressEnter(6);
      await expectTreeItemIsSelected(DSNCUEXTProgram);

      const newcopyIcon = await DSNCUEXTProgram?.getActionButton("New Copy");
      expect(newcopyIcon).not.undefined;
      await newcopyIcon?.click();

      programs = await cicsTree.openItem(
        WIREMOCK_PROFILE_NAME,
        CICSEX61,
        REGIONS_LOADED,
        await regions[regionIYCWENK1Index].getLabel(),
        await regionK1Resources[programsResourceIndex].getLabel()
      );

      expect(await DSNCUEXTProgram?.getLabel()).contains(DSNCUEXT + " (New copy count: 1)");
      cicsTree.takeScreenshot();
    });
  });

  describe("Performing Show Attributes Action On Program CICSEX61 -> IYCWENK1 -> DSNTIAC", () => {
    let DSNTIACProgram: TreeItem | undefined;

    it("Check DSNTIAC Is Present In IYCWENK1", async () => {
      DSNTIACProgram = await findProgramTreeNodeByLabel(programs, DSNTIAC);
      expect(DSNTIACProgram).not.undefined;
      expect(await DSNTIACProgram?.getLabel()).contains(DSNTIAC);
      cicsTree.takeScreenshot();
    });

    it("Show Attributes On DSNTIAC", async () => {
      await sendArrowDownKeyAndPressEnter(8);
      await expectTreeItemIsSelected(DSNTIACProgram);
      await runCommandFromCommandPalette(">IBM CICS for Zowe Explorer: Show Attributes");

      editorView = new EditorView();
      const titles = await editorView.getOpenEditorTitles();
      expect(titles).not.empty;
      expect(titles.some((title) => title.includes("CICSProgram IYCWENK1(" + DSNTIAC + ")"))).is.true;
      cicsTree.takeScreenshot();
    });

    it("Search For Program Value", async () => {
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

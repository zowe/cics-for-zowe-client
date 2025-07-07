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
import { BottomBarPanel, By, DefaultTreeSection, SideBarView, TreeItem, WebElement, WebviewView } from "vscode-extension-tester";
import { C128N, CICSEX61, IYCWENK1, PROGRAMS, WIREMOCK_PROFILE_NAME } from "./util/constants";
import { findProgramTreeNodeByLabel, runCommandFromCommandPalette, sleep } from "./util/globalMocks";
import {
  clickCollapseAllsIconInCicsTree,
  closeAllEditorsTabs,
  getCicsSection,
  openZoweExplorer,
  setupCICSTreeSelectedResourceParams,
} from "./util/initSetup.test";
import { resetAllScenarios } from "./util/resetScenarios";

describe("Show Resource Inspector For Programs", () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let webviewView: WebviewView;
  let wiremockServer: TreeItem | undefined;
  let cicsPlexChildren: TreeItem[];
  let regionIndex: number;
  let regions: TreeItem[];
  let regionK1Resources: TreeItem[];
  let programs: TreeItem[];
  let regionIYCWENK1Index: number;
  let programsResourceIndex: number;
  let C128NProgram: TreeItem | undefined;
  let resourceInspectorPanel: BottomBarPanel;
  let resourceInspectorRoot: WebElement;
  let tables: WebElement[];
  let headerTable: WebElement;
  let attributesTable: WebElement;

  before(async () => {
    await sleep(1900);
    view = await openZoweExplorer();
    cicsTree = await getCicsSection(view);

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
      cicsPlexChildren: cicsPlexChildren,
      regionIndex: regionIndex,
      regions: regions,
      selectedRegionIndex: regionIYCWENK1Index,
      selectedRegionResources: regionK1Resources,
      selectedResourceIndex: programsResourceIndex,
      selectedResource: programs,
    } = await setupCICSTreeSelectedResourceParams(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61, IYCWENK1, PROGRAMS));

    cicsTree.takeScreenshot();
  });

  it("Check Program C128N Is In Region IYCWENK1", async () => {
    C128NProgram = await findProgramTreeNodeByLabel(programs, C128N);
    expect(C128NProgram).not.undefined;
    expect(await C128NProgram?.getLabel()).contains(C128N);
    cicsTree.takeScreenshot();
  });

  it("Open Resource Inspector on C128N", async () => {
    await C128NProgram?.click();
    await runCommandFromCommandPalette(">IBM CICS for Zowe Explorer: Inspect Resource");

    resourceInspectorPanel = new BottomBarPanel();
    await resourceInspectorPanel.openTab("CICS Resource Inspector");

    // Find the selected <li> tab and its <a> tag to verify the tab name
    const tabElement = await resourceInspectorPanel.findElement(By.css("li[role='tab'][aria-selected='true']"));
    const aTag = await tabElement.findElement(By.css("a"));
    const ariaLabel = await aTag.getAttribute("aria-label");
    expect(ariaLabel).to.equal("CICS Resource Inspector");
    cicsTree.takeScreenshot();
  });

  it("Verify Program Name In Header", async () => {
    webviewView = new WebviewView();
    await webviewView.switchToFrame();

    resourceInspectorRoot = await webviewView.findWebElement(By.id("webviewRoot"));
    expect(resourceInspectorRoot).not.undefined;

    tables = await resourceInspectorRoot.findElements(By.css("table"));
    expect(tables.length).to.be.at.least(2);

    headerTable = tables[0];
    expect(headerTable).not.undefined;

    // Find the header in the table and verify the name of the program
    const header = await headerTable.findElements(By.css("thead th div"));
    const headerTexts: string[] = [];
    for (const div of header) {
      headerTexts.push(await div.getText());
    }
    expect(headerTexts).to.include(C128N);

    await webviewView.switchBack();
    cicsTree.takeScreenshot();
  });

  it("Verify Program Attributes In Resource Inspector", async () => {
    await webviewView.switchToFrame();

    attributesTable = tables[1];
    expect(attributesTable).not.undefined;

    const attributesTablerows = await attributesTable.findElements(By.css("tbody tr"));
    expect(attributesTablerows.length).to.be.greaterThan(0);

    const expectedAttributes = [
      { attribute: "program", value: C128N },
      { attribute: "status", value: "enabled" },
    ];

    // Go through each row in the table and verify the expected attributes
    for (const row of attributesTablerows) {
      const tds = await row.findElements(By.css("td"));
      if (tds.length >= 2) {
        const attribute = (await tds[0].getText()).trim().toLowerCase();
        const value = (await tds[1].getText()).trim().toLowerCase();
        for (const expected of expectedAttributes) {
          if (attribute === expected.attribute.toLowerCase()) {
            expect(value).to.include(
              expected.value.toLowerCase(),
              `Expected value for ${expected.attribute} to include ${expected.value}, but got ${value}`
            );
          }
        }
      }
    }

    await webviewView.switchBack();
    await resourceInspectorPanel.toggle(false);
    cicsTree.takeScreenshot();
  });
});

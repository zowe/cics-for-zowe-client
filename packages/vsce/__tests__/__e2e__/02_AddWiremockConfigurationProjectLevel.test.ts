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

import { assert, expect } from "chai";
import { ActivityBar, DefaultTreeSection, EditorView, InputBox, TreeItem, VSBrowser } from "vscode-extension-tester";

describe("Create Project Level WireMock File Scenario", () => {
  let cicsTree: DefaultTreeSection;
  let quickPick: InputBox;
  let editorView: EditorView;

  before(async function () {
    // switch to the cics extension view
    const zoweExplorer = await new ActivityBar().getViewControl("Zowe Explorer");
    assert(zoweExplorer !== undefined);
    const view = await zoweExplorer.openView();
    cicsTree = await view.getContent().getSection("cics");

    // click the plus icon in cics
    await cicsTree.click();
    await cicsTree.expand();
    const plusIcon = await cicsTree.getAction(`Create a CICS Profile`);
    assert(typeof plusIcon !== "undefined");
    await plusIcon.click();
  });

  it("Quick Pick Option test", async () => {
    // Find quickpick
    quickPick = await InputBox.create();
    const qpItems = await quickPick.getQuickPicks();
    const qpLen = qpItems.length;

    // selecting wiremock_server from the quickpick
    for(let i=0; i<qpLen; i++){
        const wiremocklabel = await qpItems[i].getLabel();
        if(wiremocklabel.includes("wiremock_server")){
            expect(wiremocklabel).contains("wiremock_server")
            await quickPick.selectQuickPick(i);
            break;
        }
    }
    cicsTree.takeScreenshot();
  });

  it("WireMock Server available test", async ()=>{
    // checking if wiremock_server is available in the cics section
    const potentialWireMockServer = await cicsTree.findItem("wiremock_server");
    assert(typeof potentialWireMockServer !== "undefined");
    const wireMockServer = potentialWireMockServer;
    expect(wireMockServer).exist;
    wireMockServer.click();
    cicsTree.takeScreenshot();
  });
});

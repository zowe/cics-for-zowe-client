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
import { ActivityBar, DefaultTreeSection, EditorView, InputBox, TreeItem, TextEditor } from "vscode-extension-tester";
import { addNewProfile, restoreOriginalProfile} from "./e2e_globalMocks";

describe("Test Suite For Adding Wiremock Profile And Listing The Regions In CICS", () => {
    let cicsTree: DefaultTreeSection;
    let quickPick: InputBox;
    let editorView: EditorView;
    const text = "wiremock_server";

    before(async () => {
        // Switch to the cics extension view
        const zoweExplorer = await new ActivityBar().getViewControl("Zowe Explorer");
        assert(zoweExplorer !== undefined);
        const view = await zoweExplorer.openView();
        cicsTree = await view.getContent().getSection("cics");
    });

    beforeEach(async () => {
        // Expand the cics section
        await cicsTree.click();
        await cicsTree.expand();
    });

    describe("Adding Wiremock Profile In The Configuration File", () => {
        it("Should Add Wiremock Profile", async () => {
            // Add wiremock profile to the zowe.config.json
            addNewProfile();
            
            // Find open editors
            editorView = new EditorView();
            const titles = await editorView.getOpenEditorTitles();

            // Check zowe.config.json was opened - could check content here
            expect(titles.some((title) => title.startsWith("zowe.config.json"))).is.true;

            // Check if wiremock profile is added to the zowe.config.json
            const editor = await editorView.openEditor("zowe.config.json") as TextEditor;
            const isWmAvailable = await editor.getText()
            expect(isWmAvailable.includes(text)).to.be.true;    
        });
    });

    describe("Check For The Wiremock Profile And List The Regions", async () => {
        let wiremockServer: TreeItem;

        it("Quick Pick Option test", async () => {
            // Click the plus icon in cics
            const plusIcon = await cicsTree.getAction(`Create a CICS Profile`);
            assert(typeof plusIcon !== "undefined");
            await plusIcon.click();

            // Find quickpick
            quickPick = await InputBox.create();
            const qpItems = await quickPick.getQuickPicks();
            const qpLen = qpItems.length;
        
            // Selecting wiremock_server from the quickpick
            let i, wiremockLabel;
            for(i=0; i<qpLen; i++){
                wiremockLabel = await qpItems[i].getLabel();
                if(wiremockLabel.includes(text)){
                    break;
                }
            }
            expect(wiremockLabel).contains(text);
            if(i<qpLen){
              await quickPick.selectQuickPick(i);
            }
            cicsTree.takeScreenshot();
          });

        it("Wiremock Profile Available Under CICS Section Test", async ()=>{
            // Checking if wiremock_server profile is available under the cics section
            const potentialWireMockServer = await cicsTree.findItem(text);
            assert(typeof potentialWireMockServer !== "undefined");
            wiremockServer = potentialWireMockServer;
            expect(wiremockServer).exist;
            cicsTree.takeScreenshot();
          });

        it("Should List The Regions Under Wiremock Profile", async () => {
            // Expand the wiremock_server profile and list the regions under it
            await wiremockServer.click();
            await wiremockServer.expand();
            expect(await wiremockServer.getLabel()).equals("wiremock_server");
            const wmItems = await wiremockServer.getChildren();
            console.log(wmItems);

            /*const label1 =  await wmItems[0].getLabel();
            expect(label1).contains("CICSEX61");
        
            const label2 =  await wmItems[1].getLabel();
            expect(label2).contains("DUMMY907");*/
          });
    });

    after(async () => {
        // Remove the wiremock profile
        restoreOriginalProfile();
        
        // Checking if the wiremock profile is removed
        editorView = new EditorView();
        let editor = await editorView.openEditor("zowe.config.json") as TextEditor;
        let isWmAvailable = await editor.getText()
        expect(isWmAvailable.includes(text)).not.to.be.true;
    });
});
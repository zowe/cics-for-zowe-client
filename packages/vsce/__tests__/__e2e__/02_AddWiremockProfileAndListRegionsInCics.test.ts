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
import { ActivityBar, DefaultTreeSection, EditorView, InputBox, TreeItem, TextEditor, ViewPanelAction } from "vscode-extension-tester";
import { addWiremockProfileToConfigFile, sleep } from "./e2e_globalMocks";

describe("Test Suite For Adding Wiremock Profile And Listing The Regions In CICS", () => {
    let cicsTree: DefaultTreeSection;
    let quickPick: InputBox;
    let editorView: EditorView;
    const profileName = "wiremock_server";

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
            addWiremockProfileToConfigFile();
            
            // Find open editors
            editorView = new EditorView();
            const titles = await editorView.getOpenEditorTitles();

            // Check zowe.config.json was opened - could check content here
            expect(titles.some((title) => title.startsWith("zowe.config.json"))).is.true;

            // Check if wiremock profile is added to the zowe.config.json
            const editor = await editorView.openEditor("zowe.config.json") as TextEditor;
            const isWmAvailable = await editor.getText()
            expect(isWmAvailable.includes(profileName)).to.be.true;    
        });
    });

    describe("Check For The Wiremock Profile And List The Regions", async () => {
        let wiremockServer: TreeItem | undefined;

        it("Should Add The Wiremock CICS Profile To The Tree Using The Create Profile Toolbar Option", async () => {
            // Click the plus icon in cics
            const plusIcon: ViewPanelAction | undefined = await cicsTree.getAction(`Create a CICS Profile`);
            await plusIcon?.click();

            // Find quickpick
            quickPick = await InputBox.create();
            const qpItems = await quickPick.getQuickPicks();
            const qpLen = qpItems.length;
        
            // Selecting wiremock_server from the quickpick
            let i, wiremockLabel;
            for(i=0; i<qpLen; i++){
                wiremockLabel = await qpItems[i].getLabel();
                if(wiremockLabel.includes(profileName)){
                    break;
                }
            }
            expect(wiremockLabel).contains(profileName);
            if(i<qpLen){
              await quickPick.selectQuickPick(i);
            }
            cicsTree.takeScreenshot();
          });

        it("Should Display Wiremock Profile Under CICS Section", async ()=>{
            // Checking if wiremock_server profile is available under the cics section
            wiremockServer = await cicsTree.findItem(profileName);
            expect(wiremockServer).exist;
            cicsTree.takeScreenshot();
          });

        it("Should List The Regions Under Wiremock Profile", async () => {
            // Expand the wiremock_server profile and list the regions under it
            await wiremockServer?.click();
            await wiremockServer?.collapse();
            await sleep(200);
            expect(await wiremockServer?.isExpandable()).to.be.true;
            await wiremockServer?.expand();

            // Title check for wiremork profile
            const wmSeverLabel = await wiremockServer?.getLabel();
            expect(wmSeverLabel).equals("wiremock_server");

            // Check the plexes under wiremock profile
            const wmItems: TreeItem[]| undefined = await wiremockServer?.getChildren();
            const wmLen = wmItems?.length;
            expect(wmLen).equals(2);

            const plex1 = await wmItems?.at(0)?.getLabel();
            expect(plex1).contains("CICSEX61");

            const plex2 = await wmItems?.at(1)?.getLabel();
            expect(plex2).contains("DUMMY907");
            cicsTree.takeScreenshot();
          });
    });
});
// /**
//  * This program and the accompanying materials are made available under the terms of the
//  * Eclipse Public License v2.0 which accompanies this distribution, and is available at
//  * https://www.eclipse.org/legal/epl-v20.html
//  *
//  * SPDX-License-Identifier: EPL-2.0
//  *
//  * Copyright Contributors to the Zowe Project.
//  *
//  */

// import { assert, expect } from "chai";
// import { ActivityBar, DefaultTreeSection, EditorView, InputBox } from "vscode-extension-tester";

// describe("Edit Global Team Configuration File Scenario", () => {
//   let cicsTree: DefaultTreeSection;
//   let quickPick: InputBox;
//   let editorView: EditorView;

//   before(async function () {
//     // open the cics extension view
//     const zoweExplorer = await new ActivityBar().getViewControl("Zowe Explorer");
//     assert(zoweExplorer !== undefined);
//     const view = await zoweExplorer.openView();
//     cicsTree = await view.getContent().getSection("cics");
//   });

//   after(async () => {
//     // Close all open editor tabs
//     editorView.closeAllEditors();
//   });

//   it("CICS Section title Check", async () => {
//     // title check for cics section
//     const title = await cicsTree.getTitle();
//     expect(title).equals("cics");
//   });

//   it("+ (plus) button clickable test", async () => {
//     // selecting cics view and clicking + icon
//     await cicsTree.click();
//     await cicsTree.expand();
//     const potentialPlusIcon = await cicsTree.getAction(`Create a CICS Profile`);
//     assert(typeof potentialPlusIcon !== "undefined");
//     const plusIcon = potentialPlusIcon;
//     expect(plusIcon).exist;
//     cicsTree.takeScreenshot();
//     await plusIcon.click();
//   });

//   it("Quick Pick Option test", async () => {
//     // Find quickpick
//     quickPick = await InputBox.create();
//     const qpItems = await quickPick.getQuickPicks();

//     const label1 = await qpItems[0].getLabel();
//     expect(label1).contains("Create a New Team Configuration File");

//     const label2 = await qpItems[1].getLabel();
//     expect(label2).contains("Edit Team Configuration File");

//     const placeholder = await quickPick.getPlaceHolder();
//     expect(placeholder).equals('Choose "Create new..." to define or select a profile to add to the CICS tree');
//     cicsTree.takeScreenshot();
//   });

//   it("Edit Team Configuration File test", async () => {
//     // Find quickpick
//     quickPick = await InputBox.create();
//     await quickPick.selectQuickPick(1);

//     const qpItems = await quickPick.getQuickPicks();

//     const label1 = await qpItems[0].getLabel();
//     expect(label1).contains("Global: in the Zowe home directory");

//     const label2 = await qpItems[1].getLabel();
//     expect(label2).contains("Project: in the current working directory");

//     await quickPick.selectQuickPick(0);

//     // Find open editors
//     editorView = new EditorView();
//     const titles = await editorView.getOpenEditorTitles();

//     // Check zowe.config.json was opened - could check content here
//     expect(titles.some((title) => title.startsWith("zowe.config.json"))).is.true;

//     cicsTree.takeScreenshot();
//   });
// });

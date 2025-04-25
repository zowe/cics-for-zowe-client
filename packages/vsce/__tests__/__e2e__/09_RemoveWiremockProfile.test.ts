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
import * as path from "path";
import { ActivityBar, DefaultTreeSection, EditorView, InputBox, TextEditor, VSBrowser, ViewPanelAction } from "vscode-extension-tester";
import { restoreOriginalConfigFile } from "./e2e_globalMocks";

describe("Remove The Wiremock Profile From The Configuration File", async () => {
  let cicsTree: DefaultTreeSection;
  let editorView: EditorView;
  let quickPick: InputBox;
  const profileName = "wiremock_server";

  before(async () => {
    // open the Explorer view into the folder where configuration files are available
    await VSBrowser.instance.openResources(path.join("__tests__", "__e2e__", "resources", "test", "config-files"));
    (await new ActivityBar().getViewControl("Explorer"))?.openView();

    // Switch to the cics extension view
    const zoweExplorer = await new ActivityBar().getViewControl("Zowe Explorer");
    assert(zoweExplorer !== undefined);
    const view = await zoweExplorer.openView();
    cicsTree = await view.getContent().getSection("cics");

    // Expand the cics section
    await cicsTree.click();
    await cicsTree.expand();
  });

  after(async () => {
    // Close all open editor tabs
    editorView.closeAllEditors();
  });

  it("Remove Wiremock Profile", async () => {
    // Remove the wiremock profile from zowe.config.json
    restoreOriginalConfigFile();

    // Click the plus icon in the cicsTree
    const plusIcon: ViewPanelAction | undefined = await cicsTree.getAction(`Create a CICS Profile`);
    await plusIcon?.click();

    // Select the option to edit project team configuration file
    quickPick = await InputBox.create();
    await quickPick.selectQuickPick(1);
    await quickPick.selectQuickPick(1);

    // Find open editors
    editorView = new EditorView();
    const titles = await editorView.getOpenEditorTitles();

    // Check zowe.config.json was opened - could check content here
    expect(titles.some((title) => title.startsWith("zowe.config.json"))).is.true;

    //Get the config file path
    const editor = (await editorView.openEditor("zowe.config.json")) as TextEditor;

    // Checking if the wiremock profile is removed
    let isWmAvailable = await editor.getText();
    expect(isWmAvailable.includes(profileName)).not.to.be.true;
  });
});

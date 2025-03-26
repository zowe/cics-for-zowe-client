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
import { ActivityBar, EditorView, InputBox, TextEditor, ViewPanelAction } from "vscode-extension-tester";
import { restoreOriginalConfigFile } from "./e2e_globalMocks";

describe("Remove The Wiremock Profile From The Configuration File", async () => {
  let editorView: EditorView;
  const profileName = "wiremock_server";

  beforeEach(async () => {
    // Switch to the cics extension view
    const zoweExplorer = await new ActivityBar().getViewControl("Zowe Explorer");
    assert(zoweExplorer !== undefined);
    const view = await zoweExplorer.openView();
    const cicsTree = await view.getContent().getSection("cics");
    // Click the plus icon in cics
    const plusIcon: ViewPanelAction | undefined = await cicsTree.getAction(`Create a CICS Profile`);
    await plusIcon?.click();

    // Find quickpick and select the options to edit project team configuration file
    const quickPick = await InputBox.create();
    await quickPick.selectQuickPick(1);
    await quickPick.selectQuickPick(1);
  });

  it("Remove Wiremock Profile", async () => {
    // Remove the wiremock profile from zowe.config.json
    restoreOriginalConfigFile();

    // Checking if the wiremock profile is removed
    editorView = new EditorView();
    let editor = (await editorView.openEditor("zowe.config.json")) as TextEditor;
    let isWmAvailable = await editor.getText();
    expect(isWmAvailable.includes(profileName)).not.to.be.true;
  });
});

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
import { DefaultTreeSection, EditorView, SideBarView } from "vscode-extension-tester";
import { CONFIG_FILE_NAME, WIREMOCK_PROFILE_NAME } from "./util/constants";
import { restoreOriginalConfigFile, sleep } from "./util/globalMocks";
import {
  checkIfEditorTabIsOpened,
  closeAllEditorsTabs,
  getCicsSection,
  openZoweExplorer,
  selectEditProjectTeamConfigFile,
} from "./util/initSetup.test";

describe("Remove Wiremock Profile From Config File", async () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let editorView: EditorView;

  before(async () => {
    await sleep(1900);
    view = await openZoweExplorer();
    cicsTree = await getCicsSection(view);
    await sleep(100);
  });

  after(async () => {
    await closeAllEditorsTabs();
  });

  it("Remove Wiremock", async () => {
    // Remove the wiremock profile from zowe.config.json
    restoreOriginalConfigFile();

    // Select the option to edit project team configuration file from the quickpick
    await selectEditProjectTeamConfigFile(cicsTree);
    await checkIfEditorTabIsOpened(CONFIG_FILE_NAME);

    //Check if wiremock profile is removed from the zowe.config.json
    editorView = new EditorView();
    const editor = await editorView.openEditor(CONFIG_FILE_NAME);
    let isWmAvailable = await editor.getText();
    expect(isWmAvailable.includes(WIREMOCK_PROFILE_NAME)).not.to.be.true;
    cicsTree.takeScreenshot();
  });
});

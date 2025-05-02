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
import * as path from "path";
import { ActivityBar, DefaultTreeSection, EditorView, SideBarView, VSBrowser } from "vscode-extension-tester";
import { restoreOriginalConfigFile, sleep } from "./util/globalMocks";
import {
  checkIfZoweConfigJsonFileIsOpened,
  closeAllEditorsTabs,
  getCicsSection,
  openZoweExplorer,
  selectEditProjectTeamConfigFile,
} from "./util/initSetup.test";

describe("Remove The Wiremock Profile From The Configuration File", async () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection | undefined;
  let editorView: EditorView;
  const configFileName = "zowe.config.json";
  const profileName = "wiremock_server";

  before(async () => {
    await sleep(2000);
    // open the Explorer view into the folder where configuration files are available
    await VSBrowser.instance.openResources(path.join("__tests__", "__e2e__", "resources", "test", "config-files"));
    (await new ActivityBar().getViewControl("Explorer"))?.openView();

    // Open the Zowe explorer
    view = await openZoweExplorer();

    // Open the cics section in the Zowe explorer and expand it
    cicsTree = await getCicsSection(view);
  });

  after(async () => {
    // Close all open editor tabs
    await closeAllEditorsTabs();
  });

  it("Remove Wiremock Profile", async () => {
    // Remove the wiremock profile from zowe.config.json
    restoreOriginalConfigFile();

    // Select the option to edit project team configuration file from the quickpick
    await selectEditProjectTeamConfigFile(cicsTree);

    // Should open the configuration file
    await checkIfZoweConfigJsonFileIsOpened();

    //Open the editor tab of zowe.config.json
    editorView = new EditorView();
    const editor = await editorView.openEditor(configFileName);

    // Checking if the wiremock profile is removed
    let isWmAvailable = await editor.getText();
    expect(isWmAvailable.includes(profileName)).not.to.be.true;
    cicsTree?.takeScreenshot();
  });
});

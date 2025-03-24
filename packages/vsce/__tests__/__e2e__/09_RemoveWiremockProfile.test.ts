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
import { EditorView, TextEditor } from "vscode-extension-tester";
import { restoreOriginalConfigFile} from "./e2e_globalMocks";

describe("Remove The Wiremock Profile From The Configuration File", async() => {
    let editorView: EditorView;
    const profileName = "wiremock_server";

    it("Remove Wiremock Profile", async () => {
        // Remove the wiremock profile from zowe.config.json
        restoreOriginalConfigFile();
        
        // Checking if the wiremock profile is removed
        editorView = new EditorView();
        let editor = await editorView.openEditor("zowe.config.json") as TextEditor;
        let isWmAvailable = await editor.getText()
        expect(isWmAvailable.includes(profileName)).not.to.be.true;
    });
});
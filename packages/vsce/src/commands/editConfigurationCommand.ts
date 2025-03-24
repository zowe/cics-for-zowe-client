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

import { commands, window } from "vscode";

export function editConfig() {
    return commands.registerCommand("cics-extension-for-zowe.editConfig",async () =>  {
        window.showInformationMessage("Clicked on editConfig icon");
    });
}

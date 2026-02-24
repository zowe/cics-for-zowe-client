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

import { commands, type ExtensionContext } from "vscode";
import type { CICSRegionTree } from "../trees";
import { inspectRegionByNode } from "./inspectResourceCommandUtils";

export function getInspectTreeRegionCommand(context: ExtensionContext) {
  return commands.registerCommand("cics-extension-for-zowe.inspectTreeRegion", async (node: CICSRegionTree) => {
    await inspectRegionByNode(context, node);
  });
}

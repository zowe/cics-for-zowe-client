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

import { commands, window, env } from "vscode";
import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { CICSResourceContainerNode } from "../trees";
import { buildUserAgentHeader } from "../utils/resourceUtils";

export function getCopyNameCommand() {
  return commands.registerCommand("cics-extension-for-zowe.copyResourceName", copyResourceNameToClipboard);
}
export function getCopyUserAgentHeaderCommand() {
  return commands.registerCommand("cics-extension-for-zowe.copyUserAgentHeader", copyUserAgentHeaderToClipboard);
}

export const copyResourceNameToClipboard = (node: CICSResourceContainerNode<IResource>): string => {
  const resName = node.getContainedResourceName();
  env.clipboard.writeText(resName);
  return resName;
};

export const copyUserAgentHeaderToClipboard = (): string => {
  const userAgentHeader = buildUserAgentHeader();
  env.clipboard.writeText(userAgentHeader["User-Agent"]);
  window.showInformationMessage("Copied User-Agent header to clipboard");
  return userAgentHeader["User-Agent"];
};

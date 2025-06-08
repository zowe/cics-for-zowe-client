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

import { DefaultTreeSection, InputBox, Key, TreeItem, VSBrowser } from "vscode-extension-tester";

let fs = require("fs");
let path = require("path");

const jsonFilePath = path.join(__dirname, "../../../../__e2e__/resources/test/config-files/zowe.config.json");
const wiremock_profile = {
  wiremock_server: {
    type: "cics",
    properties: {
      host: "localhost",
      port: 8080,
      rejectUnauthorized: false,
      protocol: "http",
    },
  },
};

export function addWiremockProfileToConfigFile(): void {
  const jsonFile = require(jsonFilePath);
  const newProfile = {
    ...jsonFile.profiles,
    ...wiremock_profile,
  };
  jsonFile.profiles = newProfile;
  fs.writeFileSync(jsonFilePath, JSON.stringify(jsonFile, null, 2), "utf8");
}

export function restoreOriginalConfigFile(): void {
  const jsonFile = require(jsonFilePath);
  if (jsonFile.profiles && jsonFile.profiles.hasOwnProperty("wiremock_server")) {
    delete jsonFile.profiles.wiremock_server;
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonFile, null, 2), "utf8");
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runCommandFromCommandPalette(command: string): Promise<void> {
  // Open Command Palette using keyboard shortcut as contextmenu support is not available
  const driver = VSBrowser.instance.driver;
  await driver.actions().keyDown(Key.COMMAND).sendKeys("P").keyUp(Key.COMMAND).perform();

  // Enter and confirm the command
  const quickPick = await InputBox.create();
  await quickPick.setText(command);
  await quickPick.confirm();
}

export async function runCommandAndGetTreeItems(cicsTree: DefaultTreeSection, command: string, ...path: string[]): Promise<TreeItem[]> {
  // Run the command from the command palette
  await runCommandFromCommandPalette(command);

  // Open the specified tree path and return its children
  return await cicsTree.openItem(...path);
}


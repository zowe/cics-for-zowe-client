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

import { DefaultTreeSection, InputBox, Key, TreeItem, VSBrowser,TextEditor, Workbench, EditorView  } from "vscode-extension-tester";

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
  await sleep(50);
}

export async function runCommandAndGetTreeItems(cicsTree: DefaultTreeSection, command: string, ...path: string[]): Promise<TreeItem[]> {
  // Run the command from the command palette
  await runCommandFromCommandPalette(command);

  // Open the specified tree path and return its children
  return await cicsTree.openItem(...path);
}

export async function findProgramTreeNodeByLabel(programs: TreeItem[], programLabel: string): Promise<TreeItem | undefined> {
  for (const program of programs) {
    if ((await program.getLabel()).trim() === programLabel) {
      return program;
    }
  }
  return undefined;
}
export async function findLibraryTreeNodeByLabel(libraries: TreeItem[], libraryLabel: string): Promise<TreeItem | undefined> {
  for (const library of libraries) {
    if ((await library.getLabel()).trim() === libraryLabel) {
      return library;
    }
  }
  return undefined;
}

export async function sendArrowDownKeyAndPressEnter(times: number): Promise<void> {
  // Send the ARROW_DOWN key the specified number of times
  const driver = VSBrowser.instance.driver;
  for (let i = 0; i < times; i++) {
    await driver.actions().sendKeys(Key.ARROW_DOWN).perform();
  }
  await driver.actions().sendKeys(Key.ENTER).perform();
}
export async function countCommandsFromPalette(command: string): Promise<any>{
  const inputBox = await openCommandPaletteAndType(command);
  await sleep(500);
  const items = await inputBox.getQuickPicks();
  return items.length;
}
async function openCommandPaletteAndType(command: string): Promise<InputBox> {
  const workbench = new Workbench();
  await workbench.openCommandPrompt();
  const inputBox = await InputBox.create();
  await inputBox.setText(command);
  await sleep(500);
  return inputBox;
}
export async function openCommandPaletteAndRun(command: string) {
  const inputBox = await openCommandPaletteAndType(command);
  await inputBox.confirm();
}

export async function openSettingsJsonEditor(): Promise<TextEditor> {
  await sleep(500);
  await openCommandPaletteAndRun(">Open User Settings (JSON)");
  const editorView = new EditorView();
  const editor = await editorView.openEditor("settings.json") as TextEditor;
  if (editor) {
    return editor;
  }
  throw new Error("settings.json editor not found!");
}

export async function updateUserSetting(settingName: string, value: any):Promise<TextEditor> {
  const editor = await openSettingsJsonEditor();
  let settings: any = {};
  try {
    settings = JSON.parse(await editor.getText());
  } catch {
    settings = {};
  }
  settings[settingName] = value;
  await editor.setText(JSON.stringify(settings, null, 2));
  await sleep(500);
  await editor.save();
  return editor;
}

export async function getCommandPaletteLabels(command: string) {
  const inputBox = await openCommandPaletteAndType(command);
  const items = await inputBox.getQuickPicks();
  const labels = await Promise.all(items.map(i => i.getLabel()));
  return labels;
}

export async function removeUserSetting(settingName: string):Promise<void> {
  const editor = await openSettingsJsonEditor();
  let settings: any = {};
  try {
    settings = JSON.parse(await editor.getText());
  } catch {
    settings = {};
  }
   if (settingName in settings) {
    delete settings[settingName];
    await editor.setText(JSON.stringify(settings, null, 2));
    await editor.save();
    await sleep(500);
  }
}
export async function findJVMServerTreeNodeByLabel(jvmServers: TreeItem[], jvmServerLabel: string): Promise<TreeItem | undefined> {
  for (const jvmServer of jvmServers) {
    if ((await jvmServer.getLabel()).trim() === jvmServerLabel) {
      return jvmServer;
    }
  }
  return undefined;
}
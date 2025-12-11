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

import { createVSCodeMock } from "jest-mock-vscode";
import {
  showErrorMessageMock,
  showInfoMessageMock,
  vscodeExecuteCommandMock,
  vscodeRegisterCommandMock,
  workspaceConfigurationGetMock,
  workspaceConfigurationUpdateMock,
} from ".";

const mock = createVSCodeMock(jest);

module.exports = {
  ...mock,
  extensions: {
    getExtension: jest.fn().mockReturnValue({
      packageJSON: {
        displayName: "Zowe Explorer for IBM CICS TS",
        version: "3.15.0",
      },
    }),
  },
  env: {
    clipboard: {
      writeText: (v: string) => {},
    },
  },
  l10n: {
    t: (key: string, ...args: any[]) => {
      if (typeof key !== "string") {
        return String(key);
      }
      return key.replace(/\{(\d+)\}/g, (_, idx) => (args[Number(idx)] !== undefined ? String(args[Number(idx)]) : ""));
    },
  },
  window: {
    ...mock.window,
    createOutputChannel: jest.fn().mockReturnValue({
      trace: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      dispose: jest.fn(),
      logLevel: 2,
    }),
    createTreeView: jest.fn().mockReturnValue({
      onDidExpandElement: jest.fn(),
      onDidCollapseElement: jest.fn(),
      reveal: jest.fn(),
    }),
    showErrorMessage: showErrorMessageMock,
    showInformationMessage: showInfoMessageMock,
  },
  commands: {
    ...mock.commands,
    registerCommand: vscodeRegisterCommandMock,
    executeCommand: vscodeExecuteCommandMock,
  },
  workspace: {
    ...mock.workspace,
    getConfiguration: jest.fn().mockImplementation((schema: string) => {
      switch (schema) {
        case "zowe.cics.resources":
          const resMap = new Map();
          resMap.set("Program", true);
          resMap.set("Transaction", false);
          resMap.set("LocalFile", false);
          resMap.set("Task", true);
          resMap.set("Library", true);
          resMap.set("Pipeline", true);
          resMap.set("TCP/IPService", true);
          resMap.set("URIMap", true);
          resMap.set("WebService", true);
          resMap.set("JVMServer", true);
          resMap.set("Bundle", true);
          resMap.set("TSQueue", true);

          return resMap;
        default:
          return {
            get: workspaceConfigurationGetMock,
            update: workspaceConfigurationUpdateMock,
          };
      }
    }),
  },
};

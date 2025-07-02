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

const vscode = { postMessage: jest.fn(), };
const window = { addEventListener: jest.fn(), removeEventListener: jest.fn() };

const postSpy = jest.spyOn(vscode, "postMessage");
const windowAddListenerSpy = jest.spyOn(window, "addEventListener");
const windowRemoveListenerSpy = jest.spyOn(window, "removeEventListener");

const apiMock = jest.fn().mockReturnValue(vscode);

// @ts-ignore
global.vscode = vscode; global.window = window; global.acquireVsCodeApi = apiMock;

import * as webviewUtils from "../../../src/webviews/common/vscode";

describe('VS Code Webview utility methods', () => {

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("should POST message to webview", () => {
    expect(postSpy).toHaveBeenCalledTimes(0);
    webviewUtils.postVscMessage({
      command: "init",
    });
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy).toHaveBeenLastCalledWith({
      command: "init"
    });
  });

  it("should add event listender", () => {
    expect(windowAddListenerSpy).toHaveBeenCalledTimes(0);
    webviewUtils.addVscMessageListener((e) => null);
    expect(windowAddListenerSpy).toHaveBeenCalledTimes(1);
  });
  it("should add scroll listender", () => {
    expect(windowAddListenerSpy).toHaveBeenCalledTimes(0);
    webviewUtils.addScrollerListener((e) => null);
    expect(windowAddListenerSpy).toHaveBeenCalledTimes(1);
  });
  it("should add resize listender", () => {
    expect(windowAddListenerSpy).toHaveBeenCalledTimes(0);
    webviewUtils.addResizeListener((e) => null);
    expect(windowAddListenerSpy).toHaveBeenCalledTimes(1);
  });
  it("should remove listender", () => {
    expect(windowRemoveListenerSpy).toHaveBeenCalledTimes(0);
    webviewUtils.removeVscMessageListener((e) => null);
    expect(windowRemoveListenerSpy).toHaveBeenCalledTimes(1);
  });

});

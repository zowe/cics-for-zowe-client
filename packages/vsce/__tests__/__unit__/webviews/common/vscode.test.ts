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

import type { IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import type { CICSSession } from "@zowe/cics-for-zowe-sdk";
import type { imperative } from "@zowe/zowe-explorer-api";

// Mock the VS Code API BEFORE importing the module
const mockPostMessage = jest.fn();
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

// Mock acquireVsCodeApi
(global as typeof globalThis & { acquireVsCodeApi: () => { postMessage: typeof mockPostMessage } }).acquireVsCodeApi = jest.fn(() => ({
  postMessage: mockPostMessage,
}));

// Mock window event listeners
Object.defineProperty(global, 'window', {
  value: {
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
  },
  writable: true,
});

// NOW import the module after mocks are set up
import { postVscMessage, addVscMessageListener, removeVscMessageListener } from "../../../../src/webviews/common/vscode";
import type { IResourceInspectorResource } from "../../../../src/webviews/common/vscode";

describe("vscode webview utilities", () => {
  // Helper function to create a mock IResourceContext
  const createMockResourceContext = (): IResourceContext => ({
    profile: {
      name: "test",
      type: "cics",
    } as imperative.IProfileLoaded,
    session: {} as CICSSession,
    regionName: "REG1",
  });

  // Helper function to create a mock IResourceInspectorResource
  const createMockResource = (): IResourceInspectorResource => ({
    name: "PROG1",
    context: createMockResourceContext(),
    highlights: [],
    resource: {} as IResourceInspectorResource["resource"],
    meta: {} as IResourceInspectorResource["meta"],
    actions: [],
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("postVscMessage", () => {
    it("should post init message to VS Code", () => {
      const message = { type: "init" as const };
      
      postVscMessage(message);
      
      expect(mockPostMessage).toHaveBeenCalledWith(message);
      expect(mockPostMessage).toHaveBeenCalledTimes(1);
    });

    it("should post refresh message with resources", () => {
      const message = {
        type: "refresh" as const,
        resources: [createMockResource()],
      };
      
      postVscMessage(message);
      
      expect(mockPostMessage).toHaveBeenCalledWith(message);
    });

    it("should post executeAction message", () => {
      const message = {
        type: "executeAction" as const,
        actionId: "ENABLE",
        resources: [] as IResourceInspectorResource[],
      };
      
      postVscMessage(message);
      
      expect(mockPostMessage).toHaveBeenCalledWith(message);
    });

    it("should post showLogsForHyperlink message", () => {
      const message = {
        type: "showLogsForHyperlink" as const,
        resourceContext: createMockResourceContext(),
      };
      
      postVscMessage(message);
      
      expect(mockPostMessage).toHaveBeenCalledWith(message);
    });

    it("should post showDatasetForHyperlink message", () => {
      const message = {
        type: "showDatasetForHyperlink" as const,
        resourceContext: createMockResourceContext(),
        datasetName: "MY.DATASET",
      };
      
      postVscMessage(message);
      
      expect(mockPostMessage).toHaveBeenCalledWith(message);
    });

    it("should post showUssFileForHyperlink message", () => {
      const message = {
        type: "showUssFileForHyperlink" as const,
        resourceContext: createMockResourceContext(),
        ussPath: "/u/user/file.txt",
      };
      
      postVscMessage(message);
      
      expect(mockPostMessage).toHaveBeenCalledWith(message);
    });
  });

  describe("addVscMessageListener", () => {
    it("should add message event listener to window", () => {
      const mockListener = jest.fn();
      
      addVscMessageListener(mockListener);
      
      expect(mockAddEventListener).toHaveBeenCalledWith("message", mockListener);
      expect(mockAddEventListener).toHaveBeenCalledTimes(1);
    });

    it("should add multiple listeners", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      addVscMessageListener(listener1);
      addVscMessageListener(listener2);
      
      expect(mockAddEventListener).toHaveBeenCalledTimes(2);
      expect(mockAddEventListener).toHaveBeenNthCalledWith(1, "message", listener1);
      expect(mockAddEventListener).toHaveBeenNthCalledWith(2, "message", listener2);
    });
  });

  describe("removeVscMessageListener", () => {
    it("should remove message event listener from window", () => {
      const mockListener = jest.fn();
      
      removeVscMessageListener(mockListener);
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith("message", mockListener);
      expect(mockRemoveEventListener).toHaveBeenCalledTimes(1);
    });

    it("should remove specific listener", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      removeVscMessageListener(listener1);
      removeVscMessageListener(listener2);
      
      expect(mockRemoveEventListener).toHaveBeenCalledTimes(2);
      expect(mockRemoveEventListener).toHaveBeenNthCalledWith(1, "message", listener1);
      expect(mockRemoveEventListener).toHaveBeenNthCalledWith(2, "message", listener2);
    });
  });

  describe("integration", () => {
    it("should handle add and remove listener lifecycle", () => {
      const mockListener = jest.fn();
      
      addVscMessageListener(mockListener);
      expect(mockAddEventListener).toHaveBeenCalledWith("message", mockListener);
      
      removeVscMessageListener(mockListener);
      expect(mockRemoveEventListener).toHaveBeenCalledWith("message", mockListener);
    });
  });
});



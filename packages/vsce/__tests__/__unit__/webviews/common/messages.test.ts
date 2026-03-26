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

import type { WebviewToExtensionMessage, ExtensionToWebviewMessage } from "../../../../src/webviews/common/messages";

describe("Webview Messages", () => {
  describe("WebviewToExtensionMessage", () => {
    it("should support init message type", () => {
      const message: WebviewToExtensionMessage = {
        type: "init",
      };

      expect(message.type).toBe("init");
    });

    it("should support refresh message type", () => {
      const message: WebviewToExtensionMessage = {
        type: "refresh",
        resources: [],
      };

      expect(message.type).toBe("refresh");
      expect(message.resources).toEqual([]);
    });

    it("should support executeAction message type", () => {
      const message: WebviewToExtensionMessage = {
        type: "executeAction",
        actionId: "testAction",
        resources: [],
      };

      expect(message.type).toBe("executeAction");
      expect(message.actionId).toBe("testAction");
      expect(message.resources).toEqual([]);
    });

    it("should support showLogsForHyperlink message type", () => {
      const message: WebviewToExtensionMessage = {
        type: "showLogsForHyperlink",
        resourceContext: {} as any,
      };

      expect(message.type).toBe("showLogsForHyperlink");
      if (message.type === "showLogsForHyperlink") {
        expect(message.resourceContext).toBeDefined();
      }
    });

    it("should support showDatasetForHyperlink message type", () => {
      const message: WebviewToExtensionMessage = {
        type: "showDatasetForHyperlink",
        resourceContext: {} as any,
        datasetName: "TEST.DATASET",
      };

      expect(message.type).toBe("showDatasetForHyperlink");
      if (message.type === "showDatasetForHyperlink") {
        expect(message.datasetName).toBe("TEST.DATASET");
      }
    });

    it("should support showUssFileForHyperlink message type", () => {
      const message: WebviewToExtensionMessage = {
        type: "showUssFileForHyperlink",
        resourceContext: {} as any,
        ussPath: "/u/test/file.txt",
      };

      expect(message.type).toBe("showUssFileForHyperlink");
      if (message.type === "showUssFileForHyperlink") {
        expect(message.ussPath).toBe("/u/test/file.txt");
      }
    });
  });

  describe("ExtensionToWebviewMessage", () => {
    it("should support updateResources message type", () => {
      const message: ExtensionToWebviewMessage = {
        type: "updateResources",
        resources: [],
        resourceIconPath: {
          light: "light-icon.svg",
          dark: "dark-icon.svg",
        },
        humanReadableNamePlural: "Programs",
        humanReadableNameSingular: "Program",
        shouldRenderDatasetLinks: true,
      };

      expect(message.type).toBe("updateResources");
      expect(message.resources).toEqual([]);
      expect(message.resourceIconPath.light).toBe("light-icon.svg");
      expect(message.resourceIconPath.dark).toBe("dark-icon.svg");
      expect(message.humanReadableNamePlural).toBe("Programs");
      expect(message.humanReadableNameSingular).toBe("Program");
      expect(message.shouldRenderDatasetLinks).toBe(true);
    });

    it("should support shouldRenderDatasetLinks as false", () => {
      const message: ExtensionToWebviewMessage = {
        type: "updateResources",
        resources: [],
        resourceIconPath: {
          light: "light-icon.svg",
          dark: "dark-icon.svg",
        },
        humanReadableNamePlural: "Transactions",
        humanReadableNameSingular: "Transaction",
        shouldRenderDatasetLinks: false,
      };

      expect(message.shouldRenderDatasetLinks).toBe(false);
    });
  });
});

// Made with Bob

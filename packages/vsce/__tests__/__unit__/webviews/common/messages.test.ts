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

import type {
  WebviewToExtensionMessage,
  ExtensionToWebviewMessage,
} from "../../../../src/webviews/common/messages";
import type { IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import type { CICSSession } from "@zowe/cics-for-zowe-sdk";
import type { imperative } from "@zowe/zowe-explorer-api";

describe("Webview Messages Type Definitions", () => {
  // Helper function to create a mock IResourceContext
  const createMockResourceContext = (): IResourceContext => ({
    profile: {
      name: "testProfile",
      type: "cics",
    } as imperative.IProfileLoaded,
    session: {} as CICSSession,
    regionName: "TESTREGION",
    cicsplexName: "TESTPLEX",
  });

  describe("WebviewToExtensionMessage Union Type", () => {
    describe.each([
      {
        type: "init" as const,
        message: { type: "init" as const },
        description: "init message with only type property",
      },
      {
        type: "refresh" as const,
        message: { type: "refresh" as const, resources: [] },
        description: "refresh message with resources array",
      },
      {
        type: "executeAction" as const,
        message: { type: "executeAction" as const, actionId: "enable", resources: [] },
        description: "executeAction message with actionId and resources",
      },
      {
        type: "showLogsForHyperlink" as const,
        message: { type: "showLogsForHyperlink" as const, resourceContext: createMockResourceContext() },
        description: "showLogsForHyperlink message with resourceContext",
      },
      {
        type: "showDatasetForHyperlink" as const,
        message: {
          type: "showDatasetForHyperlink" as const,
          resourceContext: createMockResourceContext(),
          datasetName: "USER.CICS.LOADLIB",
        },
        description: "showDatasetForHyperlink message with resourceContext and datasetName",
      },
      {
        type: "showUssFileForHyperlink" as const,
        message: {
          type: "showUssFileForHyperlink" as const,
          resourceContext: createMockResourceContext(),
          ussPath: "/u/cics/bundles/bundle1",
        },
        description: "showUssFileForHyperlink message with resourceContext and ussPath",
      },
    ])("$type message type", ({ type, message, description }) => {
      it(`should accept ${description}`, () => {
        const msg: WebviewToExtensionMessage = message;
        expect(msg.type).toBe(type);
      });

      it("should be serializable to JSON", () => {
        const json = JSON.stringify(message);
        const parsed = JSON.parse(json);
        expect(parsed.type).toBe(type);
      });
    });

    it("should support various action IDs", () => {
      const actionIds = ["enable", "disable", "newcopy", "phaseIn", "delete"];

      actionIds.forEach((actionId) => {
        const message: WebviewToExtensionMessage = {
          type: "executeAction",
          actionId,
          resources: [],
        };

        expect(message.actionId).toBe(actionId);
      });
    });

    it.each([
      ["USER.CICS.LOADLIB"],
      ["SYS1.LINKLIB"],
      ["PROD.CICS.PROGRAMS"],
    ])("should handle dataset name format: %s", (datasetName) => {
      const message: WebviewToExtensionMessage = {
        type: "showDatasetForHyperlink",
        resourceContext: createMockResourceContext(),
        datasetName,
      };

      expect(message.datasetName).toBe(datasetName);
    });

    it.each([
      ["/u/cics/bundles/bundle1"],
      ["/usr/lpp/cics/bundle"],
      ["/home/user/test"],
    ])("should handle USS path format: %s", (ussPath) => {
      const message: WebviewToExtensionMessage = {
        type: "showUssFileForHyperlink",
        resourceContext: createMockResourceContext(),
        ussPath,
      };

      expect(message.ussPath).toBe(ussPath);
    });

    describe("Message Type Discrimination", () => {
      it("should distinguish between different message types by type property", () => {
        const initMsg: WebviewToExtensionMessage = { type: "init" };
        const refreshMsg: WebviewToExtensionMessage = {
          type: "refresh",
          resources: [],
        };
        const actionMsg: WebviewToExtensionMessage = {
          type: "executeAction",
          actionId: "enable",
          resources: [],
        };

        expect(initMsg.type).toBe("init");
        expect(refreshMsg.type).toBe("refresh");
        expect(actionMsg.type).toBe("executeAction");
        expect(initMsg.type).not.toBe(refreshMsg.type);
        expect(refreshMsg.type).not.toBe(actionMsg.type);
      });

      it("should use type guards to narrow message types", () => {
        const message: WebviewToExtensionMessage = {
          type: "refresh",
          resources: [],
        };

        if (message.type === "refresh") {
          expect(message.resources).toBeDefined();
          expect(Array.isArray(message.resources)).toBe(true);
        }
      });
    });
  });

  describe("ExtensionToWebviewMessage Type", () => {
    describe("updateResources message type", () => {
      const createUpdateResourcesMessage = (
        overrides: Partial<ExtensionToWebviewMessage> = {}
      ): ExtensionToWebviewMessage => ({
        type: "updateResources",
        resources: [],
        resourceIconPath: { light: "light.svg", dark: "dark.svg" },
        humanReadableNamePlural: "Programs",
        humanReadableNameSingular: "Program",
        shouldRenderDatasetLinks: false,
        ...overrides,
      });

      it("should accept updateResources message with all required properties", () => {
        const message = createUpdateResourcesMessage({
          shouldRenderDatasetLinks: true,
        });

        expect(message.type).toBe("updateResources");
        expect(Array.isArray(message.resources)).toBe(true);
        expect(message.resourceIconPath).toBeDefined();
        expect(message.humanReadableNamePlural).toBe("Programs");
        expect(message.humanReadableNameSingular).toBe("Program");
        expect(message.shouldRenderDatasetLinks).toBe(true);
      });

      it("should have exactly six properties", () => {
        const message = createUpdateResourcesMessage();
        const keys = Object.keys(message);

        expect(keys).toHaveLength(6);
        expect(keys).toContain("type");
        expect(keys).toContain("resources");
        expect(keys).toContain("resourceIconPath");
        expect(keys).toContain("humanReadableNamePlural");
        expect(keys).toContain("humanReadableNameSingular");
        expect(keys).toContain("shouldRenderDatasetLinks");
      });

      it.each([
        { plural: "Programs", singular: "Program" },
        { plural: "Transactions", singular: "Transaction" },
        { plural: "Libraries", singular: "Library" },
        { plural: "Bundles", singular: "Bundle" },
        { plural: "URI Maps", singular: "URI Map" },
      ])(
        "should handle resource type: $plural / $singular",
        ({ plural, singular }) => {
          const message = createUpdateResourcesMessage({
            humanReadableNamePlural: plural,
            humanReadableNameSingular: singular,
          });

          expect(message.humanReadableNamePlural).toBe(plural);
          expect(message.humanReadableNameSingular).toBe(singular);
        }
      );

      it("should handle shouldRenderDatasetLinks boolean flag", () => {
        const messageWithLinks = createUpdateResourcesMessage({
          shouldRenderDatasetLinks: true,
        });
        const messageWithoutLinks = createUpdateResourcesMessage({
          shouldRenderDatasetLinks: false,
        });

        expect(messageWithLinks.shouldRenderDatasetLinks).toBe(true);
        expect(messageWithoutLinks.shouldRenderDatasetLinks).toBe(false);
      });

      it("should include resource icon paths for light and dark themes", () => {
        const message = createUpdateResourcesMessage({
          resourceIconPath: {
            light: "/path/to/light/icon.svg",
            dark: "/path/to/dark/icon.svg",
          },
        });

        expect(message.resourceIconPath.light).toBe("/path/to/light/icon.svg");
        expect(message.resourceIconPath.dark).toBe("/path/to/dark/icon.svg");
      });

      it("should be serializable to JSON", () => {
        const message = createUpdateResourcesMessage();
        const json = JSON.stringify(message);
        const parsed = JSON.parse(json);

        expect(parsed.type).toBe("updateResources");
        expect(parsed.humanReadableNamePlural).toBe("Programs");
        expect(parsed.shouldRenderDatasetLinks).toBe(false);
      });
    });
  });

  describe("Message Communication Patterns", () => {
    it("should support bidirectional message flow", () => {
      // Webview sends init
      const initMessage: WebviewToExtensionMessage = {
        type: "init",
      };

      // Extension responds with updateResources
      const responseMessage: ExtensionToWebviewMessage = {
        type: "updateResources",
        resources: [],
        resourceIconPath: { light: "light.svg", dark: "dark.svg" },
        humanReadableNamePlural: "Programs",
        humanReadableNameSingular: "Program",
        shouldRenderDatasetLinks: false,
      };

      expect(initMessage.type).toBe("init");
      expect(responseMessage.type).toBe("updateResources");
    });

    it("should support refresh request and response pattern", () => {
      // Webview requests refresh
      const refreshRequest: WebviewToExtensionMessage = {
        type: "refresh",
        resources: [],
      };

      // Extension sends updated resources
      const refreshResponse: ExtensionToWebviewMessage = {
        type: "updateResources",
        resources: [],
        resourceIconPath: { light: "light.svg", dark: "dark.svg" },
        humanReadableNamePlural: "Programs",
        humanReadableNameSingular: "Program",
        shouldRenderDatasetLinks: false,
      };

      expect(refreshRequest.type).toBe("refresh");
      expect(refreshResponse.type).toBe("updateResources");
    });

    it("should support action execution pattern", () => {
      const actionMessage: WebviewToExtensionMessage = {
        type: "executeAction",
        actionId: "enable",
        resources: [],
      };

      expect(actionMessage.type).toBe("executeAction");
      expect(actionMessage.actionId).toBe("enable");
    });
  });
});


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
import type { IResourceInspectorResource } from "../../../../src/webviews/common/vscode";
import type { IResource, IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import type { IResourceMeta } from "../../../../src/doc/meta/IResourceMeta";

describe("webviews/common/messages", () => {
  const createMockResource = (): IResourceInspectorResource => ({
    name: "TESTPROG",
    context: {
      profile: {} as Partial<IResourceContext["profile"]> as IResourceContext["profile"],
      session: {} as Partial<IResourceContext["session"]> as IResourceContext["session"],
      regionName: "REGION1",
      cicsplexName: "PLEX1",
    },
    highlights: [
      { key: "Program", value: "TESTPROG" },
      { key: "Status", value: "ENABLED" },
    ],
    resource: {} as Partial<IResource> as IResource,
    meta: {} as Partial<IResourceMeta<IResource>> as IResourceMeta<IResource>,
    actions: [
      { id: "newcopy", name: "NEWCOPY" },
      { id: "disable", name: "Disable" },
    ],
  });

  describe("WebviewToExtensionMessage", () => {
    it("should create a valid init message", () => {
      const message: WebviewToExtensionMessage = {
        type: "init",
      };

      expect(message.type).toBe("init");
    });

    it("should create a valid refresh message", () => {
      const resources = [createMockResource()];
      const message: WebviewToExtensionMessage = {
        type: "refresh",
        resources,
      };

      expect(message.type).toBe("refresh");
        expect(message.resources).toHaveLength(1);
        expect(message.resources[0].name).toBe("TESTPROG");
    });

    it("should create a valid executeAction message", () => {
      const resources = [createMockResource()];
      const message: WebviewToExtensionMessage = {
        type: "executeAction",
        actionId: "newcopy",
        resources,
      };

      expect(message.type).toBe("executeAction");
        expect(message.actionId).toBe("newcopy");
        expect(message.resources).toHaveLength(1);
    });

    it("should create executeAction message with empty resources", () => {
      const message: WebviewToExtensionMessage = {
        type: "executeAction",
        actionId: "refresh",
        resources: [],
      };

      expect(message.type).toBe("executeAction");
        expect(message.resources).toEqual([]);
    });

    it("should create a valid showLogsForHyperlink message", () => {
      const message: WebviewToExtensionMessage = {
        type: "showLogsForHyperlink",
        resourceContext: {
          profile: {} as Partial<IResourceContext["profile"]> as IResourceContext["profile"],
          session: {} as Partial<IResourceContext["session"]> as IResourceContext["session"],
          regionName: "REGION1",
          cicsplexName: undefined,
        },
      };

      expect(message.type).toBe("showLogsForHyperlink");
        expect(message.resourceContext.regionName).toBe("REGION1");
    });

    it("should create a valid showDatasetForHyperlink message", () => {
      const message: WebviewToExtensionMessage = {
        type: "showDatasetForHyperlink",
        resourceContext: {
          profile: {} as Partial<IResourceContext["profile"]> as IResourceContext["profile"],
          session: {} as Partial<IResourceContext["session"]> as IResourceContext["session"],
          regionName: "REGION1",
          cicsplexName: undefined,
        },
        datasetName: "USER.DATASET",
      };

      expect(message.type).toBe("showDatasetForHyperlink");
        expect(message.datasetName).toBe("USER.DATASET");
        expect(message.resourceContext.regionName).toBe("REGION1");
    });

    it("should create a valid showUssFileForHyperlink message", () => {
      const message: WebviewToExtensionMessage = {
        type: "showUssFileForHyperlink",
        resourceContext: {
          profile: {} as Partial<IResourceContext["profile"]> as IResourceContext["profile"],
          session: {} as Partial<IResourceContext["session"]> as IResourceContext["session"],
          regionName: "REGION1",
          cicsplexName: undefined,
        },
        ussPath: "/u/user/file.txt",
      };

      expect(message.type).toBe("showUssFileForHyperlink");
        expect(message.ussPath).toBe("/u/user/file.txt");
        expect(message.resourceContext.regionName).toBe("REGION1");
    });

    it("should handle multiple resources in refresh message", () => {
      const resources = [createMockResource(), createMockResource()];
      const message: WebviewToExtensionMessage = {
        type: "refresh",
        resources,
      };

        expect(message.resources).toHaveLength(2);
    });
  });

  describe("ExtensionToWebviewMessage", () => {
    it("should create a valid updateResources message", () => {
      const resources = [createMockResource()];
      const message: ExtensionToWebviewMessage = {
        type: "updateResources",
        resources,
        resourceIconPath: {
          light: "path/to/light/icon.svg",
          dark: "path/to/dark/icon.svg",
        },
        humanReadableNamePlural: "Programs",
        humanReadableNameSingular: "Program",
        shouldRenderDatasetLinks: true,
      };

      expect(message.type).toBe("updateResources");
      expect(message.resources).toHaveLength(1);
      expect(message.humanReadableNamePlural).toBe("Programs");
      expect(message.humanReadableNameSingular).toBe("Program");
      expect(message.shouldRenderDatasetLinks).toBe(true);
      expect(message.resourceIconPath.light).toBe("path/to/light/icon.svg");
      expect(message.resourceIconPath.dark).toBe("path/to/dark/icon.svg");
    });

    it("should handle message without dataset links", () => {
      const message: ExtensionToWebviewMessage = {
        type: "updateResources",
        resources: [],
        resourceIconPath: {
          light: "icon-light.svg",
          dark: "icon-dark.svg",
        },
        humanReadableNamePlural: "Transactions",
        humanReadableNameSingular: "Transaction",
        shouldRenderDatasetLinks: false,
      };

      expect(message.shouldRenderDatasetLinks).toBe(false);
      expect(message.resources).toHaveLength(0);
    });

    it("should handle multiple resources in updateResources message", () => {
      const resources = [createMockResource(), createMockResource()];
      const message: ExtensionToWebviewMessage = {
        type: "updateResources",
        resources,
        resourceIconPath: {
          light: "light.svg",
          dark: "dark.svg",
        },
        humanReadableNamePlural: "Programs",
        humanReadableNameSingular: "Program",
        shouldRenderDatasetLinks: true,
      };

      expect(message.resources).toHaveLength(2);
    });

    it("should handle different resource types", () => {
      const message: ExtensionToWebviewMessage = {
        type: "updateResources",
        resources: [],
        resourceIconPath: {
          light: "urimap-light.svg",
          dark: "urimap-dark.svg",
        },
        humanReadableNamePlural: "URI Maps",
        humanReadableNameSingular: "URI Map",
        shouldRenderDatasetLinks: false,
      };

      expect(message.humanReadableNamePlural).toBe("URI Maps");
      expect(message.humanReadableNameSingular).toBe("URI Map");
    });
  });
});



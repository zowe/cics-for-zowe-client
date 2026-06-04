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

// ─── Mocks (must be before imports) ──────────────────────────────────────────

const getLastUsedRegionMock = jest.fn();
jest.mock("../../../src/commands/setCICSRegionCommand", () => ({
  getLastUsedRegion: getLastUsedRegionMock,
}));

const setLastUsedRegionMock = jest.fn();
jest.mock("../../../src/utils/lastUsedRegionUtils", () => ({
  setLastUsedRegion: setLastUsedRegionMock,
}));

const appendRecentResourceMock = jest.fn().mockResolvedValue(undefined);
const getRecentResourcesMock = jest.fn().mockReturnValue([]);
jest.mock("../../../src/utils/PersistentStorage", () => ({
  __esModule: true,
  default: {
    get appendRecentResource() {
      return appendRecentResourceMock;
    },
    get getRecentResources() {
      return getRecentResourcesMock;
    },
  },
}));

const setResourcesMock = jest.fn().mockResolvedValue(undefined);
jest.mock("../../../src/trees/ResourceInspectorViewProvider", () => ({
  ResourceInspectorViewProvider: {
    getInstance: jest.fn().mockReturnValue({
      setResources: setResourcesMock,
    }),
  },
}));

const createQuickPickMock = jest.fn();
const resolveQuickPickMock = jest.fn();
jest.mock("@zowe/zowe-explorer-api", () => ({
  Gui: {
    createQuickPick: createQuickPickMock,
    resolveQuickPick: resolveQuickPickMock,
  },
  ZoweVsCodeExtension: {
    getZoweExplorerApi: jest.fn().mockReturnValue({
      getExplorerExtenderApi: jest.fn().mockReturnValue({
        getProfilesCache: jest.fn().mockReturnValue({}),
      }),
    }),
  },
}));

jest.mock("../../../src/utils/CICSLogger", () => ({
  CICSLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { QuickPickItemKind } from "vscode";
import { inspectResource, showInspectResource } from "../../../src/commands/inspectResourceCommandUtils";
import { ProgramMeta } from "../../../src/doc";
import type { IRecentResource } from "../../../src/doc/commands/IRecentResource";
import { showErrorMessageMock, vscodeExecuteCommandMock } from "../../__mocks__";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeQuickPick = () => {
  const handlers: Record<string, (v: any) => void> = {};
  return {
    items: [] as any[],
    placeholder: "",
    ignoreFocusOut: false,
    show: jest.fn(),
    hide: jest.fn(),
    onDidChangeValue: jest.fn((cb) => {
      handlers["onDidChangeValue"] = cb;
    }),
    _triggerChangeValue: (v: string) => handlers["onDidChangeValue"]?.(v),
  };
};

const makeCICSRegion = () => ({
  profile: { name: "MYPROF" },
  cicsPlexName: "MYPLEX",
  regionName: "MYREG",
  session: {},
});

const makeRecentResource = (resourceName: string, resourceType: string): IRecentResource => ({
  resourceName,
  resourceType,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("inspectResourceCommandUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    appendRecentResourceMock.mockResolvedValue(undefined);
    getRecentResourcesMock.mockReturnValue([]);
    setResourcesMock.mockResolvedValue(undefined);
    setLastUsedRegionMock.mockReturnValue(undefined);
    vscodeExecuteCommandMock.mockResolvedValue(undefined);
    showErrorMessageMock.mockResolvedValue(undefined);
  });

  describe("showInspectResource", () => {
    it("calls appendRecentResource for each resource shown", async () => {
      const context = {} as any;
      const resource = {
        containedResource: {
          meta: ProgramMeta,
          resource: { attributes: { eyu_cicsname: "MYREG", program: "MYPROG" } } as any,
        },
        ctx: { profile: { name: "MYPROF" }, regionName: "MYREG", session: {} } as any,
      };

      await showInspectResource(context, [resource]);

      expect(appendRecentResourceMock).toHaveBeenCalledTimes(1);
      expect(appendRecentResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceType: ProgramMeta.resourceName,
        })
      );
    });

    it("calls appendRecentResource for each resource when multiple resources are shown", async () => {
      const context = {} as any;
      const makeRes = (name: string) => ({
        containedResource: {
          meta: ProgramMeta,
          resource: { attributes: { eyu_cicsname: "MYREG", program: name } } as any,
        },
        ctx: { profile: { name: "MYPROF" }, regionName: "MYREG", session: {} } as any,
      });

      await showInspectResource(context, [makeRes("PROG1"), makeRes("PROG2")]);

      expect(appendRecentResourceMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("inspectResource - selectResource QuickPick behaviour", () => {
    it("falls back to showInputBox when no recent resources exist for the selected type", async () => {
      getLastUsedRegionMock.mockResolvedValue(makeCICSRegion());
      getRecentResourcesMock.mockReturnValue([]);

      // Mock the resource type selection QuickPick to return "Program"
      const typeQuickPick = makeQuickPick();
      createQuickPickMock.mockReturnValueOnce(typeQuickPick);
      resolveQuickPickMock.mockResolvedValueOnce({ label: "Program" });

      // No resource QuickPick created — falls back to showInputBox
      const { window } = require("vscode");
      window.showInputBox = jest.fn().mockResolvedValue("MYPROG");

      // Mock loadResources to return nothing (we only care about the QuickPick path)
      const { ResourceContainer } = require("../../../src/resources");
      jest.spyOn(ResourceContainer.prototype, "fetchNextPage").mockResolvedValue([]);

      await inspectResource({} as any);

      expect(window.showInputBox).toHaveBeenCalled();
      // createQuickPick called once (for type selection), not twice
      expect(createQuickPickMock).toHaveBeenCalledTimes(1);
    });

    it("shows QuickPick with Recent Resources section when recent resources exist for the selected type", async () => {
      getLastUsedRegionMock.mockResolvedValue(makeCICSRegion());
      getRecentResourcesMock.mockReturnValue([makeRecentResource("MYPROG", ProgramMeta.resourceName)]);

      // First QuickPick: resource type selection
      const typeQuickPick = makeQuickPick();
      createQuickPickMock.mockReturnValueOnce(typeQuickPick);
      resolveQuickPickMock.mockResolvedValueOnce({ label: "Program" });

      // Second QuickPick: resource name selection
      const nameQuickPick = makeQuickPick();
      createQuickPickMock.mockReturnValueOnce(nameQuickPick);
      resolveQuickPickMock.mockResolvedValueOnce({ label: "MYPROG", description: "Recently inspected Program" });

      // Mock loadResources to return nothing
      const { ResourceContainer } = require("../../../src/resources");
      jest.spyOn(ResourceContainer.prototype, "fetchNextPage").mockResolvedValue([]);

      await inspectResource({} as any);

      // createQuickPick called twice: once for type, once for resource name
      expect(createQuickPickMock).toHaveBeenCalledTimes(2);

      // The name QuickPick items should include a "Recent CICS Programs" separator
      const items = nameQuickPick.items as any[];
      const separatorItem = items.find(
        (i) => i.label === `Recent CICS ${ProgramMeta.humanReadableNamePlural}` && i.kind === QuickPickItemKind.Separator
      );
      expect(separatorItem).toBeDefined();

      // The recent resource should appear in the list with no description
      const recentItem = items.find((i) => i.label === "MYPROG");
      expect(recentItem).toBeDefined();
      expect(recentItem.description).toBeUndefined();
    });

    it("does not show recent resources of a different type in the QuickPick", async () => {
      getLastUsedRegionMock.mockResolvedValue(makeCICSRegion());
      // Only transaction recent resources stored
      getRecentResourcesMock.mockReturnValue([makeRecentResource("MYTRAN", "CICSLocalTransaction")]);

      // First QuickPick: resource type selection → Program
      const typeQuickPick = makeQuickPick();
      createQuickPickMock.mockReturnValueOnce(typeQuickPick);
      resolveQuickPickMock.mockResolvedValueOnce({ label: "Program" });

      // No second QuickPick — falls back to showInputBox since no Program recent resources
      const { window } = require("vscode");
      window.showInputBox = jest.fn().mockResolvedValue("MYPROG");

      const { ResourceContainer } = require("../../../src/resources");
      jest.spyOn(ResourceContainer.prototype, "fetchNextPage").mockResolvedValue([]);

      await inspectResource({} as any);

      // Only one QuickPick (type selection), falls back to input box for name
      expect(createQuickPickMock).toHaveBeenCalledTimes(1);
      expect(window.showInputBox).toHaveBeenCalled();
    });

    it("falls back to showInputBox when user selects 'Enter resource name...' sentinel item", async () => {
      getLastUsedRegionMock.mockResolvedValue(makeCICSRegion());
      getRecentResourcesMock.mockReturnValue([makeRecentResource("MYPROG", ProgramMeta.resourceName)]);

      // First QuickPick: type selection
      const typeQuickPick = makeQuickPick();
      createQuickPickMock.mockReturnValueOnce(typeQuickPick);
      resolveQuickPickMock.mockResolvedValueOnce({ label: "Program" });

      // Second QuickPick: user picks "Enter resource name..."
      const nameQuickPick = makeQuickPick();
      createQuickPickMock.mockReturnValueOnce(nameQuickPick);
      resolveQuickPickMock.mockResolvedValueOnce({ label: "Enter resource name..." });

      const { window } = require("vscode");
      window.showInputBox = jest.fn().mockResolvedValue("TYPEDPROG");

      const { ResourceContainer } = require("../../../src/resources");
      jest.spyOn(ResourceContainer.prototype, "fetchNextPage").mockResolvedValue([]);

      await inspectResource({} as any);

      expect(window.showInputBox).toHaveBeenCalled();
    });

    it("returns undefined and shows error when selected name exceeds max length", async () => {
      getLastUsedRegionMock.mockResolvedValue(makeCICSRegion());
      getRecentResourcesMock.mockReturnValue([makeRecentResource("MYPROG", ProgramMeta.resourceName)]);

      // First QuickPick: type selection
      const typeQuickPick = makeQuickPick();
      createQuickPickMock.mockReturnValueOnce(typeQuickPick);
      resolveQuickPickMock.mockResolvedValueOnce({ label: "Program" });

      // Second QuickPick: user picks a name that is too long (9 chars, max is 8)
      const nameQuickPick = makeQuickPick();
      createQuickPickMock.mockReturnValueOnce(nameQuickPick);
      resolveQuickPickMock.mockResolvedValueOnce({ label: "TOOLONGNAME" });

      await inspectResource({} as any);

      expect(showErrorMessageMock).toHaveBeenCalled();
    });
  });
});

// Made with Bob

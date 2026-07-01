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

import type { IRecentResource } from "../../../src/doc/commands/IRecentResource";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import { workspaceConfigurationGetMock, workspaceConfigurationUpdateMock } from "../../__mocks__";

describe("PersistentStorage - recentResources", () => {
  beforeEach(() => {
    workspaceConfigurationGetMock.mockReset();
    workspaceConfigurationUpdateMock.mockReset();
    workspaceConfigurationUpdateMock.mockResolvedValue(undefined);
  });

  const makeResource = (resourceName: string, resourceType: string): IRecentResource => ({
    resourceName,
    resourceType,
  });

  describe("getRecentResources", () => {
    it("returns empty array when nothing is stored", () => {
      workspaceConfigurationGetMock.mockReturnValue([]);
      expect(PersistentStorage.getRecentResources()).toEqual([]);
    });

    it("returns stored recent resources", () => {
      const stored = [makeResource("MYPROG", "CICSProgram")];
      workspaceConfigurationGetMock.mockReturnValue(stored);
      expect(PersistentStorage.getRecentResources()).toEqual(stored);
    });
  });

  describe("appendRecentResource", () => {
    it("prepends a new entry to an empty list", async () => {
      workspaceConfigurationGetMock.mockReturnValue([]);
      const resource = makeResource("MYPROG", "CICSProgram");

      await PersistentStorage.appendRecentResource(resource);

      expect(workspaceConfigurationUpdateMock).toHaveBeenCalledWith(
        "zowe.cics.persistent",
        expect.objectContaining({
          recentResources: [resource],
        }),
        expect.anything()
      );
    });

    it("prepends a new entry to an existing list", async () => {
      const existing = makeResource("OLDPROG", "CICSProgram");
      workspaceConfigurationGetMock.mockReturnValue([existing]);
      const newResource = makeResource("NEWPROG", "CICSProgram");

      await PersistentStorage.appendRecentResource(newResource);

      expect(workspaceConfigurationUpdateMock).toHaveBeenCalledWith(
        "zowe.cics.persistent",
        expect.objectContaining({
          recentResources: [newResource, existing],
        }),
        expect.anything()
      );
    });

    it("moves an existing entry (same name + type) to the front instead of duplicating", async () => {
      const existing = [makeResource("MYPROG", "CICSProgram"), makeResource("OTHERPROG", "CICSProgram")];
      workspaceConfigurationGetMock.mockReturnValue(existing);

      await PersistentStorage.appendRecentResource(makeResource("MYPROG", "CICSProgram"));

      const saved = workspaceConfigurationUpdateMock.mock.calls[0][1].recentResources as IRecentResource[];
      expect(saved[0].resourceName).toBe("MYPROG");
      expect(saved.filter((r) => r.resourceName === "MYPROG").length).toBe(1);
    });

    it("does not deduplicate entries with the same name but different resourceType", async () => {
      const existing = [makeResource("MYRES", "CICSProgram")];
      workspaceConfigurationGetMock.mockReturnValue(existing);

      await PersistentStorage.appendRecentResource(makeResource("MYRES", "CICSLocalTransaction"));

      const saved = workspaceConfigurationUpdateMock.mock.calls[0][1].recentResources as IRecentResource[];
      expect(saved.length).toBe(2);
      expect(saved[0].resourceType).toBe("CICSLocalTransaction");
      expect(saved[1].resourceType).toBe("CICSProgram");
    });

    it("caps entries per type at 5, dropping the oldest of that type", async () => {
      const existing: IRecentResource[] = [
        makeResource("PROG1", "CICSProgram"),
        makeResource("PROG2", "CICSProgram"),
        makeResource("PROG3", "CICSProgram"),
        makeResource("PROG4", "CICSProgram"),
        makeResource("PROG5", "CICSProgram"),
      ];
      workspaceConfigurationGetMock.mockReturnValue(existing);

      await PersistentStorage.appendRecentResource(makeResource("PROG6", "CICSProgram"));

      const saved = workspaceConfigurationUpdateMock.mock.calls[0][1].recentResources as IRecentResource[];
      const programEntries = saved.filter((r) => r.resourceType === "CICSProgram");
      expect(programEntries.length).toBe(5);
      expect(programEntries[0].resourceName).toBe("PROG6");
      expect(programEntries.find((r) => r.resourceName === "PROG5")).toBeUndefined();
    });

    it("capping one type does not affect entries of other types", async () => {
      const existing: IRecentResource[] = [
        makeResource("PROG1", "CICSProgram"),
        makeResource("PROG2", "CICSProgram"),
        makeResource("PROG3", "CICSProgram"),
        makeResource("PROG4", "CICSProgram"),
        makeResource("PROG5", "CICSProgram"),
        makeResource("TRAN1", "CICSLocalTransaction"),
      ];
      workspaceConfigurationGetMock.mockReturnValue(existing);

      await PersistentStorage.appendRecentResource(makeResource("PROG6", "CICSProgram"));

      const saved = workspaceConfigurationUpdateMock.mock.calls[0][1].recentResources as IRecentResource[];
      const transactionEntries = saved.filter((r) => r.resourceType === "CICSLocalTransaction");
      expect(transactionEntries.length).toBe(1);
      expect(transactionEntries[0].resourceName).toBe("TRAN1");
    });
  });
});

describe("PersistentStorage - searchHistory", () => {
  beforeEach(() => {
    workspaceConfigurationGetMock.mockReset();
    workspaceConfigurationUpdateMock.mockReset();
    workspaceConfigurationUpdateMock.mockResolvedValue(undefined);
  });

  describe("appendSearchHistory", () => {
    it("should pop the oldest entry when history exceeds max length", async () => {
      const existingHistory = Array.from({ length: 10 }, (_, i) => `SEARCH${i + 1}`);
      workspaceConfigurationGetMock.mockReturnValue(existingHistory);

      await PersistentStorage.appendSearchHistory("CICSProgram", "NEWSEARCH");

      const saved = workspaceConfigurationUpdateMock.mock.calls[0][1];
      const historyKey = Object.keys(saved).find((k) => k.includes("SearchHistory"));
      expect(historyKey).toBeDefined();
      if (historyKey) {
        expect(saved[historyKey].length).toBe(10);
        expect(saved[historyKey][0]).toBe("NEWSEARCH");
        expect(saved[historyKey]).not.toContain("SEARCH10");
      }
    });
  });
});

describe("PersistentStorage - loadedCICSProfiles", () => {
  beforeEach(() => {
    workspaceConfigurationGetMock.mockReset();
    workspaceConfigurationUpdateMock.mockReset();
    workspaceConfigurationUpdateMock.mockResolvedValue(undefined);
  });

  describe("appendLoadedCICSProfile", () => {
    it("should prepend a new profile to an empty list", async () => {
      workspaceConfigurationGetMock.mockReturnValue([]);

      await PersistentStorage.appendLoadedCICSProfile("MYPROFILE");

      expect(workspaceConfigurationUpdateMock).toHaveBeenCalledWith(
        "zowe.cics.persistent",
        expect.objectContaining({
          loadedCICSProfile: ["MYPROFILE"],
        }),
        expect.anything()
      );
    });

    it("should prepend a new profile to an existing list", async () => {
      workspaceConfigurationGetMock.mockReturnValue(["OLDPROFILE"]);

      await PersistentStorage.appendLoadedCICSProfile("NEWPROFILE");

      expect(workspaceConfigurationUpdateMock).toHaveBeenCalledWith(
        "zowe.cics.persistent",
        expect.objectContaining({
          loadedCICSProfile: ["NEWPROFILE", "OLDPROFILE"],
        }),
        expect.anything()
      );
    });

    it("should move an existing profile to the front instead of duplicating", async () => {
      workspaceConfigurationGetMock.mockReturnValue(["PROFILE1", "PROFILE2", "PROFILE3"]);

      await PersistentStorage.appendLoadedCICSProfile("PROFILE2");

      const saved = workspaceConfigurationUpdateMock.mock.calls[0][1].loadedCICSProfile as string[];
      expect(saved[0]).toBe("PROFILE2");
      expect(saved.filter((p) => p === "PROFILE2").length).toBe(1);
      expect(saved.length).toBe(3);
    });
  });

  describe("removeLoadedCICSProfile", () => {
    it("should remove a profile from the list", async () => {
      workspaceConfigurationGetMock.mockReturnValue(["PROFILE1", "PROFILE2", "PROFILE3"]);

      await PersistentStorage.removeLoadedCICSProfile("PROFILE2");

      expect(workspaceConfigurationUpdateMock).toHaveBeenCalledWith(
        "zowe.cics.persistent",
        expect.objectContaining({
          loadedCICSProfile: ["PROFILE1", "PROFILE3"],
        }),
        expect.anything()
      );
    });

    it("should handle removing a profile that doesn't exist", async () => {
      workspaceConfigurationGetMock.mockReturnValue(["PROFILE1", "PROFILE2"]);

      await PersistentStorage.removeLoadedCICSProfile("NONEXISTENT");

      expect(workspaceConfigurationUpdateMock).toHaveBeenCalledWith(
        "zowe.cics.persistent",
        expect.objectContaining({
          loadedCICSProfile: ["PROFILE1", "PROFILE2"],
        }),
        expect.anything()
      );
    });
  });
});

describe("PersistentStorage - criteria", () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = {
      workspaceState: {
        update: jest.fn().mockResolvedValue(undefined),
        get: jest.fn(),
        keys: jest.fn().mockReturnValue([]),
      },
    };
    PersistentStorage.setContext(mockContext);
  });

  describe("getCriteriaKeysForSession", () => {
    it("should return keys that start with the profile name", () => {
      mockContext.workspaceState.keys.mockReturnValue([
        "MYPROFILE-resource1",
        "MYPROFILE-resource2",
        "OTHERPROFILE-resource1",
        "ANOTHERPROFILE-resource1",
      ]);

      const keys = PersistentStorage.getCriteriaKeysForSession("MYPROFILE");

      expect(keys).toEqual(["MYPROFILE-resource1", "MYPROFILE-resource2"]);
    });

    it("should return empty array when no matching keys exist", () => {
      mockContext.workspaceState.keys.mockReturnValue(["OTHERPROFILE-resource1", "ANOTHERPROFILE-resource1"]);

      const keys = PersistentStorage.getCriteriaKeysForSession("MYPROFILE");

      expect(keys).toEqual([]);
    });
  });
});

// Made with Bob

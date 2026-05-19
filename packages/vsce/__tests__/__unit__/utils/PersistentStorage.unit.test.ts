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

  const makeResource = (resourceName: string, resourceType: string, humanReadableType = "Program"): IRecentResource => ({
    resourceName,
    resourceType,
    humanReadableType,
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
      const existing = [makeResource("MYRES", "CICSProgram", "Program")];
      workspaceConfigurationGetMock.mockReturnValue(existing);

      await PersistentStorage.appendRecentResource(makeResource("MYRES", "CICSLocalTransaction", "Transaction"));

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
        makeResource("TRAN1", "CICSLocalTransaction", "Transaction"),
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

// Made with Bob

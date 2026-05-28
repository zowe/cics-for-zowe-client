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

import type { ICommandParams } from "../../../../src/doc/commands/ICommandParams";

describe("ICommandParams", () => {
  describe("Interface Structure", () => {
    it("should define the interface structure with all required properties", () => {
      const mockCommandParams: ICommandParams = {
        name: "TESTPROG",
        regionName: "REGION1",
        cicsPlex: "PLEX1",
      };

      expect(mockCommandParams.name).toBe("TESTPROG");
      expect(mockCommandParams.regionName).toBe("REGION1");
      expect(mockCommandParams.cicsPlex).toBe("PLEX1");
    });
  });

  describe("Resource Name Patterns", () => {
    it("should support wildcard patterns with asterisk", () => {
      const mockCommandParams: ICommandParams = {
        name: "RESOURCE*",
        regionName: "RGN*",
        cicsPlex: "PLEX*",
      };

      expect(mockCommandParams.name).toContain("*");
      expect(mockCommandParams.regionName).toContain("*");
      expect(mockCommandParams.cicsPlex).toContain("*");
    });

    it("should support exact resource names without wildcards", () => {
      const mockCommandParams: ICommandParams = {
        name: "EXACTPROG",
        regionName: "EXACTRGN",
        cicsPlex: "EXACTPLEX",
      };

      expect(mockCommandParams.name).not.toContain("*");
      expect(mockCommandParams.regionName).not.toContain("*");
      expect(mockCommandParams.cicsPlex).not.toContain("*");
    });
  });

  describe("Object Operations", () => {
    it("should be serializable to JSON", () => {
      const mockCommandParams: ICommandParams = {
        name: "TESTPROG",
        regionName: "REGION1",
        cicsPlex: "PLEX1",
      };

      const json = JSON.stringify(mockCommandParams);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual(mockCommandParams);
    });

    it("should support partial updates", () => {
      const mockCommandParams: ICommandParams = {
        name: "TESTPROG",
        regionName: "REGION1",
        cicsPlex: "PLEX1",
      };

      const updated: ICommandParams = {
        ...mockCommandParams,
        name: "NEWPROG",
      };

      expect(updated.name).toBe("NEWPROG");
      expect(updated.regionName).toBe("REGION1");
      expect(updated.cicsPlex).toBe("PLEX1");
    });
  });

  describe("Real-world Usage Scenarios", () => {
    it("should represent a program command in a standalone region", () => {
      const programCommand: ICommandParams = {
        name: "TESTPROG",
        regionName: "CICSTS01",
        cicsPlex: "",
      };

      expect(programCommand.name).toBe("TESTPROG");
      expect(programCommand.regionName).toBe("CICSTS01");
      expect(programCommand.cicsPlex).toBe("");
    });

    it("should represent a program command in a CICSPlex", () => {
      const programCommand: ICommandParams = {
        name: "TESTPROG",
        regionName: "CICSTS01",
        cicsPlex: "PLEXSM01",
      };

      expect(programCommand.name).toBe("TESTPROG");
      expect(programCommand.regionName).toBe("CICSTS01");
      expect(programCommand.cicsPlex).toBe("PLEXSM01");
    });

    it("should represent a wildcard search command", () => {
      const searchCommand: ICommandParams = {
        name: "TEST*",
        regionName: "CICSTS01",
        cicsPlex: "PLEXSM01",
      };

      expect(searchCommand.name).toBe("TEST*");
      expect(searchCommand.regionName).toBe("CICSTS01");
      expect(searchCommand.cicsPlex).toBe("PLEXSM01");
    });
  });
});



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

import type { IRecentResource } from "../../../../src/doc/commands/IRecentResource";

describe("IRecentResource", () => {
  describe("Interface Structure", () => {
    it("should define the interface structure with all properties", () => {
      const mockRecentResource: IRecentResource = {
        resourceName: "PROG001",
        resourceType: "CICSProgram",
      };

      expect(mockRecentResource.resourceName).toBe("PROG001");
      expect(mockRecentResource.resourceType).toBe("CICSProgram");
    });
  });

  describe("Object Operations", () => {
    it("should be serializable to JSON", () => {
      const mockRecentResource: IRecentResource = {
        resourceName: "TRAN001",
        resourceType: "CICSTransaction",
      };

      const json = JSON.stringify(mockRecentResource);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual(mockRecentResource);
    });

    it("should support partial updates", () => {
      const mockRecentResource: IRecentResource = {
        resourceName: "PROG001",
        resourceType: "CICSProgram",
      };

      const updated: IRecentResource = {
        ...mockRecentResource,
        resourceName: "PROG002",
      };

      expect(updated.resourceName).toBe("PROG002");
      expect(updated.resourceType).toBe("CICSProgram");
    });
  });

  describe("Real-world Usage Scenarios", () => {
    it("should represent a CICS Program resource", () => {
      const programResource: IRecentResource = {
        resourceName: "MYPROGRAM",
        resourceType: "CICSProgram",
      };

      expect(programResource.resourceName).toBe("MYPROGRAM");
      expect(programResource.resourceType).toBe("CICSProgram");
    });

    it("should represent a CICS Transaction resource", () => {
      const transactionResource: IRecentResource = {
        resourceName: "TRAN",
        resourceType: "CICSTransaction",
      };

      expect(transactionResource.resourceName).toBe("TRAN");
      expect(transactionResource.resourceType).toBe("CICSTransaction");
    });

    it("should represent a CICS Local File resource", () => {
      const localFileResource: IRecentResource = {
        resourceName: "MYFILE",
        resourceType: "CICSLocalFile",
      };

      expect(localFileResource.resourceName).toBe("MYFILE");
      expect(localFileResource.resourceType).toBe("CICSLocalFile");
    });
  });
});

// Made with Bob

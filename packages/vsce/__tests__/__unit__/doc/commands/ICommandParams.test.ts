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
  it("should define the interface structure", () => {
    const mockCommandParams: ICommandParams = {
      name: "TESTPROG",
      regionName: "REGION1",
      cicsPlex: "PLEX1",
    };

    expect(mockCommandParams.name).toBe("TESTPROG");
    expect(mockCommandParams.regionName).toBe("REGION1");
    expect(mockCommandParams.cicsPlex).toBe("PLEX1");
  });

  it("should work with different values", () => {
    const mockCommandParams: ICommandParams = {
      name: "PRODPROG",
      regionName: "PRODRGN",
      cicsPlex: "PRODPLEX",
    };

    expect(mockCommandParams).toEqual({
      name: "PRODPROG",
      regionName: "PRODRGN",
      cicsPlex: "PRODPLEX",
    });
  });

  it("should allow all string properties", () => {
    const mockCommandParams: ICommandParams = {
      name: "RESOURCE*",
      regionName: "RGN*",
      cicsPlex: "PLEX*",
    };

    expect(mockCommandParams.name).toContain("*");
    expect(mockCommandParams.regionName).toContain("*");
    expect(mockCommandParams.cicsPlex).toContain("*");
  });
});



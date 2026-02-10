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

import * as vscode from "vscode";

jest.mock("../../../src/commands/setCICSRegionCommand", () => ({
  setCICSRegion: jest.fn(),
}));

jest.mock("../../../src/commands/inspectResourceCommandUtils", () => ({
  inspectRegionByName: jest.fn(),
}));

import { getInspectRegionCommand } from "../../../src/commands/inspectRegionCommand";
import { ManagedRegionMeta } from "../../../src/doc/meta/managedRegion.meta";
import { CICSResourceContainerNode } from "../../../src/trees";

jest.spyOn(vscode.commands, "registerCommand").mockImplementation((_: any, cb: any) => cb as unknown as vscode.Disposable);
describe("Test suite for Inspect Region command", () => {
  test("Should return when no region is selected", async () => {
    const command = (getInspectRegionCommand as any)({} as any);
    await expect((command as any)()).resolves.toBeUndefined();
  });

  test("Should give you error if selected node is not a region node", async () => {
    const mockedNode = {} as CICSResourceContainerNode<any>;
    const command = (getInspectRegionCommand as any)({} as any);
    await expect((command as any)(mockedNode)).resolves.toBeUndefined();
  });

  test("should call inspectRegionByName with mocked region values", async () => {
    const setModule = require("../../../src/commands/setCICSRegionCommand");
    const inspectModule = require("../../../src/commands/inspectResourceCommandUtils");

    const fakeProfile = { name: "PROFILE1" };
    (setModule.setCICSRegion as jest.Mock).mockResolvedValue({ profile: fakeProfile, cicsPlexName: "PLEX1", regionName: "REG1" });

    const context = {} as any;
    const command = (getInspectRegionCommand as any)(context);

    await (command as any)();

    expect(setModule.setCICSRegion).toHaveBeenCalled();
    expect(inspectModule.inspectRegionByName).toHaveBeenCalledWith(
      context,
      ManagedRegionMeta,
      expect.objectContaining({
        profile: {
          name: "PROFILE1",
        },
        cicsplexName: "PLEX1",
        regionName: "REG1",
      })
    );
  });
});

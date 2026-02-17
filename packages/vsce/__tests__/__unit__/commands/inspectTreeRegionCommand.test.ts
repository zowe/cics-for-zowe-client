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

import type { Extension } from "vscode";
import * as vscode from "vscode";

jest.spyOn(vscode.extensions, "getExtension").mockReturnValue({
  packageJSON: {
    version: "1.2.3",
  },
} as Extension<any>);

jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {},
}));

jest.mock("../../../src/commands/setCICSRegionCommand", () => ({
  setCICSRegion: jest.fn(),
}));

jest.mock("../../../src/commands/inspectResourceCommandUtils", () => ({
  inspectRegionByName: jest.fn(),
  inspectRegionByNode: jest.fn(),
}));

import { getInspectTreeRegionCommand } from "../../../src/commands/inspectTreeRegionCommand";
import { ManagedRegionMeta } from "../../../src/doc";

let mockedClipboard = ``;

jest.spyOn(vscode.env.clipboard, "writeText").mockImplementation(async (text: string) => {
  mockedClipboard = text;
  return Promise.resolve();
});

jest.spyOn(vscode.commands, "registerCommand").mockImplementation((_: any, cb: any) => cb as unknown as vscode.Disposable);
describe("Test suite for Inspect Region command", () => {
  beforeEach(() => {
    mockedClipboard = ``;
  });

  test("should call inspectRegionByNode with mocked region node values", async () => {
    const setModule = require("../../../src/commands/setCICSRegionCommand");
    const inspectModule = require("../../../src/commands/inspectResourceCommandUtils");

    const fakeProfile = { name: "PROFILE1" };
    (setModule.setCICSRegion as jest.Mock).mockResolvedValue({ profile: fakeProfile, cicsPlexName: "PLEX1", regionName: "REG1" });

    const context = {} as any;
    (inspectModule.inspectRegionByNode as jest.Mock).mockResolvedValue(undefined);

    const command = getInspectTreeRegionCommand(context);

    const fakeNode = {
      getContainedResource: (): any => ({ meta: ManagedRegionMeta, resource: { attributes: { cicsname: "REG1" } } }),
      getParent: (): any => undefined,
      getContainedResourceName: (): string => "REG1",
    } as any;

    await (command as any)(fakeNode);

    expect(setModule.setCICSRegion).not.toHaveBeenCalled();
    expect(inspectModule.inspectRegionByNode).toHaveBeenCalledWith(context, fakeNode);
  });
});

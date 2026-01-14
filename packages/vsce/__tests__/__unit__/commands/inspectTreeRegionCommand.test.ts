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
  inspectResourceByNode: jest.fn(),
}));

import { getInspectTreeRegionCommand } from "../../../src/commands/inspectTreeRegionCommand";
import { RegionMeta } from "../../../src/doc";

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
  test("Should return when no region node is selected", async () => {
    const treeview = { selection: [] } as any;
    const command = (getInspectTreeRegionCommand as any)({} as any, treeview);
    await expect((command as any)()).resolves.toBeUndefined();
  });

  test("should call inspectRegionByNode with mocked region node values", async () => {
    const setModule = require("../../../src/commands/setCICSRegionCommand");
    const inspectModule = require("../../../src/commands/inspectResourceCommandUtils");

    const fakeProfile = { name: "PROFILE1" };
    (setModule.setCICSRegion as jest.Mock).mockResolvedValue({ profile: fakeProfile, cicsPlexName: "PLEX1", regionName: "REG1" });

    const context = {} as any;
    (inspectModule.inspectResourceByNode as jest.Mock).mockResolvedValue(undefined);

    const command = (getInspectTreeRegionCommand as any)(context, { selection: [] } as any);

    const fakeNode = {
      getContainedResource: (): any => ({ meta: RegionMeta, resource: { attributes: { cicsname: "REG1" } } }),
      getParent: (): any => undefined,
      getContainedResourceName: (): string => "REG1",
    } as any;

    await (command as any)(fakeNode);

    expect(setModule.setCICSRegion).not.toHaveBeenCalled();
    expect(inspectModule.inspectResourceByNode).toHaveBeenCalledWith(context, fakeNode);
  });
});

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
}));

import { getInspectRegionCommand } from "../../../src/commands/inspectRegionCommand";
import { CICSResourceContainerNode } from "../../../src/trees";

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
  test("Should return when no region is selected", async () => {
    const command = (getInspectRegionCommand as any)({} as any);
    await expect((command as any)()).resolves.toBeUndefined();
  });

  test("Should give you error if selected node is not a region node", async () => {
    const mockedNode = {} as CICSResourceContainerNode<any>;
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
    expect(inspectModule.inspectRegionByName).toHaveBeenCalledWith(context, "REG1", expect.any(String), {
      profileName: "PROFILE1",
      cicsplexName: "PLEX1",
      regionName: "REG1",
    });
  });
});

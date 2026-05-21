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

import { commands, ExtensionContext } from "vscode";
import { getInspectResourceCommand } from "../../../src/commands/inspectResourceCommand";
import * as inspectResourceCommandUtils from "../../../src/commands/inspectResourceCommandUtils";

jest.mock("vscode");
jest.mock("../../../src/commands/inspectResourceCommandUtils");

describe("inspectResourceCommand", () => {
  let mockContext: ExtensionContext;
  let commandCallback: Function;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {} as ExtensionContext;

    (commands.registerCommand as jest.Mock) = jest.fn((cmd, callback) => {
      commandCallback = callback;
      return { dispose: jest.fn() };
    });
  });

  it("should register the inspectResource command", () => {
    getInspectResourceCommand(mockContext);

    expect(commands.registerCommand).toHaveBeenCalledWith(
      "cics-extension-for-zowe.inspectResource",
      expect.any(Function)
    );
  });

  it("should call inspectResourceByName when resourceName and resourceType are provided", async () => {
    (inspectResourceCommandUtils.inspectResourceByName as jest.Mock).mockResolvedValue(undefined);

    getInspectResourceCommand(mockContext);
    await commandCallback("PROG1", "CICSProgram");

    expect(inspectResourceCommandUtils.inspectResourceByName).toHaveBeenCalledWith(
      mockContext,
      "PROG1",
      "CICSProgram"
    );
    expect(inspectResourceCommandUtils.inspectResource).not.toHaveBeenCalled();
  });

  it("should call inspectResource when no parameters are provided", async () => {
    (inspectResourceCommandUtils.inspectResource as jest.Mock).mockResolvedValue(undefined);

    getInspectResourceCommand(mockContext);
    await commandCallback();

    expect(inspectResourceCommandUtils.inspectResource).toHaveBeenCalledWith(mockContext);
    expect(inspectResourceCommandUtils.inspectResourceByName).not.toHaveBeenCalled();
  });

  it("should call inspectResource when only resourceName is provided", async () => {
    (inspectResourceCommandUtils.inspectResource as jest.Mock).mockResolvedValue(undefined);

    getInspectResourceCommand(mockContext);
    await commandCallback("PROG1");

    expect(inspectResourceCommandUtils.inspectResource).toHaveBeenCalledWith(mockContext);
    expect(inspectResourceCommandUtils.inspectResourceByName).not.toHaveBeenCalled();
  });

  it("should call inspectResource when only resourceType is provided", async () => {
    (inspectResourceCommandUtils.inspectResource as jest.Mock).mockResolvedValue(undefined);

    getInspectResourceCommand(mockContext);
    await commandCallback(undefined, "CICSProgram");

    expect(inspectResourceCommandUtils.inspectResource).toHaveBeenCalledWith(mockContext);
    expect(inspectResourceCommandUtils.inspectResourceByName).not.toHaveBeenCalled();
  });
});



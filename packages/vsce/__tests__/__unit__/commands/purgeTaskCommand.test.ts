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

import { commands, window, ProgressLocation, TreeView } from "vscode";
import { getPurgeTaskCommand } from "../../../src/commands/purgeTaskCommand";
import { findSelectedNodes, splitCmciErrorMessage } from "../../../src/utils/commandUtils";
import { runPutResource } from "../../../src/utils/resourceUtils";
import { evaluateTreeNodes } from "../../../src/utils/treeUtils";
import { TaskMeta } from "../../../src/doc";

jest.mock("vscode");
jest.mock("../../../src/utils/commandUtils");
jest.mock("../../../src/utils/resourceUtils");
jest.mock("../../../src/utils/treeUtils");

describe("purgeTaskCommand", () => {
  let mockTree: any;
  let mockTreeview: any;
  let mockNode: any;
  let mockParentNode: any;
  let commandCallback: Function;
  let mockProgress: any;
  let mockToken: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockParentNode = {
      refresh: jest.fn(),
    };

    mockNode = {
      getProfile: jest.fn().mockReturnValue({
        name: "testProfile",
      }),
      regionName: "TESTREGION",
      cicsplexName: "TESTPLEX",
      getContainedResource: jest.fn().mockReturnValue({
        meta: TaskMeta,
        resource: {
          attributes: {
            task: "00001",
            eyu_cicsname: "TESTREGION",
          },
        },
      }),
      getContainedResourceName: jest.fn().mockReturnValue("00001"),
      getParent: jest.fn().mockReturnValue(mockParentNode),
    };

    mockTree = {
      refresh: jest.fn(),
      _onDidChangeTreeData: {
        fire: jest.fn(),
      },
    };

    mockTreeview = {} as TreeView<any>;

    mockProgress = {
      report: jest.fn(),
    };

    mockToken = {
      onCancellationRequested: jest.fn(),
    };

    (commands.registerCommand as jest.Mock) = jest.fn((commandId, callback) => {
      commandCallback = callback;
      return { dispose: jest.fn() };
    });

    (window.withProgress as jest.Mock) = jest.fn().mockImplementation((options, callback) => {
      // Execute callback immediately and return the promise
      return callback(mockProgress, mockToken);
    });

    (window.showInformationMessage as jest.Mock) = jest.fn();
    (window.showErrorMessage as jest.Mock) = jest.fn();
    (findSelectedNodes as jest.Mock) = jest.fn().mockReturnValue([mockNode]);
    (runPutResource as jest.Mock) = jest.fn().mockResolvedValue({
      response: {
        resultsummary: {},
        records: [],
      },
    });
    (evaluateTreeNodes as jest.Mock) = jest.fn();
    (splitCmciErrorMessage as jest.Mock) = jest.fn().mockReturnValue(["resp", "resp2", "respAlt", "eibfnAlt"]);
  });

  describe("getPurgeTaskCommand", () => {
    it("should register the command", () => {
      getPurgeTaskCommand(mockTree, mockTreeview);

      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.purgeTask",
        expect.any(Function)
      );
    });
  });

  describe("purgeTask command execution", () => {
    it("should purge task with Purge option", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Purge");
      getPurgeTaskCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(findSelectedNodes).toHaveBeenCalledWith(mockTreeview, TaskMeta, mockNode);
      expect(window.showInformationMessage).toHaveBeenCalledWith(
        expect.stringContaining("Purge"),
        "Purge",
        "Force Purge"
      );
      expect(window.withProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          location: ProgressLocation.Notification,
          cancellable: true,
        }),
        expect.any(Function)
      );
      expect(runPutResource).toHaveBeenCalledWith(
        expect.objectContaining({
          profileName: "testProfile",
          resourceName: "CICSTask",
          cicsPlex: "TESTPLEX",
          regionName: "TESTREGION",
          params: { criteria: "TASK='00001'" },
        }),
        expect.objectContaining({
          request: {
            action: {
              $: { name: "PURGE" },
              parameter: {
                $: { name: "TYPE", value: "PURGE" },
              },
            },
          },
        })
      );
      expect(evaluateTreeNodes).toHaveBeenCalled();
      expect(mockTree.refresh).toHaveBeenCalledWith(mockParentNode);
    });

    it("should purge task with Force Purge option", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Force Purge");
      getPurgeTaskCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(runPutResource).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          request: {
            action: {
              $: { name: "PURGE" },
              parameter: {
                $: { name: "TYPE", value: "FORCEPURGE" },
              },
            },
          },
        })
      );
    });

    it("should default to PURGE for unknown option", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Unknown Option");
      getPurgeTaskCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(runPutResource).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          request: {
            action: {
              $: { name: "PURGE" },
              parameter: {
                $: { name: "TYPE", value: "PURGE" },
              },
            },
          },
        })
      );
    });

    it("should not purge when user cancels selection", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);
      getPurgeTaskCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(runPutResource).not.toHaveBeenCalled();
      expect(window.withProgress).not.toHaveBeenCalled();
    });

    it("should show error when no tasks selected", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue([]);
      getPurgeTaskCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalledWith(expect.stringContaining("No CICS"));
      expect(window.showInformationMessage).not.toHaveBeenCalled();
      expect(runPutResource).not.toHaveBeenCalled();
    });

    it("should show error when nodes is null", async () => {
      (findSelectedNodes as jest.Mock).mockReturnValue(null);
      getPurgeTaskCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalled();
      expect(runPutResource).not.toHaveBeenCalled();
    });

    it("should use eyu_cicsname when regionName is not available", async () => {
      mockNode.regionName = undefined;
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Purge");
      getPurgeTaskCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(runPutResource).toHaveBeenCalledWith(
        expect.objectContaining({
          regionName: "TESTREGION",
        }),
        expect.anything()
      );
    });

    it("should report progress for each task", async () => {
      const mockNode2 = {
        ...mockNode,
        getContainedResourceName: jest.fn().mockReturnValue("00002"),
      };
      (findSelectedNodes as jest.Mock).mockReturnValue([mockNode, mockNode2]);
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Purge");
      getPurgeTaskCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(mockProgress.report).toHaveBeenCalledTimes(2);
      expect(mockProgress.report).toHaveBeenNthCalledWith(1, expect.objectContaining({
        message: expect.stringContaining("1 of 2"),
        increment: expect.any(Number),
      }));
      expect(mockProgress.report).toHaveBeenNthCalledWith(2, expect.objectContaining({
        message: expect.stringContaining("2 of 2"),
        increment: expect.any(Number),
      }));
    });


    it("should register cancellation token handler", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Purge");
      getPurgeTaskCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(mockToken.onCancellationRequested).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe("error handling", () => {
    it("should handle CMCI error with mMessage", async () => {
      const cmciError = {
        mMessage: "DFHAC2001 Transaction ABCD failed",
      };
      (runPutResource as jest.Mock).mockRejectedValue(cmciError);
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Purge");
      getPurgeTaskCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(splitCmciErrorMessage).toHaveBeenCalledWith(cmciError.mMessage);
      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("PURGE")
      );
      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("00001")
      );
      expect(mockTree.refresh).toHaveBeenCalled();
    });

    it("should handle generic error without mMessage", async () => {
      const genericError = new Error("Network error");
      (runPutResource as jest.Mock).mockRejectedValue(genericError);
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Force Purge");
      getPurgeTaskCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("FORCEPURGE")
      );
      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.stringContaining("Network error")
      );
      expect(mockTree.refresh).toHaveBeenCalled();
    });


    it("should sanitize error message by removing newlines and tabs", async () => {
      const errorWithFormatting = {
        message: "Error\n\twith\nformatting\t",
        stack: "Stack\ntrace",
      };
      (runPutResource as jest.Mock).mockRejectedValue(errorWithFormatting);
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Purge");
      getPurgeTaskCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.not.stringContaining("\n")
      );
      expect(window.showErrorMessage).toHaveBeenCalledWith(
        expect.not.stringContaining("\t")
      );
    });
  });

  describe("progress reporting", () => {
    it("should show correct progress title", async () => {
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Purge");
      getPurgeTaskCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(window.withProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining("Purge"),
        }),
        expect.any(Function)
      );
    });

  });

  describe("evaluateTreeNodes", () => {
    it("should call evaluateTreeNodes with correct parameters", async () => {
      const mockResponse = {
        response: {
          resultsummary: { api_response1: "OK" },
          records: [{ task: "00001" }],
        },
      };
      (runPutResource as jest.Mock).mockResolvedValue(mockResponse);
      (window.showInformationMessage as jest.Mock).mockResolvedValue("Purge");
      getPurgeTaskCommand(mockTree, mockTreeview);

      await commandCallback(mockNode);

      expect(evaluateTreeNodes).toHaveBeenCalledWith(
        mockNode,
        mockResponse,
        TaskMeta
      );
    });
  });
});
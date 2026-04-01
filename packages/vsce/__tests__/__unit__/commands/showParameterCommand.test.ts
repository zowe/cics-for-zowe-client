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

import { commands, window, ViewColumn } from "vscode";
import { getShowRegionSITParametersCommand } from "../../../src/commands/showParameterCommand";
import { runGetResource } from "../../../src/utils/resourceUtils";
import { getParametersHtml } from "../../../src/utils/webviewHTML";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";

jest.mock("vscode");
jest.mock("../../../src/utils/resourceUtils");
jest.mock("../../../src/utils/webviewHTML");
jest.mock("../../../src/trees/CICSRegionTree");

describe("showParameterCommand", () => {
  let commandCallback: Function;
  let mockPanel: any;
  let mockProfile: any;
  let mockRegionNode: any;
  let mockResourceNode: any;
  let mockParentPlex: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPanel = {
      webview: {
        html: "",
      },
    };

    mockProfile = {
      name: "testProfile",
    };

    mockParentPlex = {
      getPlexName: jest.fn().mockReturnValue("TESTPLEX"),
    };

    mockRegionNode = {
      getProfile: jest.fn().mockReturnValue(mockProfile),
      label: "TESTREGION",
      parentPlex: mockParentPlex,
    };

    mockResourceNode = {
      getProfile: jest.fn().mockReturnValue(mockProfile),
      regionName: "TESTREGION",
      cicsplexName: "TESTPLEX",
    };

    (commands.registerCommand as jest.Mock) = jest.fn((commandId, callback) => {
      commandCallback = callback;
      return { dispose: jest.fn() };
    });

    (window.createWebviewPanel as jest.Mock) = jest.fn().mockReturnValue(mockPanel);
    (window.activeTextEditor as any) = undefined;

    (runGetResource as jest.Mock) = jest.fn().mockResolvedValue({
      response: {
        records: {
          cicssystemparameter: [
            {
              keyword: "applid",
              source: "table",
              value: "CICSRGN1",
            },
            {
              keyword: "grplist",
              source: "console",
              value: "DFHLIST",
            },
            {
              keyword: "start",
              source: "jcl",
              value: "auto",
            },
          ],
        },
      },
    });

    (getParametersHtml as jest.Mock) = jest.fn().mockReturnValue("<html>Mock HTML</html>");
  });

  describe("getShowRegionSITParametersCommand", () => {
    it("should register the command", () => {
      getShowRegionSITParametersCommand();

      expect(commands.registerCommand).toHaveBeenCalledWith(
        "cics-extension-for-zowe.showRegionParameters",
        expect.any(Function)
      );
    });
  });

  describe("showRegionParameters - CICSRegionTree node", () => {
    it("should show parameters for region tree node", async () => {
      // Create a proper instance that passes instanceof check
      const regionTreeInstance = Object.create(CICSRegionTree.prototype);
      Object.assign(regionTreeInstance, mockRegionNode);
      
      getShowRegionSITParametersCommand();

      await commandCallback(regionTreeInstance);

      expect(runGetResource).toHaveBeenCalledWith({
        profileName: "testProfile",
        resourceName: CicsCmciConstants.CICS_SYSTEM_PARAMETER,
        regionName: "TESTREGION",
        cicsPlex: "TESTPLEX",
        params: { parameter: "PARMSRCE(COMBINED) PARMTYPE(SIT)" },
      });

      expect(getParametersHtml).toHaveBeenCalledWith(
        "TESTREGION",
        expect.stringContaining("<thead>")
      );

      expect(window.createWebviewPanel).toHaveBeenCalledWith(
        "zowe",
        expect.stringContaining("TESTREGION"),
        1,
        { enableScripts: true }
      );

      expect(mockPanel.webview.html).toBe("<html>Mock HTML</html>");
    });

    it("should handle region tree node without parent plex", async () => {
      const regionTreeInstance = Object.create(CICSRegionTree.prototype);
      mockRegionNode.parentPlex = undefined;
      Object.assign(regionTreeInstance, mockRegionNode);
      
      getShowRegionSITParametersCommand();

      await commandCallback(regionTreeInstance);

      expect(runGetResource).toHaveBeenCalledWith({
        profileName: "testProfile",
        resourceName: CicsCmciConstants.CICS_SYSTEM_PARAMETER,
        regionName: "TESTREGION",
        cicsPlex: undefined,
        params: { parameter: "PARMSRCE(COMBINED) PARMTYPE(SIT)" },
      });
    });

    it("should use active editor column when available", async () => {
      const regionTreeInstance = Object.create(CICSRegionTree.prototype);
      Object.assign(regionTreeInstance, mockRegionNode);
      
      (window.activeTextEditor as any) = {
        viewColumn: ViewColumn.Two,
      };
      getShowRegionSITParametersCommand();

      await commandCallback(regionTreeInstance);

      expect(window.createWebviewPanel).toHaveBeenCalledWith(
        "zowe",
        expect.any(String),
        ViewColumn.Two,
        { enableScripts: true }
      );
    });
  });

  describe("showRegionParameters - CICSResourceContainerNode", () => {
    it("should show parameters for resource container node", async () => {
      getShowRegionSITParametersCommand();

      await commandCallback(mockResourceNode);

      expect(runGetResource).toHaveBeenCalledWith({
        profileName: "testProfile",
        resourceName: CicsCmciConstants.CICS_SYSTEM_PARAMETER,
        regionName: "TESTREGION",
        cicsPlex: "TESTPLEX",
        params: { parameter: "PARMSRCE(COMBINED) PARMTYPE(SIT)" },
      });

      expect(getParametersHtml).toHaveBeenCalled();
      expect(window.createWebviewPanel).toHaveBeenCalled();
    });

    it("should handle resource node without cicsplex", async () => {
      mockResourceNode.cicsplexName = undefined;
      getShowRegionSITParametersCommand();

      await commandCallback(mockResourceNode);

      expect(runGetResource).toHaveBeenCalledWith({
        profileName: "testProfile",
        resourceName: CicsCmciConstants.CICS_SYSTEM_PARAMETER,
        regionName: "TESTREGION",
        cicsPlex: undefined,
        params: { parameter: "PARMSRCE(COMBINED) PARMTYPE(SIT)" },
      });
    });
  });

  describe("HTML generation", () => {
    it("should generate HTML with all parameters", async () => {
      getShowRegionSITParametersCommand();

      await commandCallback(mockRegionNode);

      const htmlCall = (getParametersHtml as jest.Mock).mock.calls[0];
      const webText = htmlCall[1];

      expect(webText).toContain("<thead>");
      expect(webText).toContain("<tbody>");
      expect(webText).toContain("APPLID");
      expect(webText).toContain("TABLE");
      expect(webText).toContain("CICSRGN1");
      expect(webText).toContain("GRPLIST");
      expect(webText).toContain("CONSOLE");
      expect(webText).toContain("DFHLIST");
      expect(webText).toContain("START");
      expect(webText).toContain("JCL");
      expect(webText).toContain("AUTO");
    });

    it("should include filter dropdown options", async () => {
      getShowRegionSITParametersCommand();

      await commandCallback(mockRegionNode);

      const htmlCall = (getParametersHtml as jest.Mock).mock.calls[0];
      const webText = htmlCall[1];

      expect(webText).toContain('<select id="filterSource"');
      expect(webText).toContain('value="combined"');
      expect(webText).toContain('value="console"');
      expect(webText).toContain('value="jcl"');
      expect(webText).toContain('value="sysin"');
      expect(webText).toContain('value="table"');
    });

    it("should include search box", async () => {
      getShowRegionSITParametersCommand();

      await commandCallback(mockRegionNode);

      const htmlCall = (getParametersHtml as jest.Mock).mock.calls[0];
      const webText = htmlCall[1];

      expect(webText).toContain('<input type="text" id="searchBox"');
    });

    it("should handle empty parameter list", async () => {
      (runGetResource as jest.Mock).mockResolvedValue({
        response: {
          records: {
            cicssystemparameter: [],
          },
        },
      });
      getShowRegionSITParametersCommand();

      await commandCallback(mockRegionNode);

      const htmlCall = (getParametersHtml as jest.Mock).mock.calls[0];
      const webText = htmlCall[1];

      expect(webText).toContain("<thead>");
      expect(webText).toContain("<tbody>");
      expect(webText).toContain("</tbody>");
    });

    it("should uppercase parameter values", async () => {
      (runGetResource as jest.Mock).mockResolvedValue({
        response: {
          records: {
            cicssystemparameter: [
              {
                keyword: "lowercase",
                source: "mixed",
                value: "testvalue",
              },
            ],
          },
        },
      });
      getShowRegionSITParametersCommand();

      await commandCallback(mockRegionNode);

      const htmlCall = (getParametersHtml as jest.Mock).mock.calls[0];
      const webText = htmlCall[1];

      expect(webText).toContain("LOWERCASE");
      expect(webText).toContain("MIXED");
      expect(webText).toContain("TESTVALUE");
    });
  });

  describe("webview panel creation", () => {
    it("should create panel with correct title", async () => {
      getShowRegionSITParametersCommand();

      await commandCallback(mockRegionNode);

      expect(window.createWebviewPanel).toHaveBeenCalledWith(
        "zowe",
        expect.stringContaining("CICS Region"),
        expect.any(Number),
        expect.any(Object)
      );
    });

    it("should enable scripts in webview", async () => {
      getShowRegionSITParametersCommand();

      await commandCallback(mockRegionNode);

      expect(window.createWebviewPanel).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Number),
        { enableScripts: true }
      );
    });

    it("should set webview HTML content", async () => {
      getShowRegionSITParametersCommand();

      await commandCallback(mockRegionNode);

      expect(mockPanel.webview.html).toBe("<html>Mock HTML</html>");
    });
  });

  describe("error handling", () => {
    it("should handle runGetResource errors", async () => {
      (runGetResource as jest.Mock).mockRejectedValue(new Error("API Error"));
      getShowRegionSITParametersCommand();

      await expect(commandCallback(mockRegionNode)).rejects.toThrow("API Error");
    });

    it("should handle missing response records", async () => {
      (runGetResource as jest.Mock).mockResolvedValue({
        response: {
          records: {},
        },
      });
      getShowRegionSITParametersCommand();

      await expect(commandCallback(mockRegionNode)).rejects.toThrow();
    });
  });

  describe("node type detection", () => {
    it("should correctly identify CICSRegionTree instance", async () => {
      const regionTreeInstance = Object.create(CICSRegionTree.prototype);
      Object.assign(regionTreeInstance, mockRegionNode);
      
      getShowRegionSITParametersCommand();

      await commandCallback(regionTreeInstance);

      expect(runGetResource).toHaveBeenCalledWith(
        expect.objectContaining({
          regionName: "TESTREGION",
          cicsPlex: "TESTPLEX",
        })
      );
    });

    it("should correctly identify CICSResourceContainerNode", async () => {
      getShowRegionSITParametersCommand();

      await commandCallback(mockResourceNode);

      expect(runGetResource).toHaveBeenCalledWith(
        expect.objectContaining({
          regionName: "TESTREGION",
          cicsPlex: "TESTPLEX",
        })
      );
    });
  });
});
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

import { IProgram } from "@zowe/cics-for-zowe-explorer-api";
import { CICSSession, ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { ProgramMeta } from "../../../src/doc";
import { CICSResourceContainerNode, CICSTree, CICSSessionTree, CICSRegionTree, CICSPlexTree } from "../../../src/trees";
import { evaluateTreeNodes, findResourceNodeInTree } from "../../../src/utils/treeUtils";
import { profile } from "../../__mocks__";

const prog: IProgram = {
  eyu_cicsname: "REG",
  library: "",
  librarydsn: "",
  newcopycnt: "1",
  program: "APROG",
  progtype: "",
  status: "ENABLED",
  usecount: "0",
  language: "COBOL",
  jvmserver: "EYUCMCIJ",
};

describe("Tree Utils tests", () => {
  describe("evaluateTreeNodes tests", () => {
    let resourceNode: CICSResourceContainerNode<IProgram>;
    let parentNode: CICSResourceContainerNode<IProgram>;

    beforeEach(() => {
      parentNode = {
        updateStoredItem: jest.fn(),
      } as Partial<CICSResourceContainerNode<IProgram>> as CICSResourceContainerNode<IProgram>;

      resourceNode = {
        getParent: jest.fn().mockReturnValue(parentNode),
      } as Partial<CICSResourceContainerNode<IProgram>> as CICSResourceContainerNode<IProgram>;
    });

    it("should do nothing if no record is returned", () => {
      const apiResp: ICMCIApiResponse = {
        response: {
          records: [],
          resultsummary: { api_response1: "", api_response2: "", displayed_recordcount: "0", recordcount: "0" },
        },
      };

      evaluateTreeNodes(resourceNode, apiResp, ProgramMeta);

      expect(parentNode.updateStoredItem).not.toHaveBeenCalled();
    });

    it("should update the record in the resource node", () => {
      const updatedProgram = { ...prog, newcopycnt: 2 };
      const apiResp: ICMCIApiResponse = {
        response: {
          records: {
            cicsprogram: updatedProgram,
          },
          resultsummary: { api_response1: "", api_response2: "", displayed_recordcount: "0", recordcount: "0" },
        },
      };

      evaluateTreeNodes(resourceNode, apiResp, ProgramMeta);

      expect(parentNode.updateStoredItem).toHaveBeenCalledTimes(1);
      expect(parentNode.updateStoredItem).toHaveBeenCalledWith({ meta: ProgramMeta, resource: { attributes: updatedProgram } });
    });
  });

  describe("findResourceNodeInTree tests", () => {
    it("should return undefined when session node is not found", () => {
      const mockCicsTree = {
        getSessionNodeForProfile: jest.fn().mockReturnValue(undefined),
      } as Partial<CICSTree> as CICSTree;

      const mockSession = {
        ISession: {
          hostname: "test",
          port: 1234,
          user: "user",
          password: "pass",
          type: "basic",
        },
      } as Partial<CICSSession> as CICSSession;

      const mockResourceContext = {
        profile: profile,
        regionName: "REG",
        cicsplexName: undefined as string | undefined,
        session: mockSession,
      };

      const mockResource = {
        meta: ProgramMeta,
        resource: { attributes: prog },
      };

      const result = findResourceNodeInTree(mockCicsTree, mockResourceContext, mockResource);
      expect(result).toBeUndefined();
    });

    it("should return undefined when session node has no children", () => {
      const mockSessionNode = {
        children: [],
      } as Partial<CICSSessionTree> as CICSSessionTree;

      const mockCicsTree = {
        getSessionNodeForProfile: jest.fn().mockReturnValue(mockSessionNode),
      } as Partial<CICSTree> as CICSTree;

      const mockSession = {
        ISession: {
          hostname: "test",
          port: 1234,
          user: "user",
          password: "pass",
          type: "basic",
        },
      } as Partial<CICSSession> as CICSSession;

      const mockResourceContext = {
        profile: profile,
        regionName: "REG",
        cicsplexName: undefined as string | undefined,
        session: mockSession,
      };

      const mockResource = {
        meta: ProgramMeta,
        resource: { attributes: prog },
      };

      const result = findResourceNodeInTree(mockCicsTree, mockResourceContext, mockResource);
      expect(result).toBeUndefined();
    });

    it("should return undefined when region node is not found", () => {
      const mockSessionNode = {
        children: [] as (CICSPlexTree | CICSRegionTree)[],
        getRegionNodeFromName: jest.fn().mockReturnValue(undefined),
      } as Partial<CICSSessionTree> as CICSSessionTree;

      const mockCicsTree = {
        getSessionNodeForProfile: jest.fn().mockReturnValue(mockSessionNode),
      } as Partial<CICSTree> as CICSTree;

      const mockSession = {
        ISession: {
          hostname: "test",
          port: 1234,
          user: "user",
          password: "pass",
          type: "basic",
        },
      } as Partial<CICSSession> as CICSSession;

      const mockResourceContext = {
        profile: profile,
        regionName: "NONEXISTENT",
        cicsplexName: undefined as string | undefined,
        session: mockSession,
      };

      const mockResource = {
        meta: ProgramMeta,
        resource: { attributes: prog },
      };

      const result = findResourceNodeInTree(mockCicsTree, mockResourceContext, mockResource);
      expect(result).toBeUndefined();
    });

    it("should return undefined when region node has no children", () => {
      const mockRegionNode = {
        children: [],
      } as Partial<CICSRegionTree> as CICSRegionTree;

      const mockSessionNode = {
        children: [] as (CICSPlexTree | CICSRegionTree)[],
        getRegionNodeFromName: jest.fn().mockReturnValue(mockRegionNode),
      } as Partial<CICSSessionTree> as CICSSessionTree;

      const mockCicsTree = {
        getSessionNodeForProfile: jest.fn().mockReturnValue(mockSessionNode),
      } as Partial<CICSTree> as CICSTree;

      const mockSession = {
        ISession: {
          hostname: "test",
          port: 1234,
          user: "user",
          password: "pass",
          type: "basic",
        },
      } as Partial<CICSSession> as CICSSession;

      const mockResourceContext = {
        profile: profile,
        regionName: "REG",
        cicsplexName: undefined as string | undefined,
        session: mockSession,
      };

      const mockResource = {
        meta: ProgramMeta,
        resource: { attributes: prog },
      };

      const result = findResourceNodeInTree(mockCicsTree, mockResourceContext, mockResource);
      expect(result).toBeUndefined();
    });

    it("should return undefined when parent node is not found", () => {
      const mockRegionNode = {
        children: [],
        getContainerNodeForResourceType: jest.fn().mockReturnValue(undefined),
      } as Partial<CICSRegionTree> as CICSRegionTree;

      const mockSessionNode = {
        children: [] as (CICSPlexTree | CICSRegionTree)[],
        getRegionNodeFromName: jest.fn().mockReturnValue(mockRegionNode),
      } as Partial<CICSSessionTree> as CICSSessionTree;

      const mockCicsTree = {
        getSessionNodeForProfile: jest.fn().mockReturnValue(mockSessionNode),
      } as Partial<CICSTree> as CICSTree;

      const mockSession = {
        ISession: {
          hostname: "test",
          port: 1234,
          user: "user",
          password: "pass",
          type: "basic",
        },
      } as Partial<CICSSession> as CICSSession;

      const mockResourceContext = {
        profile: profile,
        regionName: "REG",
        cicsplexName: undefined as string | undefined,
        session: mockSession,
      };

      const mockResource = {
        meta: ProgramMeta,
        resource: { attributes: prog },
      };

      const result = findResourceNodeInTree(mockCicsTree, mockResourceContext, mockResource);
      expect(result).toBeUndefined();
    });

    it("should return undefined when parent node has no children", () => {
      const mockParentNode = {
        children: [],
      } as Partial<CICSResourceContainerNode<IProgram>> as CICSResourceContainerNode<IProgram>;

      const mockRegionNode = {
        children: [],
        getContainerNodeForResourceType: jest.fn().mockReturnValue(mockParentNode),
      } as Partial<CICSRegionTree> as CICSRegionTree;

      const mockSessionNode = {
        children: [] as (CICSPlexTree | CICSRegionTree)[],
        getRegionNodeFromName: jest.fn().mockReturnValue(mockRegionNode),
      } as Partial<CICSSessionTree> as CICSSessionTree;

      const mockCicsTree = {
        getSessionNodeForProfile: jest.fn().mockReturnValue(mockSessionNode),
      } as Partial<CICSTree> as CICSTree;

      const mockSession = {
        ISession: {
          hostname: "test",
          port: 1234,
          user: "user",
          password: "pass",
          type: "basic",
        },
      } as Partial<CICSSession> as CICSSession;

      const mockResourceContext = {
        profile: profile,
        regionName: "REG",
        cicsplexName: undefined as string | undefined,
        session: mockSession,
      };

      const mockResource = {
        meta: ProgramMeta,
        resource: { attributes: prog },
      };

      const result = findResourceNodeInTree(mockCicsTree, mockResourceContext, mockResource);
      expect(result).toBeUndefined();
    });

    it("should return the resource node when found", () => {
      const mockResourceNode = {
        label: "APROG",
      } as Partial<CICSResourceContainerNode<IProgram>> as CICSResourceContainerNode<IProgram>;

      const mockParentNode = {
        children: [mockResourceNode],
        getChildNodeMatchingResourceName: jest.fn().mockReturnValue(mockResourceNode),
      } as Partial<CICSResourceContainerNode<IProgram>> as CICSResourceContainerNode<IProgram>;

      const mockRegionNode = {
        children: [mockParentNode] as CICSResourceContainerNode<IProgram>[],
        getContainerNodeForResourceType: jest.fn().mockReturnValue(mockParentNode),
      } as Partial<CICSRegionTree> as CICSRegionTree;

      const mockSessionNode = {
        children: [mockRegionNode] as (CICSPlexTree | CICSRegionTree)[],
        getRegionNodeFromName: jest.fn().mockReturnValue(mockRegionNode),
      } as Partial<CICSSessionTree> as CICSSessionTree;

      const mockCicsTree = {
        getSessionNodeForProfile: jest.fn().mockReturnValue(mockSessionNode),
      } as Partial<CICSTree> as CICSTree;

      const mockSession = {
        ISession: {
          hostname: "test",
          port: 1234,
          user: "user",
          password: "pass",
          type: "basic",
        },
      } as Partial<CICSSession> as CICSSession;

      const mockResourceContext = {
        profile: profile,
        regionName: "REG",
        cicsplexName: undefined as string | undefined,
        session: mockSession,
      };

      const mockResource = {
        meta: ProgramMeta,
        resource: { attributes: prog },
      };

      const result = findResourceNodeInTree(mockCicsTree, mockResourceContext, mockResource);
      expect(result).toBe(mockResourceNode);
      expect(mockParentNode.getChildNodeMatchingResourceName).toHaveBeenCalledWith(mockResource);
    });
  });
});



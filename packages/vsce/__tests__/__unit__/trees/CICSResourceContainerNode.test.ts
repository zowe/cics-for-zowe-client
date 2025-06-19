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

const prog1 = { program: "PROG1", status: "ENABLED", newcopycnt: "0", eyu_cicsname: "MYREG" };
const prog2 = { program: "PROG2", status: "DISABLED", newcopycnt: "2", eyu_cicsname: "MYREG" };

jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {},
}));

const runGetCacheMock = jest.fn();

jest.mock("@zowe/cics-for-zowe-sdk", () => ({
  ...jest.requireActual("@zowe/cics-for-zowe-sdk"),
  getCache: runGetCacheMock,
}));

const infoMessageMock = jest.fn();

jest.mock("@zowe/zowe-explorer-api", () => ({
  ...jest.requireActual("@zowe/zowe-explorer-api"),
  Gui: {
    infoMessage: infoMessageMock,
  },
}));

const runGetResourceMock = jest.fn();

jest.mock("../../../src/utils/resourceUtils", () => ({
  runGetResource: runGetResourceMock,
}));

import { ILibrary, IProgram, ITask, LibraryMeta, ProgramMeta, TaskMeta } from "../../../src/doc";
import { CICSSession, Resource, ResourceContainer } from "../../../src/resources";
import { CICSRegionTree, CICSResourceContainerNode, CICSSessionTree, CICSTree, TextTreeItem, ViewMore } from "../../../src/trees";
import { CICSProfileMock } from "../../__utils__/globalMocks";

describe("CICSResourceContainerNode tests", () => {
  let containerNode: CICSResourceContainerNode<IProgram>;
  let cicsSession: CICSSession;

  let sessionTree: CICSSessionTree;
  let regionTree: CICSRegionTree;
  let resourceContainer: ResourceContainer<IProgram>;

  beforeEach(() => {
    cicsSession = new CICSSession({ ...CICSProfileMock, hostname: "MY.HOST" });

    sessionTree = new CICSSessionTree({ name: "MYPROF", profile: CICSProfileMock }, {
      _onDidChangeTreeData: { fire: () => jest.fn() },
    } as unknown as CICSTree);
    regionTree = new CICSRegionTree("REG", {}, sessionTree, undefined, sessionTree);
    resourceContainer = new ResourceContainer(ProgramMeta);

    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "",
        regionName: "REG",
        parentNode: regionTree,
        session: cicsSession,
      },
      undefined,
      {
        meta: ProgramMeta,
        resources: resourceContainer,
      }
    );

    jest.clearAllMocks();

    runGetCacheMock.mockResolvedValue({
      response: {
        resultsummary: {
          recordcount: "2",
        },
        records: {
          cicsprogram: [prog1, prog2],
        },
      },
    });

    runGetResourceMock.mockResolvedValue({
      response: {
        resultsummary: {
          api_response1: "1024",
          cachetoken: "MYCACHETOKEN",
        },
      },
    });
  });

  it("should create ResourceContainerNode correctly", () => {
    expect(containerNode.description).toBeUndefined();
    expect(containerNode.getContainedResource()).toBeUndefined();
    expect(containerNode.getChildResource()).toBeDefined();
    expect(containerNode.getChildResource().meta).toEqual(ProgramMeta);
  });

  it("should build context values", () => {
    expect(containerNode.contextValue).toEqual("CICSResourceNode.Programs.FILTERABLE");
  });

  it("should build context values with contained resources", () => {
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "",
        regionName: "REG",
        parentNode: regionTree,
        session: cicsSession,
      },
      {
        meta: ProgramMeta,
        resource: new Resource({
          eyu_cicsname: "REG",
          newcopycnt: "0",
          program: "MYPROG",
          status: "ENABLED",
          progtype: "COBOL",
          enablestatus: "ENABLED",
          library: "MYLIB",
          librarydsn: "MYLIBDSN",
        }),
      },
      {
        meta: ProgramMeta,
        resources: resourceContainer,
      }
    );

    expect(containerNode.contextValue).toEqual("CICSResourceNode.CICSProgram.ENABLED.MYPROG.FILTERABLE");
  });

  it("should build context values with contained resources and filtered", () => {
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "",
        regionName: "REG",
        parentNode: regionTree,
        session: cicsSession,
      },
      {
        meta: ProgramMeta,
        resource: new Resource({
          eyu_cicsname: "REG",
          newcopycnt: "0",
          program: "MYPROG",
          status: "DISABLED",
          progtype: "COBOL",
          enablestatus: "ENABLED",
          library: "MYLIB",
          librarydsn: "MYLIBDSN",
        }),
      },
      {
        meta: ProgramMeta,
        resources: resourceContainer,
      }
    );

    containerNode.setFilter(["a", "b"]);
    expect(containerNode.contextValue).toEqual("CICSResourceNode.CICSProgram.DISABLED.MYPROG.FILTERABLE.FILTERED");
  });

  it("should load paginated resources", async () => {
    expect(containerNode.children.length).toEqual(0);

    await containerNode.loadPageOfResources();

    expect(containerNode.children.length).toEqual(2);
    expect(containerNode.children[0]).toBeInstanceOf(CICSResourceContainerNode);
    expect(containerNode.children[1]).toBeInstanceOf(CICSResourceContainerNode);
  });

  it("should inform user of no resources", async () => {
    runGetResourceMock.mockResolvedValue({
      response: {
        resultsummary: {
          api_response1: "1027",
        },
      },
    });

    expect(containerNode.children.length).toEqual(0);

    await containerNode.loadPageOfResources();

    expect(infoMessageMock).toHaveBeenCalledTimes(1);
    expect(infoMessageMock).toHaveBeenCalledWith("No resources found");
    expect(containerNode.children.length).toEqual(0);
  });

  it("should set child resources to null if no child type", async () => {
    runGetCacheMock.mockResolvedValue({
      response: {
        resultsummary: {
          recordcount: "2",
        },
        records: {
          cicstask: [
            { task: "T1", tranid: "TRAN", runstatus: "ACTIVE" },
            { task: "T2", tranid: "TRAN", runstatus: "ACTIVE" },
          ],
        },
      },
    });

    // const initialContainerNode = new CICSResourceContainerNode<ITask>(
    //   "Tasks",
    //   {
    //     profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
    //     cicsplexName: "",
    //     regionName: "REG",
    //     parentNode: regionTree,
    //     session: cicsSession
    //   },
    //   undefined,
    //   undefined
    // );

    // expect(initialContainerNode.children.length).toEqual(0);
    // await initialContainerNode.getChildren();
    // expect(initialContainerNode.children.length).toEqual(0);

    let newContainerNode = new CICSResourceContainerNode<ITask>(
      "Tasks",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "",
        regionName: "REG",
        parentNode: regionTree,
        session: cicsSession,
      },
      undefined,
      {
        meta: TaskMeta,
        resources: new ResourceContainer(TaskMeta),
      }
    );
    expect(newContainerNode.children.length).toEqual(0);
    await newContainerNode.loadPageOfResources();
    expect(newContainerNode.children.length).toEqual(2);
    // @ts-ignore - unknown type
    expect(newContainerNode.children[0].childResource.resources).toBeNull();

    runGetCacheMock.mockResolvedValue({
      response: {
        resultsummary: {
          recordcount: "2",
        },
        records: {
          cicslibrary: [
            { dsname: "MY.DSN", name: "LIB1" },
            { dsname: "MY.DSN.2", name: "LIB2" },
          ],
        },
      },
    });

    const libContainerNode = new CICSResourceContainerNode<ILibrary>(
      "Libraries",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "",
        regionName: "REG",
        parentNode: regionTree,
        session: cicsSession,
      },
      undefined,
      {
        meta: LibraryMeta,
        resources: new ResourceContainer(LibraryMeta),
      }
    );
    expect(libContainerNode.children.length).toEqual(0);
    await libContainerNode.loadPageOfResources();
    expect(libContainerNode.children.length).toEqual(2);
    // @ts-ignore - unknown type
    expect(libContainerNode.children[0].childResource.resources).toBeDefined();
    // @ts-ignore - unknown type
    expect(libContainerNode.children[0].childResource.resources).toBeInstanceOf(ResourceContainer);
  });

  it("should have viewmore item if more to fetch", async () => {
    runGetCacheMock.mockResolvedValue({
      response: {
        resultsummary: {
          recordcount: "102",
          displayed_recordcount: "100",
        },
        records: {
          cicsprogram: [prog1, prog2, prog1, prog2, prog1, prog2, prog1, prog2, prog1, prog2],
        },
      },
    });

    expect(containerNode.children.length).toEqual(0);

    await containerNode.loadPageOfResources();

    expect(containerNode.children.length).toEqual(11);
    expect(containerNode.children[0]).toBeInstanceOf(CICSResourceContainerNode);
    expect(containerNode.children[10]).toBeInstanceOf(ViewMore);
  });

  it("should get children", async () => {
    expect(containerNode.children.length).toEqual(0);

    await containerNode.getChildren();

    expect(containerNode.children.length).toEqual(2);
    expect(containerNode.children[0]).toBeInstanceOf(CICSResourceContainerNode);
    expect(containerNode.children[1]).toBeInstanceOf(CICSResourceContainerNode);
  });

  it("should get children with no child resource", async () => {
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "",
        regionName: "REG",
        parentNode: regionTree,
        session: cicsSession,
      },
      undefined,
      undefined
    );

    expect(containerNode.children.length).toEqual(0);

    const children = await containerNode.getChildren();

    expect(containerNode.children.length).toEqual(0);
    expect(children).toBeNull();
    expect(containerNode.viewMore).toBeFalsy();
  });

  it("should get children with viewmore as true", async () => {
    expect(containerNode.children.length).toEqual(0);

    const initialChildren = await containerNode.getChildren();

    expect(containerNode.children.length).toEqual(2);
    expect(containerNode.viewMore).toBeFalsy();

    containerNode.viewMore = true;
    const children = await containerNode.getChildren();
    expect(containerNode.viewMore).toBeFalsy();
    expect(children.length).toEqual(2);
    expect(children).toEqual(initialChildren);
  });

  it("should get children with no regionName", async () => {
    containerNode.regionName = undefined;

    expect(containerNode.children.length).toEqual(0);

    const children = await containerNode.getChildren();

    expect(containerNode.children.length).toEqual(1);
    expect(containerNode.viewMore).toBeFalsy();
    expect(children[0]).toBeInstanceOf(TextTreeItem);
  });

  it("should get session for this node", async () => {
    const session = containerNode.getSession();
    expect(session).toBeInstanceOf(CICSSession);
    expect(session).toEqual(cicsSession);
  });

  it("should get sessionNode for this node", async () => {
    const session = containerNode.getSessionNode();
    expect(session).toBeInstanceOf(CICSSessionTree);
    expect(session).toEqual(sessionTree);
  });

  it("should clear filter", async () => {
    expect(containerNode.getChildResource().resources.isFilterApplied()).toBeFalsy();
    containerNode.setFilter(["a"]);
    expect(containerNode.getChildResource().resources.isFilterApplied()).toBeTruthy();
    await containerNode.clearFilter();
    expect(containerNode.getChildResource().resources.isFilterApplied()).toBeFalsy();
  });

  it("should add region name to description if not set", async () => {
    expect(containerNode.description).toBeUndefined();
    expect(containerNode.children.length).toEqual(0);
    await containerNode.getChildren();
    expect(containerNode.children.length).toEqual(2);
    expect(containerNode.children[0].description).toBeNull();

    containerNode.regionName = undefined;
    await containerNode.loadPageOfResources();
    expect(containerNode.children.length).toEqual(2);
    expect(containerNode.children[0].description).toEqual("(MYREG)");
  });

  it("should add FILTERED", async () => {
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "",
        regionName: "REG",
        parentNode: regionTree,
        session: cicsSession,
      },
      undefined,
      undefined
    );

    expect(containerNode.contextValue).toEqual("CICSResourceNode.Programs");

    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "",
        regionName: "REG",
        parentNode: regionTree,
        session: cicsSession,
      },
      undefined,
      // @ts-ignore - missing resources
      { meta: ProgramMeta }
    );

    expect(containerNode.contextValue).toEqual("CICSResourceNode.Programs.FILTERABLE");

    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "",
        regionName: "REG",
        parentNode: regionTree,
        session: cicsSession,
      },
      undefined,
      {
        meta: ProgramMeta,
        resources: resourceContainer,
      }
    );

    expect(containerNode.contextValue).toEqual("CICSResourceNode.Programs.FILTERABLE");

    resourceContainer.setCriteria(["a", "b"]);
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "",
        regionName: "REG",
        parentNode: regionTree,
        session: cicsSession,
      },
      undefined,
      {
        meta: ProgramMeta,
        resources: resourceContainer,
      }
    );

    expect(containerNode.contextValue).toEqual("CICSResourceNode.Programs.FILTERABLE.FILTERED");
  });
});

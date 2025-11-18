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

jest.mock("../../../src/utils/CICSLogger");
jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {
    getProfilesCache: () => {
      return {
        loadNamedProfile: jest.fn(),
      };
    },
  },
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
  ...jest.requireActual("../../../src/utils/resourceUtils"),
  runGetResource: runGetResourceMock,
}));

import { ProgramMeta } from "../../../src/doc";
import { Resource, ResourceContainer } from "../../../src/resources";
import { CICSPlexTree, CICSRegionTree, CICSResourceContainerNode, CICSSessionTree, CICSTree, TextTreeItem, ViewMore } from "../../../src/trees";
import { CICSProfileMock } from "../../__utils__/globalMocks";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import { IProgram } from "@zowe/cics-for-zowe-explorer-api";

const currRes = new Resource<IProgram>({
  eyu_cicsname: "REG",
  newcopycnt: "0",
  program: "MYPROG",
  status: "DISABLED",
  progtype: "COBOL",
  library: "MYLIB",
  librarydsn: "MYLIBDSN",
  usecount:"0",
  language:"COBOL"
});

describe("CICSResourceContainerNode tests", () => {
  let containerNode: CICSResourceContainerNode<IProgram>;

  let sessionTree: CICSSessionTree;
  let regionTree: CICSRegionTree;
  let resourceContainer: ResourceContainer;

  beforeEach(() => {

    const cicsTree = { _onDidChangeTreeData: { fire: () => jest.fn() }, refresh: () => { } } as unknown as CICSTree;
    sessionTree = new CICSSessionTree({ profile: CICSProfileMock, failNotFound: false, message: "", type: "cics", name: "MYPROF" }, cicsTree);
    regionTree = new CICSRegionTree("REG", {}, sessionTree, undefined, sessionTree);
    resourceContainer = new ResourceContainer([ProgramMeta], { profileName: "MYPROF", regionName: "REG" });

    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        regionName: "REG",
        parentNode: regionTree,
      },
      undefined,
      [ProgramMeta]
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
          recordcount: "2",
        },
      },
    });
  });

  it("should create ResourceContainerNode correctly", () => {
    expect(containerNode.description).toBeUndefined();
    expect(containerNode.getContainedResource()).toBeUndefined();
    expect(containerNode.getFetcher()).toBeDefined();
    expect(containerNode.getFetcher()?.isCriteriaApplied()).toBeFalsy();
  });

  it("should build context values", () => {
    expect(containerNode.contextValue).toEqual("CICSResourceNode.Programs.FILTERABLE");
  });

  it("should build context values with contained resources", () => {
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        regionName: "REG",
        parentNode: regionTree,
      },
      {
        meta: ProgramMeta,
        resource: new Resource<IProgram>({
          eyu_cicsname: "REG",
          newcopycnt: "0",
          program: "MYPROG",
          status: "ENABLED",
          progtype: "COBOL",
          library: "MYLIB",
          librarydsn: "MYLIBDSN",
          usecount:"0",
          language:"COBOL"
        }),
      },
      [ProgramMeta]
    );

    expect(containerNode.contextValue).toEqual("CICSResourceNode.CICSProgram.ENABLED.MYPROG.FILTERABLE");
  });

  it("should build context values with contained resources and filtered", () => {
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        regionName: "REG",
        parentNode: regionTree,
      },
      {
        meta: ProgramMeta,
        resource: new Resource<IProgram>({
          eyu_cicsname: "REG",
          newcopycnt: "0",
          program: "MYPROG",
          status: "DISABLED",
          progtype: "COBOL",
          library: "MYLIB",
          librarydsn: "MYLIBDSN",
          usecount:"0",
          language:"COBOL"
        }),
      },
      [ProgramMeta]
    );

    containerNode.setCriteria(["a", "b"]);
    expect(containerNode.contextValue).toEqual("CICSResourceNode.CICSProgram.DISABLED.MYPROG.FILTERABLE.FILTERED");
  });

  it("should set contained resource", () => {
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        regionName: "REG",
        parentNode: regionTree,
      },
      {
        meta: ProgramMeta,
        resource: currRes,
      },
      [ProgramMeta]
    );


    const newRes = new Resource({ ...prog1, library: "", librarydsn: "", progtype: "", enablestatus: "ENABLED", usecount:"0", language:"COBOL"});

    expect(containerNode.getContainedResource()).toEqual({ meta: ProgramMeta, resource: currRes });
    containerNode.setContainedResource(newRes);
    expect(containerNode.getContainedResource()).toBeDefined();
    expect(containerNode.getContainedResource()).toEqual({ meta: ProgramMeta, resource: newRes });
  });

  it("should load paginated resources", async () => {

    const fetcherSpy = jest.spyOn(ResourceContainer.prototype, "fetchNextPage");
    const ensureSumSpy = jest.spyOn(ResourceContainer.prototype, "ensureSummaries");

    await containerNode.fetchNextPage();

    expect(fetcherSpy).toHaveBeenCalledTimes(1);
    expect(ensureSumSpy).toHaveBeenCalledTimes(1);
  });

  it("should get children", async () => {
    const fetcherSpy = jest.spyOn(ResourceContainer.prototype, "fetchNextPage");
    const ensureSumSpy = jest.spyOn(ResourceContainer.prototype, "ensureSummaries");

    const children = await containerNode.getChildren();

    expect(fetcherSpy).toHaveBeenCalledTimes(1);
    expect(ensureSumSpy).toHaveBeenCalledTimes(1);
    expect(children).toHaveLength(2);
  });

  it("should update a stored item", async () => {
    const fetcherSpy = jest.spyOn(ResourceContainer.prototype, "fetchNextPage");
    const ensureSumSpy = jest.spyOn(ResourceContainer.prototype, "ensureSummaries");

    const children = await containerNode.getChildren();

    expect(fetcherSpy).toHaveBeenCalledTimes(1);
    expect(ensureSumSpy).toHaveBeenCalledTimes(1);
    expect(children).toHaveLength(2);

    const newRes = new Resource({ ...prog1, library: "", librarydsn: "", progtype: "", enablestatus: "ENABLED", newcopycnt: "700", usecount:"0", language:"COBOL" });

    containerNode.updateStoredItem({
      meta: ProgramMeta,
      resource: newRes,
    });

    await containerNode.getChildren();
    const updatedChildren = await containerNode.getChildren();
    expect(updatedChildren.map((c) => (c as unknown as CICSResourceContainerNode<IProgram>).getContainedResource().resource.attributes.newcopycnt).includes("700")).toBeTruthy();
  });

  it("should have viewmore item if more to fetch", async () => {

    jest.spyOn(PersistentStorage, "getNumberOfResourcesToFetch").mockReturnValue(5);
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        regionName: "REG",
        parentNode: regionTree,
      },
      undefined,
      [ProgramMeta]
    );

    runGetResourceMock.mockResolvedValue({
      response: {
        resultsummary: {
          api_response1: "1024",
          cachetoken: "MYCACHETOKEN",
          recordcount: "10",
        },
      },
    });

    runGetCacheMock.mockResolvedValue({
      response: {
        resultsummary: {
          recordcount: "10",
          displayed_recordcount: "5",
        },
        records: {
          cicsprogram: [prog1, prog2, prog1, prog2, prog1],
        },
      },
    });

    expect(containerNode.children.length).toEqual(0);

    await containerNode.getChildren();

    expect(containerNode.children.length).toEqual(6);
    expect(containerNode.children[0]).toBeInstanceOf(CICSResourceContainerNode);
    expect(containerNode.children[5]).toBeInstanceOf(ViewMore);

    expect(containerNode.hasMore()).toBeTruthy();
  });

  it("should get children with no child resource", async () => {
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        regionName: "REG",
        parentNode: regionTree,
      },
      undefined,
      undefined
    );

    expect(containerNode.children.length).toEqual(0);

    const children = await containerNode.getChildren();

    expect(containerNode.children.length).toEqual(0);
    expect(children).toHaveLength(0);
  });

  it("should get children with no regionName", async () => {
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "MYPLEX",
        regionName: undefined,
        parentNode: new CICSPlexTree("PLX", { ...CICSProfileMock, message: "", type: "cics", failNotFound: false }, sessionTree),
      },
      undefined,
      [ProgramMeta]
    );

    expect(containerNode.children.length).toEqual(0);

    const children = await containerNode.getChildren();

    expect(containerNode.children.length).toEqual(1);
    expect(containerNode.hasMore()).toBeFalsy();
    expect(children[0]).toBeInstanceOf(TextTreeItem);
  });

  it("should get sessionNode for this node", async () => {
    const session = containerNode.getSessionNode();
    expect(session).toBeInstanceOf(CICSSessionTree);
    expect(session).toEqual(sessionTree);
  });

  it("should set filter", async () => {
    expect(containerNode.getFetcher()?.isCriteriaApplied()).toBeFalsy();
    containerNode.setCriteria(["a"]);
    expect(containerNode.getFetcher()?.isCriteriaApplied()).toBeTruthy();
  });

  it("should clear filter", async () => {
    expect(containerNode.getFetcher()?.isCriteriaApplied()).toBeFalsy();
    containerNode.setCriteria(["a"]);
    expect(containerNode.getFetcher()?.isCriteriaApplied()).toBeTruthy();
    containerNode.clearCriteria();
    expect(containerNode.getFetcher()?.isCriteriaApplied()).toBeFalsy();
  });

  it("should keep default description", async () => {
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "MYPLEX",
        regionName: "MYREG",
        parentNode: new CICSPlexTree("PLX", { ...CICSProfileMock, message: "", type: "cics", failNotFound: false }, sessionTree),
      },
      undefined,
      [ProgramMeta],
      "MY DEFAULT DESC"
    );

    expect(containerNode.defaultDescription).toEqual("MY DEFAULT DESC");
    expect(containerNode.description).toEqual("MY DEFAULT DESC");

    await containerNode.getChildren();

    expect(containerNode.description).toEqual("MY DEFAULT DESC [2 of 2]");
  });

  it("should keep default description with criteria", async () => {
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "MYPLEX",
        regionName: "MYREG",
        parentNode: new CICSPlexTree("PLX", { ...CICSProfileMock, message: "", type: "cics", failNotFound: false }, sessionTree),
      },
      undefined,
      [ProgramMeta],
      "MY DEFAULT DESC"
    );

    expect(containerNode.defaultDescription).toEqual("MY DEFAULT DESC");
    expect(containerNode.description).toEqual("MY DEFAULT DESC");

    containerNode.setCriteria(["a"]);

    await containerNode.getChildren();

    expect(containerNode.description).toEqual("MY DEFAULT DESC PROGRAM=a [2 of 2]");
  });

  it("should return empty list when no fetcher", async () => {
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "MYPLEX",
        regionName: "MYREG",
        parentNode: new CICSPlexTree("PLX", { ...CICSProfileMock, message: "", type: "cics", failNotFound: false }, sessionTree),
      },
      undefined,
      [],
    );

    const fetched = await containerNode.getChildren();

    expect(fetched).toHaveLength(0);
  });

  it("should return nothing when nothing to fetch", async () => {
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "MYPLEX",
        regionName: "MYREG",
        parentNode: new CICSPlexTree("PLX", { ...CICSProfileMock, message: "", type: "cics", failNotFound: false }, sessionTree),
      },
      undefined,
      [],
    );

    const fetchPageSpy = jest.spyOn(ResourceContainer.prototype, "fetchNextPage");
    await containerNode.fetchNextPage();
    expect(containerNode.hasMore()).toBeFalsy();
    expect(fetchPageSpy).not.toHaveBeenCalled();

    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "MYPLEX",
        regionName: "MYREG",
        parentNode: new CICSPlexTree("PLX", { ...CICSProfileMock, message: "", type: "cics", failNotFound: false }, sessionTree),
      },
      undefined,
      [ProgramMeta],
    );

    await containerNode.fetchNextPage();
    expect(fetchPageSpy).toHaveBeenCalled();
  });

  it("should reset fetcher", async () => {
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "MYPLEX",
        regionName: "MYREG",
        parentNode: new CICSPlexTree("PLX", { ...CICSProfileMock, message: "", type: "cics", failNotFound: false }, sessionTree),
      },
      undefined,
      [ProgramMeta],
    );

    const fetched = await containerNode.getChildren();
    expect(fetched).toHaveLength(2);

    const resetSpy = jest.spyOn(ResourceContainer.prototype, "reset");
    containerNode.reset();

    expect(resetSpy).toHaveBeenCalled();
  });

  it("should include region in label", async () => {
    containerNode = new CICSResourceContainerNode(
      "Programs",
      {
        profile: { name: "MYPROF", profile: CICSProfileMock, message: "", type: "cics", failNotFound: false },
        cicsplexName: "MYPLEX",
        parentNode: new CICSPlexTree("PLX", { ...CICSProfileMock, message: "", type: "cics", failNotFound: false }, sessionTree),
      },
      undefined,
      [ProgramMeta],
    );

    containerNode.setCriteria(["a"]);

    const fetched = await containerNode.getChildren();
    expect(fetched).toHaveLength(2);
    expect(fetched.map((c) => c.description)).toEqual(["(MYREG)", "(MYREG)"]);
  });
});

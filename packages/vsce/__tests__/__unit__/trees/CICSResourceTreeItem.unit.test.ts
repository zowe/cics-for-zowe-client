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

import { IProgram, IRegion } from "@zowe/cics-for-zowe-sdk";
import { ProgramMeta } from "../../../src/doc";
import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSResourceTree } from "../../../src/trees/CICSResourceTree";
import { CICSResourceTreeItem } from "../../../src/trees/treeItems/CICSResourceTreeItem";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";

const profileMock = {
  name: "MYPROF",
  profile: {
    host: "abc.com",
    port: 12345
  }
};

const programMock: IProgram = {
  program: "MYPROG",
  eyu_cicsname: "MYREG",
  status: "ENABLED",
  newcopycnt: "2"
};

const regionMock: IRegion = {
  applid: "MYREG",
  cicsname: "MYREG",
  cicsstate: "ACTIVE",
  cicsstatus: "ACTIVE",
  eyu_cicsname: "MYREG"
};

const cicsSessionTreeMock = new CICSSessionTree(profileMock);
const cicsRegionTreeMock: CICSRegionTree = new CICSRegionTree(regionMock, cicsSessionTreeMock, undefined, cicsSessionTreeMock);
const resourceTreeMock: CICSResourceTree<IProgram> = new CICSResourceTree<IProgram>(ProgramMeta, cicsRegionTreeMock);


describe("CICSResourceTreeItem", () => {
  let treeItem: CICSResourceTreeItem<IProgram>;

  beforeEach(() => {
    resourceTreeMock.children = [];
    treeItem = new CICSResourceTreeItem<IProgram>(programMock, ProgramMeta, cicsRegionTreeMock, resourceTreeMock);
    resourceTreeMock.addResource(treeItem);
    // expect(getFolderIconMock).toHaveBeenCalledWith(false);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should have the correct label", () => {
    expect(treeItem.label).toEqual("MYPROG (New copy count: 2)");
  });

  it("should be able to update label", () => {
    treeItem.setLabel("UPDATED LABEL CONTENT");
    expect(treeItem.label).toEqual("UPDATED LABEL CONTENT");
  });

  it("should return parent tree", () => {
    expect(treeItem.getParent()).toEqual(resourceTreeMock);
  });
});

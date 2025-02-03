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

const getFolderIconMock = jest.fn();

import { CICSRegionTree } from "../../../src/trees/CICSRegionTree";
import { CICSWebTree } from "../../../src/trees/CICSWebTree";
import * as globalMocks from "../../__utils__/globalMocks";

jest.mock("../../../src/trees/treeItems/web/CICSTCPIPServiceTree");
jest.mock("../../../src/trees/treeItems/web/CICSURIMapTree");
jest.mock("../../../src/trees/treeItems/web/CICSPipelineTree");
jest.mock("../../../src/trees/treeItems/web/CICSWebServiceTree");

jest.mock("../../../src/utils/iconUtils", () => {
  return { getFolderIcon: getFolderIconMock };
});

const treeResourceMock = globalMocks.getDummyTreeResources("cicsregion", "");

describe("Test suite for CICSRegionTree", () => {
  let sut: CICSWebTree;

  beforeEach(() => {
    getFolderIconMock.mockReturnValue(treeResourceMock.iconPath);
    sut = new CICSWebTree(globalMocks.cicsRegionTreeMock as any as CICSRegionTree);
    expect(getFolderIconMock).toHaveBeenCalledWith(false);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("Should load content", () => {
    sut.loadContents();

    expect(getFolderIconMock).toHaveBeenCalledWith(true);
  });

  it("Should return return all cics tree in children array", () => {
    const result = sut.getChildren();
    expect(result?.length).toBeGreaterThanOrEqual(4);
  });

  it("Should return parent", () => {
    expect(sut.getParent()).toBe(globalMocks.cicsRegionTreeMock);
  });
});

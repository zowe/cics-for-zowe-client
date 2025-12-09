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

import { IProfileLoaded } from "@zowe/imperative";
import { ProgramMeta } from "../../../src/doc";
import { CICSRegionTree, CICSResourceContainerNode, TextTreeItem, ViewMore } from "../../../src/trees";
import PersistentStorage from "../../../src/utils/PersistentStorage";

jest.spyOn(PersistentStorage, "getCriteria").mockReturnValue(undefined);

describe("ViewMore Tree item", () => {
  it("should create viewmore tree item", () => {
    const resourceNode = new CICSResourceContainerNode("Programs", { parentNode: {} as CICSRegionTree, profile: {} as IProfileLoaded }, undefined, [
      ProgramMeta,
    ]);
    const itm = new ViewMore(resourceNode);

    expect(itm.command).toBeDefined();
    expect(itm.label).toEqual("View more...");
    expect(itm.parent).toEqual(resourceNode);
  });
});

describe("Text Tree item", () => {
  it("should create text tree item", () => {
    const itm = new TextTreeItem("A TEXT TREE ITEM", "Text.Context");

    expect(itm.label).toEqual("A TEXT TREE ITEM");
    expect(itm.contextValue).toEqual("Text.Context");
  });
});

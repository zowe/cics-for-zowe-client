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

import { assert, expect } from "chai";
import * as path from "path";
import { ActivityBar, DefaultTreeSection, InputBox, QuickPickItem, VSBrowser } from "vscode-extension-tester";
// import { sleep } from "./e2e_globalMocks";

describe("AT TIME", () => {
  let cicsTree: DefaultTreeSection;
  let quickPick: InputBox;

  before(async () => {
    await VSBrowser.instance.openResources(path.join("__tests__", "__e2e__", "resources", "test", "config-files"));
    (await new ActivityBar().getViewControl("Explorer"))?.openView();

    const zoweExplorer = await new ActivityBar().getViewControl("Zowe Explorer");
    assert(zoweExplorer !== undefined);
    const view = await zoweExplorer.openView();
    cicsTree = await view.getContent().getSection("cics");
    await cicsTree.click();

    const dsTree = await view.getContent().getSection("Data Sets");
    await dsTree.collapse();
    await cicsTree.click();

    const ussTree = await view.getContent().getSection("Unix System Services (USS)");
    await ussTree.collapse();
    await cicsTree.click();

    const jobTree = await view.getContent().getSection("Jobs");
    await jobTree.collapse();

  });

  beforeEach(async () => {
    await cicsTree.click();
  });

  after(async () => { });

  describe("Does things", () => {

    it("Should add profile to cics tree", async () => {

      const plusIcon = await cicsTree.getAction(`Create a CICS Profile`);
      assert(plusIcon !== undefined);
      await plusIcon.click();
      cicsTree.takeScreenshot();

      quickPick = await InputBox.create();
      let qpItems = await quickPick.getQuickPicks();
      cicsTree.takeScreenshot();

      // This required as array.filter can't handle async..??
      const result: QuickPickItem[] = [];
      for (const itm of qpItems) {
        if ((await itm.getLabel()).includes("cicsplex_local")) {
          result.push(itm);
        }
      }
      expect(result.length).equals(1);

      await quickPick.selectQuickPick(qpItems.indexOf(result[0]));
      cicsTree.takeScreenshot();
    });

    it("Should expand profile", async () => {

      const localProfile = await cicsTree.findItem("cicsplex_local");
      expect(localProfile).exist;

      // const visibleItems = await cicsTree.getVisibleItems();
      // visibleItems.forEach(async (itm) => {
      //   console.log((await itm.getLabel()));
      // });

      // const item = await cicsTree.findItem("cicsplex_local");
      // console.log(await item?.getLabel());

      // const children = await cicsTree.openItem("cicsplex_local");
      // children.forEach(async (itm) => {
      //   console.log((await itm.getLabel()));
      // });

      const plexChildren = await cicsTree.openItem("cicsplex_local", "CICSEX61");
      // plexChildren.forEach(async (itm) => {
      //   console.log((await itm.getLabel()));
      // });

      const regionChildren = await cicsTree.openItem("cicsplex_local", "CICSEX61", await plexChildren[0].getLabel());

      // const regionNames: string[] = [];
      // for (const regItem of regionChildren) {
      //   regionNames.push((await regItem.getLabel()).trim().toUpperCase());
      // }

      const regionNamesUnderPlex = await Promise.all(regionChildren.map((chld) => chld.getLabel()));
      await cicsTree.takeScreenshot();

      const expected = [
        "IYCWENK1",
        "IYCWENL1",
        "IYCWENM1",
        "IYCWENN1",
        "IYCWENTH",
        "IYCWENW1",
        "IYCWENW2"
      ];

      console.log(regionNamesUnderPlex);
      console.log(`${regionNamesUnderPlex}`);

      console.log(expected);
      console.log(`${expected}`);

      expect(regionNamesUnderPlex).to.have.members(expected);
    });
  });
});

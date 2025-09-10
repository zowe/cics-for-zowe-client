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

import { expect } from "chai";
import { DefaultTreeSection, TreeItem} from "vscode-extension-tester";
import { EYUCMCIJ, CICSEX61, IYCWENW2, REGIONS, WIREMOCK_PROFILE_NAME, JVMSERVERS, defaultHttpEndpoint } from "./util/constants";
import {
  findJVMServerTreeNodeByLabel,
  sleep,
} from "./util/globalMocks";
import {
  clickCollapseAllsIconInCicsTree,
  closeAllEditorsTabs,
  getCicsSection,
  getPlexChildIndex,
  getPlexChildren,
  setupCICSTreeSelectedResourceParams,
  openZoweExplorer,
} from "./util/initSetup.test";
import { resetAllScenarios } from "./util/resetScenarios";

describe("JVM Servers", () => {
  let cicsTree: DefaultTreeSection;
  let JVMServers: TreeItem[];
  let regionResources: TreeItem[];
  let regionIYCWENW2Index: number;
  let JVMServerResourceIndex: number;

  before(async () => {
    await sleep(1900);
    const view = await openZoweExplorer();
    cicsTree = await getCicsSection(view);

    const wiremockServer = await cicsTree.findItem(WIREMOCK_PROFILE_NAME);
    expect(wiremockServer).exist;
    await sleep(100);
  });

  after(async () => {
    await closeAllEditorsTabs();
    await clickCollapseAllsIconInCicsTree(cicsTree);
  });

  describe("Checking Children of CICSEX61", () => {
    let JVMServerNode: TreeItem | undefined;
    it("Verify CICSEX61 -> Regions", async () => {
      const cicsex61Children = await getPlexChildren(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61);
      expect(cicsex61Children).not.empty;

      const regionsIndex = await getPlexChildIndex(cicsex61Children, REGIONS);
      expect(regionsIndex).to.be.greaterThan(-1);
      cicsTree.takeScreenshot();
    });

    it("Verify CICSEX61 -> Regions -> IYCWENW2 -> JVMServers", async () => {
      ({
        selectedRegionIndex: regionIYCWENW2Index,
        selectedRegionResources: regionResources,
        selectedResourceIndex: JVMServerResourceIndex,
        selectedResource: JVMServers,
      } = await setupCICSTreeSelectedResourceParams(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61, IYCWENW2, JVMSERVERS));
      cicsTree.takeScreenshot();
    });
     it("Verify JVMSERVERS -> EYUCMCIJ", async () => {
       JVMServerNode = await findJVMServerTreeNodeByLabel(JVMServers, EYUCMCIJ);
       expect(JVMServerNode).not.undefined;
       expect(await JVMServerNode?.getLabel()).contains(EYUCMCIJ);
       cicsTree.takeScreenshot();
     });

    it("Verify JVMSERVERS -> EYUCMCIJ -> Endpoint", async () => {
        await resetAllScenarios();
        // Find the EYUCMCIJ JVM server node
        const EYUCMCIJNode = await findJVMServerTreeNodeByLabel(JVMServers, EYUCMCIJ);
        expect(EYUCMCIJNode).not.undefined;
        //Expand the EYUCMCIJ node to reveal its children
        await EYUCMCIJNode?.expand();
        await sleep(500);

        // Check if endpoint exists under EYUCMCIJ
        const children = await EYUCMCIJNode?.getChildren();
        const endpointNode = children?.find(async (child) => {
          const label = await child.getLabel();
          return label === defaultHttpEndpoint;
        });
        expect(endpointNode).not.undefined;

        cicsTree.takeScreenshot();
    }); 
}); 
});
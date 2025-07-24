import { expect } from "chai";
import { DefaultTreeSection, SideBarView, TreeItem } from "vscode-extension-tester";
import { WIREMOCK_PROFILE_NAME, CICSEX61, REGIONS, REGIONS_LOADED } from "./util/constants";
import {
  sleep,
} from "./util/globalMocks";
import {
  getCicsSection,
  getPlexChildIndex,
  getPlexChildren,
  getRegionIndex,
  getRegionResourceIndex,
  getRegionsInPlex,
  openZoweExplorer,
} from "./util/initSetup.test";
import { resetAllScenarios } from "./util/resetScenarios";

describe("Check if JVM server is in the tree", () => {
  let cicsTree: DefaultTreeSection;
  let regions: TreeItem[];
  let regionWithJVMServerIndex: number;

  before(async () => {
    await sleep(1900);
    const view = await openZoweExplorer();
    cicsTree = await getCicsSection(view);
    await sleep(1900);

    const wiremockServer = await cicsTree.findItem(WIREMOCK_PROFILE_NAME);
    expect(wiremockServer).exist;
    await sleep(100);
  });

  after(async () => {
    await resetAllScenarios();
  });

  describe("Checking Children of CICSEX61", () => {
    it("Verify CICSEX61 -> Regions", async () => {
      const cicsex61Children = await getPlexChildren(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61);
      expect(cicsex61Children).not.empty;

      const regionsIndex = await getPlexChildIndex(cicsex61Children, REGIONS);
      expect(regionsIndex).to.be.greaterThan(-1);
      cicsTree.takeScreenshot();
    });

    it("Verify CICSEX61 -> Regions -> IYCWENW2", async () => {
      regions = await getRegionsInPlex(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61);
      expect(regions).not.empty;

      regionWithJVMServerIndex = await getRegionIndex(regions, "IYCWENW2");
      expect(regionWithJVMServerIndex).to.be.greaterThan(-1);
      cicsTree.takeScreenshot();
    });

    it("Verify CICSEX61 -> Regions -> IYCWENW2 -> JVM Servers", async () => {
      const regionResources = await cicsTree.openItem(WIREMOCK_PROFILE_NAME, CICSEX61, REGIONS_LOADED, await regions[regionWithJVMServerIndex].getLabel());
      expect(regionResources).not.empty;

      const jvmServersResourceIndex = await getRegionResourceIndex(regionResources, "JVM Servers");
      expect(jvmServersResourceIndex).to.be.greaterThan(-1);
      cicsTree.takeScreenshot();
    });
  }); 

}); 


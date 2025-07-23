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

describe("Check if JVM server is present in the tree", () => {
  let view: SideBarView;
  let cicsTree: DefaultTreeSection;
  let wiremockServer: TreeItem | undefined;
  let cicsex61Children: TreeItem[];
  let regionsIndex: number;
  let regions: TreeItem[];
  let regionK1Resources: TreeItem[];
  let regionIYCWENW2Index: number;
  let jvmServersResourceIndex: number;

  before(async () => {
    await sleep(1900);
    view = await openZoweExplorer();
    cicsTree = await getCicsSection(view);
    await sleep(1900);

    wiremockServer = await cicsTree.findItem(WIREMOCK_PROFILE_NAME);
    expect(wiremockServer).exist;
    await sleep(100);
  });

  after(async () => {
    await resetAllScenarios();
  });

  describe("Checking Children of CICSEX61", () => {
    it("Verify CICSEX61 -> Regions", async () => {
      cicsex61Children = await getPlexChildren(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61);
      expect(cicsex61Children).not.empty;

      regionsIndex = await getPlexChildIndex(cicsex61Children, REGIONS);
      expect(regionsIndex).to.be.greaterThan(-1);
      cicsTree.takeScreenshot();
    });

    it("Verify CICSEX61 -> Regions -> IYCWENW2", async () => {
      regions = await getRegionsInPlex(cicsTree, WIREMOCK_PROFILE_NAME, CICSEX61);
      expect(regions).not.empty;

      regionIYCWENW2Index = await getRegionIndex(regions, "IYCWENW2");
      expect(regionIYCWENW2Index).to.be.greaterThan(-1);
      cicsTree.takeScreenshot();
    });

    it("Verify CICSEX61 -> Regions -> IYCWENW2 -> JVM Servers", async () => {
      regionK1Resources = await cicsTree.openItem(WIREMOCK_PROFILE_NAME, CICSEX61, REGIONS_LOADED, await regions[regionIYCWENW2Index].getLabel());
      expect(regionK1Resources).not.empty;

      jvmServersResourceIndex = await getRegionResourceIndex(regionK1Resources, "JVM Servers");
      expect(jvmServersResourceIndex).to.be.greaterThan(-1);
      cicsTree.takeScreenshot();
    });
  }); 

}); 


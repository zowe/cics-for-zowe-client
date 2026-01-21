import { ManagedRegionMeta } from "../../../src/doc/meta/managedRegion.meta";
import { IRegion } from "../../../src/doc/resources/IRegion";
import { Resource } from "../../../src/resources";
import { workspaceConfigurationGetMock } from "../../__mocks__";

workspaceConfigurationGetMock.mockReturnValueOnce([]).mockReturnValue(["MYREGION"]);

describe("Region Meta", () => {
  let regionMock: Resource<IRegion>;

  beforeEach(() => {
    regionMock = new Resource<IRegion>({
      eyu_cicsname: "MYREGION",
      cicsname: "MYREGION",
      cicsstatus: "ENABLED",
      applid: "MYAPPLID",
      startup: "AUTOSTART",
      cicsstate: "ACTIVE",
      secbypass: "NO",
      wlmstatus: "NORMAL",
    });
  });

  it("should return label", () => {
    const label = ManagedRegionMeta.getLabel(regionMock);
    expect(label).toEqual(`MYREGION`);
  });

  it("should build criteria", () => {
    const criteria = ManagedRegionMeta.buildCriteria(["REGION1", "REGION2"]);
    expect(criteria).toEqual("CICSNAME=REGION1 OR CICSNAME=REGION2");
  });

  it("should return context", () => {
    const context = ManagedRegionMeta.getContext(regionMock);
    expect(context).toEqual(`CICSManagedRegion.MYREGION`);
  });

  it("should return icon name", () => {
    const iconName = ManagedRegionMeta.getIconName(regionMock);
    expect(iconName).toEqual(`region`);
  });
  it("should get name", () => {
    const name = ManagedRegionMeta.getName(regionMock);
    expect(name).toEqual("MYREGION");
  });

  it("should return highlights", () => {
    const highlights = ManagedRegionMeta.getHighlights(regionMock);
    expect(highlights).toEqual([
      {
        key: "CICS Name",
        value: "MYREGION",
      },
      {
        key: "CICS State",
        value: "ACTIVE",
      },
      {
        key: "Security Bypass",
        value: "NO",
      },
      {
        key: "Workload Manager Status",
        value: "NORMAL",
      },
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "MYREGION";
    await ManagedRegionMeta.appendCriteriaHistory(criteria);
    let history = ManagedRegionMeta.getCriteriaHistory();
    expect(history).toEqual(["MYREGION"]);
  });

  it("should get criteria history", async () => {
    const criteria = "MYREGION";
    await ManagedRegionMeta.appendCriteriaHistory(criteria);
    let history = ManagedRegionMeta.getCriteriaHistory();
    expect(history).toEqual(["MYREGION"]);
  });
});

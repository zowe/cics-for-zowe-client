import { RegionMeta } from "../../../src/doc";
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
    });
  });

  it("should return label", () => {
    const label = RegionMeta.getLabel(regionMock);
    expect(label).toEqual(`MYREGION (Enabled)`);
  });
  // getDefaultCriteria
  it("should build criteria", () => {
    const criteria = RegionMeta.buildCriteria(["REGION1", "REGION2"]);
    expect(criteria).toEqual("CICSNAME=REGION1 OR CICSNAME=REGION2");
  });

  it("should return context", () => {
    const context = RegionMeta.getContext(regionMock);
    expect(context).toEqual(`CICSManagedRegion.MYREGION`);
  });

  it("should return icon name", () => {
    const iconName = RegionMeta.getIconName(regionMock);
    expect(iconName).toEqual(`region`);
  });
  it("should get name", () => {
    const name = RegionMeta.getName(regionMock);
    expect(name).toEqual("MYREGION");
  });

  it("should return highlights", () => {
    const highlights = RegionMeta.getHighlights(regionMock);
    expect(highlights).toEqual([
      {
        key: "Name",
        value: "MYREGION",
      },
      {
        key: "CICS State",
        value: "ACTIVE",
      },
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "MYREGION";
    await RegionMeta.appendCriteriaHistory(criteria);
    let history = RegionMeta.getCriteriaHistory();
    expect(history).toEqual(["MYREGION"]);
  });

  it("should get criteria history", async () => {
    const criteria = "MYREGION";
    await RegionMeta.appendCriteriaHistory(criteria);
    let history = RegionMeta.getCriteriaHistory();
    expect(history).toEqual(["MYREGION"]);
  });
});

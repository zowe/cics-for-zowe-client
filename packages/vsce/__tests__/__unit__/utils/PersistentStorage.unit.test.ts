const vscodeGetConfigurationMock = jest.fn();
const vscodeGetMock = jest.fn();
const vscodeUpdateMock = jest.fn();

const mockedVSCodeConfig = {
  get: vscodeGetMock,
  update: vscodeUpdateMock,
};

jest.mock("vscode", () => ({
  workspace: {
    getConfiguration: vscodeGetConfigurationMock,
  },
  ConfigurationTarget: {
    Global: "GLOBAL"
  }
}));

import { ILastUsedRegion } from "../../../src/doc/commands/ILastUsedRegion";
import PersistentStorage from "../../../src/utils/PersistentStorage";


const lastUsedRegion: ILastUsedRegion = {
  cicsPlexName: "MYPLEX",
  profileName: "MYPROFILE",
  regionName: "MYREG",
};

describe("PersistentStorage test suite", () => {

  beforeEach(() => {
    vscodeGetMock.mockReset();
    vscodeUpdateMock.mockReset();
    vscodeGetConfigurationMock.mockReset();
    vscodeGetConfigurationMock.mockReturnValue(mockedVSCodeConfig);
  });

  it("should get lastUsedRegion", () => {
    vscodeGetMock.mockReturnValue(lastUsedRegion);
    const region = PersistentStorage.getLastUsedRegion();

    expect(vscodeGetConfigurationMock).toHaveBeenCalledTimes(1);
    expect(vscodeGetConfigurationMock).toHaveBeenCalledWith("zowe.cics.persistent");
    expect(region).toEqual(lastUsedRegion);
  });

  it("should set lastUsedRegion", async () => {
    await PersistentStorage.setLastUsedRegion(lastUsedRegion);

    expect(vscodeGetConfigurationMock).toHaveBeenCalledTimes(2);
    expect(vscodeUpdateMock).toHaveBeenCalledTimes(1);
    expect(vscodeUpdateMock).toHaveBeenCalledWith("zowe.cics.persistent", { ...mockedVSCodeConfig, lastUsedRegion }, "GLOBAL");
  });

  it("should get search history", () => {
    vscodeGetMock.mockReturnValue(["prog1", "prog2"]);
    const history = PersistentStorage.getSearchHistory("CICSProgram");

    expect(vscodeGetConfigurationMock).toHaveBeenCalledTimes(1);
    expect(vscodeGetConfigurationMock).toHaveBeenCalledWith("zowe.cics.persistent");
    expect(vscodeGetMock).toHaveBeenCalledTimes(1);
    expect(vscodeGetMock).toHaveBeenCalledWith("programSearchHistory", []);
    expect(history).toHaveLength(2);
    expect(history[0]).toEqual("prog1");
    expect(history[1]).toEqual("prog2");
  });

  it("should get search history for resource not in map", () => {
    const history = PersistentStorage.getSearchHistory("MADEUPTHING");

    expect(vscodeGetConfigurationMock).toHaveBeenCalledTimes(1);
    expect(vscodeGetConfigurationMock).toHaveBeenCalledWith("zowe.cics.persistent");
    expect(vscodeGetMock).toHaveBeenCalledTimes(1);
    expect(vscodeGetMock).toHaveBeenCalledWith(undefined, []);
    expect(history).toBeUndefined();
  });

  it("should append search history", async () => {
    vscodeGetMock.mockReturnValue(["1", "2"]);
    await PersistentStorage.appendSearchHistory("CICSLocalFile", "MYSRCH*");

    expect(vscodeGetConfigurationMock).toHaveBeenCalledTimes(3);
    expect(vscodeGetMock).toHaveBeenCalledTimes(1);
    expect(vscodeGetMock).toHaveBeenCalledWith("localFileSearchHistory", []);
    expect(vscodeUpdateMock).toHaveBeenCalledTimes(1);
    expect(vscodeUpdateMock).toHaveBeenCalledWith("zowe.cics.persistent", { ...mockedVSCodeConfig, localFileSearchHistory: ["MYSRCH*", "1", "2"] }, "GLOBAL");
  });

  it("should append search history when 10 items are already there", async () => {
    vscodeGetMock.mockReturnValue(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    await PersistentStorage.appendSearchHistory("CICSLocalFile", "MYSRCH*");

    expect(vscodeGetConfigurationMock).toHaveBeenCalledTimes(3);
    expect(vscodeGetMock).toHaveBeenCalledTimes(1);
    expect(vscodeGetMock).toHaveBeenCalledWith("localFileSearchHistory", []);
    expect(vscodeUpdateMock).toHaveBeenCalledTimes(1);
    expect(vscodeUpdateMock).toHaveBeenCalledWith("zowe.cics.persistent", { ...mockedVSCodeConfig, localFileSearchHistory: ["MYSRCH*", "1", "2", "3", "4", "5", "6", "7", "8", "9"] }, "GLOBAL");
  });

  it("should get loaded cics profiles", () => {
    vscodeGetMock.mockReturnValue(["prof1", "prof2"]);
    const profiles = PersistentStorage.getLoadedCICSProfiles();

    expect(vscodeGetConfigurationMock).toHaveBeenCalledTimes(1);
    expect(vscodeGetConfigurationMock).toHaveBeenCalledWith("zowe.cics.persistent");
    expect(vscodeGetMock).toHaveBeenCalledTimes(1);
    expect(vscodeGetMock).toHaveBeenCalledWith("loadedCICSProfile", []);
    expect(profiles).toHaveLength(2);
    expect(profiles[0]).toEqual("prof1");
    expect(profiles[1]).toEqual("prof2");
  });

  it("should append to loaded cics profile", async () => {
    vscodeGetMock.mockReturnValue(["prof1"]);
    await PersistentStorage.appendLoadedCICSProfile("NEW PROF");

    expect(vscodeGetConfigurationMock).toHaveBeenCalledTimes(3);
    expect(vscodeGetMock).toHaveBeenCalledTimes(1);
    expect(vscodeGetMock).toHaveBeenCalledWith("loadedCICSProfile", []);
    expect(vscodeUpdateMock).toHaveBeenCalledTimes(1);
    expect(vscodeUpdateMock).toHaveBeenCalledWith("zowe.cics.persistent", { ...mockedVSCodeConfig, loadedCICSProfile: ["NEW PROF", "prof1"] }, "GLOBAL");
  });

  it("should remove a loaded cics profile", async () => {
    vscodeGetMock.mockReturnValue(["prof1", "prof2"]);
    await PersistentStorage.removeLoadedCICSProfile("prof1");

    expect(vscodeGetConfigurationMock).toHaveBeenCalledTimes(3);
    expect(vscodeGetMock).toHaveBeenCalledTimes(1);
    expect(vscodeGetMock).toHaveBeenCalledWith("loadedCICSProfile", []);
    expect(vscodeUpdateMock).toHaveBeenCalledTimes(1);
    expect(vscodeUpdateMock).toHaveBeenCalledWith("zowe.cics.persistent", { ...mockedVSCodeConfig, loadedCICSProfile: ["prof2"] }, "GLOBAL");
  });

  it("should get default filter", () => {
    vscodeGetMock.mockReturnValue("MY DEFAULT FILTER STORED IN SETTINGS");
    const defFilter = PersistentStorage.getDefaultResourceFilter("CICSPipeline");
    expect(vscodeGetMock).toHaveBeenCalledTimes(1);
    expect(vscodeGetMock).toHaveBeenCalledWith("zowe.cics.CICSPipeline.filter", "(NAME=*)");
    expect(defFilter).toEqual("MY DEFAULT FILTER STORED IN SETTINGS");
  });

  it("should get default filter with custom key", () => {
    vscodeGetMock.mockReturnValue("MY DEFAULT FILTER STORED IN SETTINGS");
    const defFilter = PersistentStorage.getDefaultResourceFilter("CICSPipeline", "CUSTOMKEY");
    expect(vscodeGetMock).toHaveBeenCalledTimes(1);
    expect(vscodeGetMock).toHaveBeenCalledWith("zowe.cics.CUSTOMKEY.filter", "(NAME=*)");
    expect(defFilter).toEqual("MY DEFAULT FILTER STORED IN SETTINGS");
  });

  it("should get number of resources to fetch", () => {
    vscodeGetMock.mockReturnValue(5);
    const numToFetch = PersistentStorage.getNumberOfResourcesToFetch();

    expect(vscodeGetMock).toHaveBeenCalledTimes(1);
    expect(vscodeGetMock).toHaveBeenCalledWith("zowe.cics.resourcePageCount", 250);
    expect(numToFetch).toEqual(5);
  });
});

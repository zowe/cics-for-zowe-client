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

import { ConfigurationTarget } from "vscode";
import { ILastUsedRegion } from "../../../src/doc/commands/ILastUsedRegion";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import { workspaceConfigurationGetMock, workspaceConfigurationUpdateMock } from "../../__mocks__";

const lastUsedRegion: ILastUsedRegion = {
  cicsPlexName: "MYPLEX",
  profileName: "MYPROFILE",
  regionName: "MYREG",
};

describe("PersistentStorage test suite", () => {
  beforeEach(() => {
    workspaceConfigurationGetMock.mockReset();
    workspaceConfigurationUpdateMock.mockReset();
  });

  it("should get lastUsedRegion", () => {
    workspaceConfigurationGetMock.mockReturnValue(lastUsedRegion);
    const region = PersistentStorage.getLastUsedRegion();

    expect(workspaceConfigurationGetMock).toHaveBeenCalledTimes(1);
    expect(workspaceConfigurationGetMock).toHaveBeenCalledWith("lastUsedRegion", { cicsPlexName: null, profileName: null, regionName: null });
    expect(region).toEqual(lastUsedRegion);
  });

  it("should set lastUsedRegion", async () => {
    await PersistentStorage.setLastUsedRegion(lastUsedRegion);

    expect(workspaceConfigurationUpdateMock).toHaveBeenCalledTimes(1);
    expect(workspaceConfigurationUpdateMock).toHaveBeenCalledWith(
      "zowe.cics.persistent",
      expect.objectContaining({ lastUsedRegion }),
      ConfigurationTarget.Global
    );
  });

  it("should get search history", () => {
    workspaceConfigurationGetMock.mockReturnValue(["prog1", "prog2"]);
    const history = PersistentStorage.getSearchHistory("CICSProgram");

    expect(workspaceConfigurationGetMock).toHaveBeenCalledTimes(1);
    expect(workspaceConfigurationGetMock).toHaveBeenCalledWith("programSearchHistory", []);
    expect(history).toHaveLength(2);
    expect(history[0]).toEqual("prog1");
    expect(history[1]).toEqual("prog2");
  });

  it("should get search history for resource not in map", () => {
    const history = PersistentStorage.getSearchHistory("MADEUPTHING");

    expect(workspaceConfigurationGetMock).toHaveBeenCalledTimes(1);
    expect(workspaceConfigurationGetMock).toHaveBeenCalledWith(undefined, []);
    expect(history).toBeUndefined();
  });

  it("should append search history", async () => {
    workspaceConfigurationGetMock.mockReturnValue(["1", "2"]);
    await PersistentStorage.appendSearchHistory("CICSLocalFile", "MYSRCH*");

    expect(workspaceConfigurationGetMock).toHaveBeenCalledTimes(1);
    expect(workspaceConfigurationGetMock).toHaveBeenCalledWith("localFileSearchHistory", []);
    expect(workspaceConfigurationUpdateMock).toHaveBeenCalledTimes(1);
    expect(workspaceConfigurationUpdateMock).toHaveBeenCalledWith(
      "zowe.cics.persistent",
      expect.objectContaining({ localFileSearchHistory: ["MYSRCH*", "1", "2"] }),
      ConfigurationTarget.Global
    );
  });

  it("should append search history when 10 items are already there", async () => {
    workspaceConfigurationGetMock.mockReturnValue(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    await PersistentStorage.appendSearchHistory("CICSLocalFile", "MYSRCH*");

    expect(workspaceConfigurationGetMock).toHaveBeenCalledTimes(1);
    expect(workspaceConfigurationGetMock).toHaveBeenCalledWith("localFileSearchHistory", []);
    expect(workspaceConfigurationUpdateMock).toHaveBeenCalledTimes(1);
    expect(workspaceConfigurationUpdateMock).toHaveBeenCalledWith(
      "zowe.cics.persistent",
      expect.objectContaining({ localFileSearchHistory: ["MYSRCH*", "1", "2", "3", "4", "5", "6", "7", "8", "9"] }),
      ConfigurationTarget.Global
    );
  });

  it("should get loaded cics profiles", () => {
    workspaceConfigurationGetMock.mockReturnValue(["prof1", "prof2"]);
    const profiles = PersistentStorage.getLoadedCICSProfiles();

    expect(workspaceConfigurationGetMock).toHaveBeenCalledTimes(1);
    expect(workspaceConfigurationGetMock).toHaveBeenCalledWith("loadedCICSProfile", []);
    expect(profiles).toHaveLength(2);
    expect(profiles[0]).toEqual("prof1");
    expect(profiles[1]).toEqual("prof2");
  });

  it("should append to loaded cics profile", async () => {
    workspaceConfigurationGetMock.mockReturnValue(["prof1"]);
    await PersistentStorage.appendLoadedCICSProfile("NEW PROF");

    expect(workspaceConfigurationGetMock).toHaveBeenCalledTimes(1);
    expect(workspaceConfigurationGetMock).toHaveBeenCalledWith("loadedCICSProfile", []);
    expect(workspaceConfigurationUpdateMock).toHaveBeenCalledTimes(1);
    expect(workspaceConfigurationUpdateMock).toHaveBeenCalledWith(
      "zowe.cics.persistent",
      expect.objectContaining({ loadedCICSProfile: ["NEW PROF", "prof1"] }),
      ConfigurationTarget.Global
    );
  });

  it("should remove a loaded cics profile", async () => {
    workspaceConfigurationGetMock.mockReturnValue(["prof1", "prof2"]);
    await PersistentStorage.removeLoadedCICSProfile("prof1");

    expect(workspaceConfigurationGetMock).toHaveBeenCalledTimes(1);
    expect(workspaceConfigurationGetMock).toHaveBeenCalledWith("loadedCICSProfile", []);
    expect(workspaceConfigurationUpdateMock).toHaveBeenCalledTimes(1);
    expect(workspaceConfigurationUpdateMock).toHaveBeenCalledWith(
      "zowe.cics.persistent",
      expect.objectContaining({ loadedCICSProfile: ["prof2"] }),
      ConfigurationTarget.Global
    );
  });

  it("should get default filter", () => {
    workspaceConfigurationGetMock.mockReturnValue("MY DEFAULT FILTER STORED IN SETTINGS");
    const defFilter = PersistentStorage.getDefaultResourceFilter("CICSPipeline");
    expect(workspaceConfigurationGetMock).toHaveBeenCalledTimes(1);
    expect(workspaceConfigurationGetMock).toHaveBeenCalledWith("zowe.cics.CICSPipeline.filter", "(NAME=*)");
    expect(defFilter).toEqual("MY DEFAULT FILTER STORED IN SETTINGS");
  });

  it("should get default filter with custom key", () => {
    workspaceConfigurationGetMock.mockReturnValue("MY DEFAULT FILTER STORED IN SETTINGS");
    const defFilter = PersistentStorage.getDefaultResourceFilter("CICSPipeline", "CUSTOMKEY");
    expect(workspaceConfigurationGetMock).toHaveBeenCalledTimes(1);
    expect(workspaceConfigurationGetMock).toHaveBeenCalledWith("zowe.cics.CUSTOMKEY.filter", "(NAME=*)");
    expect(defFilter).toEqual("MY DEFAULT FILTER STORED IN SETTINGS");
  });

  it("should get number of resources to fetch", () => {
    workspaceConfigurationGetMock.mockReturnValue(5);
    const numToFetch = PersistentStorage.getNumberOfResourcesToFetch();

    expect(workspaceConfigurationGetMock).toHaveBeenCalledTimes(1);
    expect(workspaceConfigurationGetMock).toHaveBeenCalledWith("zowe.cics.resourcePageCount", 250);
    expect(numToFetch).toEqual(5);
  });
});

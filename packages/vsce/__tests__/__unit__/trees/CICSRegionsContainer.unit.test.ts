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

import { CICSSessionTree } from "../../../src/trees";
import { CICSPlexTree } from "../../../src/trees/CICSPlexTree";
import { CICSRegionsContainer } from "../../../src/trees/CICSRegionsContainer";
import { CICSTree } from "../../../src/trees/CICSTree";
import PersistentStorage from "../../../src/utils/PersistentStorage";
import { getResourceMock, profile } from "../../__mocks__";

jest.spyOn(PersistentStorage, "getCriteria").mockReturnValue(undefined);

const record = [
  { cicsname: "cics", cicsstate: "ACTIVE" },
  { cicsname: "test2", cicsstate: "ACTIVE" },
];

describe("Test suite for CICSRegionsContainer", () => {
  let cicsTree: CICSTree;
  let sessionTree: CICSSessionTree;
  let plexTree: CICSPlexTree;
  let regionsContainer: CICSRegionsContainer;

  beforeEach(() => {
    cicsTree = new CICSTree();
    sessionTree = new CICSSessionTree(profile, cicsTree);
    plexTree = new CICSPlexTree("MYPLEX", profile, sessionTree);
    regionsContainer = new CICSRegionsContainer(plexTree);
  });

  describe("Test suite for filterRegions", () => {
    it("should filter regions based on the pattern", () => {
      getResourceMock.mockResolvedValueOnce({
        response: {
          resultSummary: { api_response1: "1024", api_response2: "0", recordcount: "1", displayed_recordcount: "1" },
          records: { cicsmanagedregion: record },
        },
      });
      regionsContainer.filterRegions("IYC*", cicsTree);

      expect(regionsContainer.activeFilter).toBe("IYC*");
      expect(regionsContainer.label).toEqual("Regions (IYC*)");
    });
  });

  describe("Test suite for loadRegionsInCICSGroup", () => {
    it("should load regions in CICS group", async () => {
      getResourceMock.mockResolvedValueOnce({
        response: {
          resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "1", displayed_recordcount: "1" },
          records: { cicsmanagedregion: record },
        },
      });

      regionsContainer.activeFilter = "cics";

      await regionsContainer.loadRegionsInCICSGroup(cicsTree);

      expect(regionsContainer.label).toBe("Regions");
      expect(regionsContainer.description).toBe("(cics) 1/1");
      expect(regionsContainer.collapsibleState).toBe(2);
    });
  });

  describe("Test suite for loadRegionsInPlex", () => {
    it("Should load all regions of plex", async () => {
      getResourceMock.mockResolvedValueOnce({
        response: {
          resultsummary: { api_response1: "1024", api_response2: "0", recordcount: "2", displayed_recordcount: "2" },
          records: { cicsmanagedregion: record },
        },
      });

      await regionsContainer.loadRegionsInPlex();

      expect(regionsContainer.label).toBe("Regions");
      expect(regionsContainer.description).toBe("2/2");
      expect(regionsContainer.collapsibleState).toBe(2);
    });
  });
});

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

import {ICicsPlexInfo, evaluateCicsPlex, filterCicsplexByConstraints} from "../../../src/utils/plexUtils";

function getPlexInfo(plexname: string, status: string, mpstatus: string, accesstype: string) {
  const plex: ICicsPlexInfo =
  {
    _keydata: "",
    accesstype: accesstype,
    botrsupd: "",
    cmasname: "",
    mpstatus: mpstatus,
    plexname: plexname,
    readrs: "",
    rspoolid: "",
    status: status,
    sysid: "",
    toprsupd: "",
    transitcmas: "",
    transitcnt: "",
    updaters: ""
  };
  return plex;
}


describe("Plex Utils tests", () => {
  describe("compareCicsplexes", () => {
    it("should return 15 for active plex with mpstatus yes and accesstype local", () => {
      const plex = getPlexInfo("PLEX", "ACTIVE", "YES", "LOCAL");

      const response = evaluateCicsPlex(plex);
      expect(response).toEqual(15);
    });

    it("should return 8 for plex for plex with inactive status", () => {
      const plex = getPlexInfo("PLEX", "INACTIVE", "YES", "LOCAL");

      const response = evaluateCicsPlex(plex);
      expect(response).toEqual(8);
    });

    it("should return 12 when plex has mpstatus NO", () => {
      const plex = getPlexInfo("PLEX", "ACTIVE", "NO", "LOCAL");

      const response = evaluateCicsPlex(plex);
      expect(response).toEqual(12);
    });

    it("should return 10 when plex has accesstype ADJACENT", () => {
      const plex = getPlexInfo("PLEX", "ACTIVE", "YES", "ADJACENT");

      const response = evaluateCicsPlex(plex);
      expect(response).toEqual(10);
    });

    it("should return 7 when plex has mpstatus NO and accesstype os adjacent", () => {
      const plex = getPlexInfo("PLEX", "ACTIVE", "NO", "ADJACENT");

      const response = evaluateCicsPlex(plex);
      expect(response).toEqual(7);
    });

    it("should return 0 as plex is inactive, mpstatus no and accesstype adjacent", () => {
      const plex = getPlexInfo("PLEX", "INACTIVE", "NO", "ADJACENT");

      const response = evaluateCicsPlex(plex);
      expect(response).toEqual(0);
    });
  });

  describe("filterCicsplexByConstraints", () => {
    it("should return a map of 2 plexes as both are valid", () => {
      const plexes = [
        getPlexInfo("PLEX1", 'ACTIVE', 'YES', 'LOCAL'),
        getPlexInfo("PLEX2", 'ACTIVE', 'YES', 'LOCAL')
      ];
      const allplexes = filterCicsplexByConstraints(plexes);
      expect(allplexes.size).toEqual(2);
    });

    it("should return a map of 1 plex as one in inactive both are valid", () => {
      const expected = getPlexInfo("PLEX1", 'ACTIVE', 'YES', 'LOCAL');
      const plexes = [
        getPlexInfo("PLEX1", 'INACTIVE', 'YES', 'LOCAL'),
        expected
      ];
      const allplexes = filterCicsplexByConstraints(plexes);
      expect(allplexes.size).toEqual(1);
      expect(allplexes.get("PLEX1")).toEqual(expected);
    });

    it("should return a map of 1 plex even though both are inactive", () => {
      const expected = getPlexInfo("PLEX1", 'INACTIVE', 'YES', 'LOCAL');
      const plexes = [
        expected,
        getPlexInfo("PLEX1", 'INACTIVE', 'YES', 'LOCAL')
      ];
      const allplexes = filterCicsplexByConstraints(plexes);
      expect(allplexes.size).toEqual(1);
      expect(allplexes.get("PLEX1")).toEqual(expected);
    });

    it("should return a map of 1 plex as one of the plexes has mpstatus NO", () => {
      const expected = getPlexInfo("PLEX1", 'ACTIVE', 'YES', 'LOCAL');
      const plexes = [
        getPlexInfo("PLEX1", 'ACTIVE', 'NO', 'LOCAL'),
        expected
      ];
      const allplexes = filterCicsplexByConstraints(plexes);
      expect(allplexes.size).toEqual(1);
      expect(allplexes.get("PLEX1")).toEqual(
        getPlexInfo("PLEX1", 'ACTIVE', 'YES', 'LOCAL'));
    });

    it("should return a map of 1 plex as one of the plexes has accesstype ADJACENT", () => {
      const expected = getPlexInfo("PLEX1", 'ACTIVE', 'YES', 'LOCAL')
      const plexes = [
        getPlexInfo("PLEX1", 'ACTIVE', 'YES', 'ADJACENT'),
        expected
      ];
      const allplexes = filterCicsplexByConstraints(plexes);
      expect(allplexes.size).toEqual(1);
      expect(allplexes.get("PLEX1")).toEqual(
        getPlexInfo("PLEX1", 'ACTIVE', 'YES', 'LOCAL'));
    });

    it("should return an array of 3 plexes", () => {
      const plexes = [
        getPlexInfo("PLEX1", 'ACTIVE', 'YES', 'LOCAL'),
        getPlexInfo("PLEX2#", 'ACTIVE', 'NO', 'LOCAL'),
        getPlexInfo("PLEX2#", 'ACTIVE', 'YES', 'ADJACENT'),
        getPlexInfo("PLEX3#", 'ACTIVE', 'NO', 'LOCAL'),
        getPlexInfo("PLEX3#", 'ACTIVE', 'YES', 'ADJACENT')
      ];

      const allplexes = filterCicsplexByConstraints(plexes);

      expect(allplexes.size).toEqual(3);
      expect(allplexes.get("PLEX1")).toEqual(
        getPlexInfo("PLEX1", 'ACTIVE', 'YES', 'LOCAL'));
      expect(allplexes.get("PLEX2#")).toEqual(
        getPlexInfo("PLEX2#", 'ACTIVE', 'NO', 'LOCAL'));
      expect(allplexes.get("PLEX3#")).toEqual(
        getPlexInfo("PLEX3#", 'ACTIVE', 'NO', 'LOCAL'));
    });
    it("should return an array of 4 plexes", () => {
      const plexes = [
        getPlexInfo("PLEX1", "ACTIVE", "YES", "LOCAL"),
        getPlexInfo("PLEX1", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX1", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX1", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX1", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX1", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX1", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX1", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX1", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX1", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX2", "ACTIVE", "YES", "LOCAL"),
        getPlexInfo("PLEX2", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX2", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX2", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX2", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX2", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX2", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX2", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX2", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX2", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX3", "ACTIVE", "YES", "LOCAL"),
        getPlexInfo("PLEX3", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX3", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX3", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX3", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX3", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX3", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX3", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX3", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX3", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX4", "ACTIVE", "YES", "LOCAL"),
        getPlexInfo("PLEX4", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX4", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX4", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX4", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX4", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX4", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX4", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX4", "ACTIVE", "NO", "ADJACENT"),
        getPlexInfo("PLEX4", "ACTIVE", "NO", "ADJACENT")
      ];

      const allplexes = filterCicsplexByConstraints(plexes);

      expect(allplexes.size).toEqual(4);
      expect(allplexes.get("PLEX1")).toEqual(
        getPlexInfo("PLEX1", "ACTIVE", "YES", "LOCAL"));
      expect(allplexes.get("PLEX2")).toEqual(
        getPlexInfo("PLEX2", "ACTIVE", "YES", "LOCAL"));
      expect(allplexes.get("PLEX3")).toEqual(
        getPlexInfo("PLEX3", "ACTIVE", "YES", "LOCAL"));
      expect(allplexes.get("PLEX4")).toEqual(
        getPlexInfo("PLEX4", "ACTIVE", "YES", "LOCAL"));

    });
  });
});

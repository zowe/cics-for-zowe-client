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

import * as profileUtils from "../../../src/utils/plexUtils";

describe("Profile Utils tests", () => {
  describe("compareCicsplexes", () => {
    it("should return 15 for active plex with mpstatus yes and accesstype local", () => {
      const plex = {
        status: "ACTIVE",
        mpstatus: "YES",
        accesstype: "LOCAL"
      };

      const response = profileUtils.evaluateCicsPlex(plex);
      expect(response).toEqual(15);
    });

    it("should return 8 for plex for plex with inactive status", () => {
      const plex = {
        status: "INACTIVE",
        mpstatus: "YES",
        accesstype: "LOCAL"
      };

      const response = profileUtils.evaluateCicsPlex(plex);
      expect(response).toEqual(8);
    });

    it("should return 12 when plex has mpstatus NO", () => {
      const plex = {
        status: "ACTIVE",
        mpstatus: "NO",
        accesstype: "LOCAL"
      };

      const response = profileUtils.evaluateCicsPlex(plex);
      expect(response).toEqual(12);
    });

    it("should return 10 when plex has accesstype ADJACENT", () => {
      const plex = {
        status: "ACTIVE",
        mpstatus: "YES",
        accesstype: "ADJACENT"
      };

      const response = profileUtils.evaluateCicsPlex(plex);
      expect(response).toEqual(10);
    });

    it("should return 7 when plex has mpstatus NO and accesstype os adjacent", () => {
      const plex = {
        status: "ACTIVE",
        mpstatus: "NO",
        accesstype: "ADJACENT"
      };

      const response = profileUtils.evaluateCicsPlex(plex);
      expect(response).toEqual(7);
    });

    it("should return 0 as plex is inactive, mpstatus no and accesstype adjacent", () => {
      const plex = {
        status: "INACTIVE",
        mpstatus: "NO",
        accesstype: "ADJACENTL"
      };

      const response = profileUtils.evaluateCicsPlex(plex);
      expect(response).toEqual(0);
    });
  });

  describe("filterCicsplexByConstraints", () => {
    it("should return an array of 2 plexes as both are valid", () => {
      const plexes = [
        {accesstype: 'LOCAL', mpstatus: 'YES', plexname: 'PLEX1', status: 'ACTIVE'},
        {accesstype: 'LOCAL', mpstatus: 'YES', plexname: 'PLEX2', status: 'ACTIVE'}
      ];
      const allplexes = profileUtils.filterCicsplexByConstraints(plexes);
      expect(allplexes.size).toEqual(2);
    });

    it("should return an array of 1 plex as one in inactive both are valid", () => {
      const expected = {accesstype: 'LOCAL', mpstatus: 'YES', plexname: 'PLEX1', status: 'ACTIVE'};
      const plexes = [
        {accesstype: 'LOCAL', mpstatus: 'YES', plexname: 'PLEX1', status: 'INACTIVE'},
        expected
      ];
      const allplexes = profileUtils.filterCicsplexByConstraints(plexes);
      expect(allplexes.size).toEqual(1);
      expect(allplexes.get("PLEX1")).toEqual(expected);
    });

    it("should return an array of 1 plex even though both are inactive", () => {
      const plexes = [
        {accesstype: 'LOCAL', mpstatus: 'YES', plexname: 'PLEX1', status: 'INACTIVE'},
        {accesstype: 'LOCAL', mpstatus: 'YES', plexname: 'PLEX1', status: 'INACTIVE'}
      ];
      const allplexes = profileUtils.filterCicsplexByConstraints(plexes);
      expect(allplexes.size).toEqual(1);
      expect(allplexes.get("PLEX1")).toEqual(
        {accesstype: 'LOCAL', mpstatus: 'YES', plexname: 'PLEX1', status: 'INACTIVE'});
    });

    it("should return an array of 1 plex as one of the plexes has mpstatus NO", () => {
      const plexes = [
        {accesstype: 'LOCAL', mpstatus: 'NO', plexname: 'PLEX1', status: 'ACTIVE'},
        {accesstype: 'LOCAL', mpstatus: 'YES', plexname: 'PLEX1', status: 'ACTIVE'}
      ];
      const allplexes = profileUtils.filterCicsplexByConstraints(plexes);
      expect(allplexes.size).toEqual(1);
      expect(allplexes.get("PLEX1")).toEqual(
        {accesstype: 'LOCAL', mpstatus: 'YES', plexname: 'PLEX1', status: 'ACTIVE'});
    });

    it("should return an array of 1 plex as one of the plexes has accesstype ADJACENT", () => {
      const plexes = [
        {accesstype: 'ADJACENT', mpstatus: 'YES', plexname: 'PLEX1', status: 'ACTIVE'},
        {accesstype: 'LOCAL', mpstatus: 'YES', plexname: 'PLEX1', status: 'ACTIVE'}
      ];
      const allplexes = profileUtils.filterCicsplexByConstraints(plexes);
      expect(allplexes.size).toEqual(1);
      expect(allplexes.get("PLEX1")).toEqual(
        {accesstype: 'LOCAL', mpstatus: 'YES', plexname: 'PLEX1', status: 'ACTIVE'});
    });

    it("should return an array of 3 plex", () => {
      const plexes = [
        {accesstype: 'LOCAL', mpstatus: 'YES', plexname: 'PLEX1', status: 'ACTIVE'},
        {accesstype: 'LOCAL', mpstatus: 'NO', plexname: 'PLEX2#', status: 'ACTIVE'},
        {accesstype: 'ADJACENT', mpstatus: 'YES', plexname: 'PLEX2#', status: 'ACTIVE'},
        {accesstype: 'LOCAL', mpstatus: 'NO', plexname: 'PLEX3#', status: 'ACTIVE'},
        {accesstype: 'ADJACENT', mpstatus: 'YES', plexname: 'PLEX3#', status: 'ACTIVE'}
      ];

      const allplexes = profileUtils.filterCicsplexByConstraints(plexes);
      expect(allplexes.size).toEqual(3);
      expect(allplexes.get("PLEX1")).toEqual(
        {accesstype: 'LOCAL', mpstatus: 'YES', plexname: 'PLEX1', status: 'ACTIVE'});
      expect(allplexes.get("PLEX2#")).toEqual(
        {accesstype: 'LOCAL', mpstatus: 'NO', plexname: 'PLEX2#', status: 'ACTIVE'});
      expect(allplexes.get("PLEX3#")).toEqual(
        {accesstype: 'LOCAL', mpstatus: 'NO', plexname: 'PLEX3#', status: 'ACTIVE'});
    });
  });
});

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

import { createFilterRegex, patternToRegex } from "../../../src/utils/patternUtils";

describe("patternUtils", () => {
  describe("patternToRegex", () => {
    it("should convert single wildcard pattern", () => {
      const result = patternToRegex("CICS*");
      expect(result).toBe("(^CICS(.*)$)");
    });

    it("should convert pattern with wildcard at start", () => {
      const result = patternToRegex("*CICS");
      expect(result).toBe("(^(.*)CICS$)");
    });

    it("should convert pattern with wildcard in middle", () => {
      const result = patternToRegex("CICS*TEST");
      expect(result).toBe("(^CICS(.*)TEST$)");
    });

    it("should convert multiple wildcards in pattern", () => {
      const result = patternToRegex("*CICS*");
      expect(result).toBe("(^(.*)CICS(.*)$)");
    });

    it("should convert comma-separated patterns", () => {
      const result = patternToRegex("CICS*,TEST*");
      expect(result).toBe("(^CICS(.*)$)|(^TEST(.*)$)");
    });

    it("should handle patterns with spaces around commas", () => {
      const result = patternToRegex("CICS* , TEST*");
      expect(result).toBe("(^CICS(.*)$)|(^TEST(.*)$)");
    });

    it("should convert wildcard-only pattern", () => {
      const result = patternToRegex("*");
      expect(result).toBe("(^(.*)$)");
    });

    it("should handle three comma-separated patterns", () => {
      const result = patternToRegex("CICS*,TEST*,PROD*");
      expect(result).toBe("(^CICS(.*)$)|(^TEST(.*)$)|(^PROD(.*)$)");
    });
  });

  describe("createFilterRegex", () => {
    it("should return null for wildcard-only pattern", () => {
      const result = createFilterRegex("*");
      expect(result).toBeNull();
    });

    it("should return null for empty pattern", () => {
      const result = createFilterRegex("");
      expect(result).toBeNull();
    });

    it("should return RegExp for valid pattern", () => {
      const result = createFilterRegex("CICS*");
      expect(result).toBeInstanceOf(RegExp);
    });

    it("should create working regex for single pattern", () => {
      const regex = createFilterRegex("CICS*");
      expect("CICS1".match(regex)).toBeTruthy();
      expect("CICS2".match(regex)).toBeTruthy();
      expect("TEST1".match(regex)).toBeFalsy();
    });

    it("should create working regex for multiple patterns", () => {
      const regex = createFilterRegex("CICS*,TEST*");
      expect("CICS1".match(regex)).toBeTruthy();
      expect("TEST1".match(regex)).toBeTruthy();
      expect("PROD1".match(regex)).toBeFalsy();
    });

    it("should match pattern with wildcard at start", () => {
      const regex = createFilterRegex("*CICS");
      expect("ACICS".match(regex)).toBeTruthy();
      expect("BCICS".match(regex)).toBeTruthy();
      expect("CICSA".match(regex)).toBeFalsy();
    });

    it("should match pattern with wildcard in middle", () => {
      const regex = createFilterRegex("CICS*TEST");
      expect("CICS1TEST".match(regex)).toBeTruthy();
      expect("CICS2TEST".match(regex)).toBeTruthy();
      expect("CICS1PROD".match(regex)).toBeFalsy();
    });

    it("should match pattern with multiple wildcards", () => {
      const regex = createFilterRegex("*CICS*");
      expect("ACICSB".match(regex)).toBeTruthy();
      expect("XCICSY".match(regex)).toBeTruthy();
      expect("TEST".match(regex)).toBeFalsy();
    });
  });
});

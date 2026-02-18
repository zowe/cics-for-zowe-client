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

// Mock acquireVsCodeApi before importing the module
(global as any).acquireVsCodeApi = jest.fn(() => ({
  postMessage: jest.fn(),
  getState: jest.fn(),
  setState: jest.fn(),
}));

import { isDatasetValue, isHyperlinkableValue } from "../../../src/webviews/resource-inspector-panel/utils/hyperlinkUtils";

describe("hyperlinkUtils", () => {
  describe("isDatasetValue", () => {
    test("should return true for valid dataset names", () => {
      expect(isDatasetValue("SYS1.PROCLIB")).toBe(true);
      expect(isDatasetValue("MY.DATASET")).toBe(true);
      expect(isDatasetValue("A.B.C")).toBe(true);
      expect(isDatasetValue("USER.TEST.DATA")).toBe(true);
      expect(isDatasetValue("PROD.CICS.LOADLIB")).toBe(true);
    });

    test("should return true for dataset names with national characters", () => {
      expect(isDatasetValue("USER@TST")).toBe(true);
      expect(isDatasetValue("DATA#SET")).toBe(true);
      expect(isDatasetValue("MY$DATA")).toBe(true);
      expect(isDatasetValue("A@B#C$D")).toBe(true);
      expect(isDatasetValue("SYS1.PROC@LB")).toBe(true);
      expect(isDatasetValue("USER#.TEST$")).toBe(true);
    });

    test("should return true for single qualifier datasets", () => {
      expect(isDatasetValue("DATASET")).toBe(true);
      expect(isDatasetValue("A")).toBe(true);
      expect(isDatasetValue("TEST123")).toBe(true);
    });

    test("should return true for datasets with maximum qualifiers (22)", () => {
      const maxQualifiers = "A.B.C.D.E.F.G.H.I.J.K.L.M.N.O.P.Q.R.S.T.U.V";
      expect(isDatasetValue(maxQualifiers)).toBe(true);
    });

    test("should return false for invalid dataset names", () => {
      // Lowercase letters
      expect(isDatasetValue("my.dataset")).toBe(false);
      expect(isDatasetValue("SYS1.proclib")).toBe(false);
      
      // Invalid characters
      expect(isDatasetValue("MY-DATASET")).toBe(false);
      expect(isDatasetValue("MY_DATASET")).toBe(false);
      expect(isDatasetValue("MY DATASET")).toBe(false);
      expect(isDatasetValue("MY!DATASET")).toBe(false);
      
      // Qualifier too long (>8 characters)
      expect(isDatasetValue("VERYLONGNAME.DATA")).toBe(false);
      expect(isDatasetValue("A.TOOLONGQUALIFIER")).toBe(false);
      
      // Too many qualifiers (>22)
      const tooManyQualifiers = "A.B.C.D.E.F.G.H.I.J.K.L.M.N.O.P.Q.R.S.T.U.V.W";
      expect(isDatasetValue(tooManyQualifiers)).toBe(false);
      
      // Empty or invalid
      expect(isDatasetValue("")).toBe(false);
      expect(isDatasetValue(".")).toBe(false);
      expect(isDatasetValue("..")).toBe(false);
      expect(isDatasetValue("A..B")).toBe(false);
      
      // Starting or ending with dot
      expect(isDatasetValue(".DATASET")).toBe(false);
      expect(isDatasetValue("DATASET.")).toBe(false);
    });

    test("should return false for non-string values", () => {
      expect(isDatasetValue(null as any)).toBe(false);
      expect(isDatasetValue(undefined as any)).toBe(false);
      expect(isDatasetValue(123 as any)).toBe(false);
      expect(isDatasetValue({} as any)).toBe(false);
    });
  });

  describe("isHyperlinkableValue", () => {
    test("should return true for job spool pattern (//DD:*)", () => {
      expect(isHyperlinkableValue("//DD:SYSOUT")).toBe(true);
      expect(isHyperlinkableValue("//DD:JESMSGLG")).toBe(true);
      expect(isHyperlinkableValue("//DD:JESJCL")).toBe(true);
      expect(isHyperlinkableValue("//DD:JESYSMSG")).toBe(true);
      expect(isHyperlinkableValue("//DD:STDOUT")).toBe(true);
      expect(isHyperlinkableValue("//DD:STDERR")).toBe(true);
    });

    test("should return false for non-matching patterns", () => {
      expect(isHyperlinkableValue("DD:SYSOUT")).toBe(false);
      expect(isHyperlinkableValue("//SYSOUT")).toBe(false);
      expect(isHyperlinkableValue("SYS1.PROCLIB")).toBe(false);
      expect(isHyperlinkableValue("MY.DATASET")).toBe(false);
      expect(isHyperlinkableValue("")).toBe(false);
      expect(isHyperlinkableValue("//DD:")).toBe(false);
    });

    test("should return false for invalid input", () => {
      expect(isHyperlinkableValue(null as any)).toBe(false);
      expect(isHyperlinkableValue(undefined as any)).toBe(false);
    });
  });
});
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
    test("should return true for dataset names with 2 qualifiers", () => {
      expect(isDatasetValue("USER.STORE")).toBe(true);
      expect(isDatasetValue("SYS1.PROCLIB")).toBe(true);
      expect(isDatasetValue("MY.DATASET")).toBe(true);
      expect(isDatasetValue("A.B")).toBe(true);
    });

    test("should return true for dataset names with 2 qualifiers and member name", () => {
      expect(isDatasetValue("USER.STORE(MEMBER)")).toBe(true);
      expect(isDatasetValue("SYS1.PROCLIB(JCL)")).toBe(true);
      expect(isDatasetValue("A.B(C)")).toBe(true);
    });

    test("should return true for dataset names with 3 qualifiers", () => {
      expect(isDatasetValue("AAA.BBB.CCC")).toBe(true);
      expect(isDatasetValue("USER.TEST.DATA")).toBe(true);
      expect(isDatasetValue("A.B.C")).toBe(true);
    });

    test("should return true for dataset names with 3 qualifiers and member name", () => {
      expect(isDatasetValue("AAA.BBB(CCC)")).toBe(true);
      expect(isDatasetValue("USER.TEST(DATA)")).toBe(true);
      expect(isDatasetValue("A.B(C)")).toBe(true);
    });

    test("should return true for dataset names with 4 qualifiers", () => {
      expect(isDatasetValue("AAA.BBB.CCC.DDD")).toBe(true);
      expect(isDatasetValue("EXPAUTO.CPSM.IYCWENW2.DFHLRQ")).toBe(true);
      expect(isDatasetValue("USER.TEST.DATA.SET")).toBe(true);
      expect(isDatasetValue("A.B.C.D")).toBe(true);
    });

    test("should return true for dataset names with 4 qualifiers and member name", () => {
      expect(isDatasetValue("AAA.BBB.CCC(DDD)")).toBe(true);
      expect(isDatasetValue("USER.TEST.DATA(SET)")).toBe(true);
      expect(isDatasetValue("A.B.C(D)")).toBe(true);
    });

    test("should return true for dataset names with 5 qualifiers", () => {
      expect(isDatasetValue("AAA.BBB.CCC.DDD.EEE")).toBe(true);
      expect(isDatasetValue("USER.TEST.DATA.SET.LIB")).toBe(true);
      expect(isDatasetValue("A.B.C.D.E")).toBe(true);
    });

    test("should return true for dataset names with 5 qualifiers and member name", () => {
      expect(isDatasetValue("AAA.BBB.CCC.DDD(EEE)")).toBe(true);
      expect(isDatasetValue("USER.TEST.DATA.SET(LIB)")).toBe(true);
      expect(isDatasetValue("A.B.C.D(E)")).toBe(true);
    });

    test("should return true for dataset names with national characters", () => {
      expect(isDatasetValue("USER@.TST.DATA")).toBe(true);
      expect(isDatasetValue("DATA#.SET.TEST")).toBe(true);
      expect(isDatasetValue("MY$.DATA.PROD")).toBe(true);
      expect(isDatasetValue("A@B.C#D.E$F")).toBe(true);
      expect(isDatasetValue("USER@.TST(DATA)")).toBe(true);
    });

    test("should return true for dataset names with hyphens", () => {
      expect(isDatasetValue("MY-DATA.SET.TEST")).toBe(true);
      expect(isDatasetValue("USER-01.TEST-02.DATA")).toBe(true);
      expect(isDatasetValue("A-B.C-D.E-F")).toBe(true);
      expect(isDatasetValue("HLQ.ABC-123.XYZ")).toBe(true);
      expect(isDatasetValue("MY-DATA.SET(TEST-01)")).toBe(true);
    });

    test("should return false for dataset names with fewer than 2 qualifiers", () => {
      expect(isDatasetValue("DATASET")).toBe(false);
      expect(isDatasetValue("A")).toBe(false);
      expect(isDatasetValue("TEST123")).toBe(false);
    });

    test("should return false for dataset names with more than 5 qualifiers", () => {
      expect(isDatasetValue("A.B.C.D.E.F")).toBe(false);
      expect(isDatasetValue("USER.TEST.DATA.SET.LIB.EXTRA")).toBe(false);
      const maxQualifiers = "A.B.C.D.E.F.G.H.I.J.K.L.M.N.O.P.Q.R.S.T.U.V";
      expect(isDatasetValue(maxQualifiers)).toBe(false);
    });

    test("should return false for invalid dataset names", () => {
      // Lowercase letters
      expect(isDatasetValue("my.dataset.test.data")).toBe(false);
      expect(isDatasetValue("SYS1.proclib.test.data")).toBe(false);
      
      // Invalid characters (underscore, space, exclamation)
      expect(isDatasetValue("MY_DATA.SET.TEST.LIB")).toBe(false);
      expect(isDatasetValue("MY DATA.SET.TEST.LIB")).toBe(false);
      expect(isDatasetValue("MY!DATA.SET.TEST.LIB")).toBe(false);
      
      // Hyphen as first character (invalid)
      expect(isDatasetValue("-MYDATA.SET.TEST.LIB")).toBe(false);
      
      // Qualifier too long (>8 characters)
      expect(isDatasetValue("VERYLONGNAME.DATA.TEST.LIB")).toBe(false);
      expect(isDatasetValue("A.TOOLONGQUALIFIER.TEST.LIB")).toBe(false);
      
      // Empty or invalid
      expect(isDatasetValue("")).toBe(false);
      expect(isDatasetValue(".")).toBe(false);
      expect(isDatasetValue("..")).toBe(false);
      expect(isDatasetValue("A..B.C.D")).toBe(false);
      
      // Starting or ending with dot
      expect(isDatasetValue(".DATASET.TEST.DATA.LIB")).toBe(false);
      expect(isDatasetValue("DATASET.TEST.DATA.LIB.")).toBe(false);
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
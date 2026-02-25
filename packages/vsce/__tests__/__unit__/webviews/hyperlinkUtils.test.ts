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

import { isDatasetValue, isHyperlinkableValue, isUssPathValue } from "../../../src/webviews/resource-inspector-panel/utils/hyperlinkUtils";

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

  describe("isUssPathValue", () => {
    test("should return true for valid USS absolute paths", () => {
      expect(isUssPathValue("/u/user/file.txt")).toBe(true);
      expect(isUssPathValue("/var/log/app.log")).toBe(true);
      expect(isUssPathValue("/opt/app/config.xml")).toBe(true);
      expect(isUssPathValue("/home/user/data/file.dat")).toBe(true);
      expect(isUssPathValue("/etc/config")).toBe(true);
      expect(isUssPathValue("/tmp/test.tmp")).toBe(true);
    });

    test("should return true for USS paths with hyphens and underscores", () => {
      expect(isUssPathValue("/u/user-name/file_name.txt")).toBe(true);
      expect(isUssPathValue("/var/log-files/app_log.log")).toBe(true);
      expect(isUssPathValue("/opt/my-app/config_file.xml")).toBe(true);
      expect(isUssPathValue("/home/user_01/data-file.dat")).toBe(true);
    });

    test("should return true for USS paths with multiple directory levels", () => {
      expect(isUssPathValue("/a/b/c/d/e/f/g/file.txt")).toBe(true);
      expect(isUssPathValue("/u/cicsts/logs/DFHLOG01.txt")).toBe(true);
      expect(isUssPathValue("/var/cics/region1/logs/messages.log")).toBe(true);
    });

    test("should return true for USS paths without file extensions", () => {
      expect(isUssPathValue("/u/user/file")).toBe(true);
      expect(isUssPathValue("/var/log/messages")).toBe(true);
      expect(isUssPathValue("/etc/passwd")).toBe(true);
      expect(isUssPathValue("/bin/bash")).toBe(true);
    });

    test("should return true for USS paths with dots in filenames", () => {
      expect(isUssPathValue("/u/user/file.backup.txt")).toBe(true);
      expect(isUssPathValue("/var/log/app.2024.01.15.log")).toBe(true);
      expect(isUssPathValue("/opt/config.prod.xml")).toBe(true);
    });

    test("should return false for relative paths", () => {
      expect(isUssPathValue("relative/path/file.txt")).toBe(false);
      expect(isUssPathValue("./file.txt")).toBe(false);
      expect(isUssPathValue("../parent/file.txt")).toBe(false);
      expect(isUssPathValue("file.txt")).toBe(false);
    });

    test("should return false for Windows-style paths", () => {
      expect(isUssPathValue("C:\\Windows\\System32")).toBe(false);
      expect(isUssPathValue("D:\\Data\\file.txt")).toBe(false);
      expect(isUssPathValue("\\\\server\\share\\file")).toBe(false);
    });

    test("should return false for paths with invalid characters", () => {
      expect(isUssPathValue("/u/user/file with spaces.txt")).toBe(false);
      expect(isUssPathValue("/var/log/app@log.txt")).toBe(false);
      expect(isUssPathValue("/opt/config#file.xml")).toBe(false);
      expect(isUssPathValue("/home/user/file$name.dat")).toBe(false);
      expect(isUssPathValue("/tmp/file*name.tmp")).toBe(false);
    });

    test("should return false for empty or invalid paths", () => {
      expect(isUssPathValue("")).toBe(false);
      expect(isUssPathValue("/")).toBe(false);
      expect(isUssPathValue("//")).toBe(false);
      expect(isUssPathValue("/a//b")).toBe(false);
    });

    test("should return false for non-string values", () => {
      expect(isUssPathValue(null as any)).toBe(false);
      expect(isUssPathValue(undefined as any)).toBe(false);
      expect(isUssPathValue(123 as any)).toBe(false);
      expect(isUssPathValue({} as any)).toBe(false);
      expect(isUssPathValue([] as any)).toBe(false);
    });

    test("should return false for URLs or URIs", () => {
      expect(isUssPathValue("http://example.com/path")).toBe(false);
      expect(isUssPathValue("https://example.com/file.txt")).toBe(false);
      expect(isUssPathValue("ftp://server/file")).toBe(false);
      expect(isUssPathValue("file:///path/to/file")).toBe(false);
    });
  });
});
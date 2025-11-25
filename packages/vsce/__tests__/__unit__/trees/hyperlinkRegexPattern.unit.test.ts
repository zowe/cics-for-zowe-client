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

// Mock the vscode module to avoid acquireVsCodeApi error
jest.mock("../../../src/webviews/common/vscode", () => ({
  postVscMessage: jest.fn(),
  addVscMessageListener: jest.fn(),
  removeVscMessageListener: jest.fn(),
}));

import { isHyperlinkableValue } from "../../../src/webviews/resource-inspector-panel/utils/hyperlinkUtils";

describe("Hyperlink Regex Pattern Tests", () => {
  describe("//DD: pattern matching", () => {
    it("should return true for valid //DD: patterns", () => {
      expect(isHyperlinkableValue("//DD:SYSOUT")).toBe(true);
      expect(isHyperlinkableValue("//DD:JESMSGLG")).toBe(true);
      expect(isHyperlinkableValue("//DD:JESJCL")).toBe(true);
      expect(isHyperlinkableValue("//DD:JESYSMSG")).toBe(true);
      expect(isHyperlinkableValue("//DD:SYSPRINT")).toBe(true);
      expect(isHyperlinkableValue("//DD:SYSTSPRT")).toBe(true);
      expect(isHyperlinkableValue("//DD:CEEDUMP")).toBe(true);
      expect(isHyperlinkableValue("//DD:MYFILE123")).toBe(true);
      expect(isHyperlinkableValue("//DD:FILE_NAME")).toBe(true);
      expect(isHyperlinkableValue("//DD:OUTPUT")).toBe(true);
    });

    it("should return true for //DD: with special characters", () => {
      expect(isHyperlinkableValue("//DD:FILE@NAME")).toBe(true);
      expect(isHyperlinkableValue("//DD:FILE#NAME")).toBe(true);
      expect(isHyperlinkableValue("//DD:FILE$NAME")).toBe(true);
      expect(isHyperlinkableValue("//DD:FILE-NAME")).toBe(true);
      expect(isHyperlinkableValue("//DD:FILE.NAME")).toBe(true);
    });

    it("should return true for //DD: with dot-separated dataset names", () => {
      expect(isHyperlinkableValue("//DD:USER.PROD.DATA.OUTPUT")).toBe(true);
      expect(isHyperlinkableValue("//DD:MYUSER.TEST.DATASET")).toBe(true);
      expect(isHyperlinkableValue("//DD:SYS1.PROCLIB")).toBe(true);
      expect(isHyperlinkableValue("//DD:PROD.CICS.LOADLIB")).toBe(true);
      expect(isHyperlinkableValue("//DD:DEV.APP.CNTL")).toBe(true);
      expect(isHyperlinkableValue("//DD:FINANCE.PAYROLL.DATA.MASTER")).toBe(true);
    });

    it("should return false for invalid //DD: patterns", () => {
      expect(isHyperlinkableValue("//DD:")).toBe(false);
      expect(isHyperlinkableValue("//DD")).toBe(false);
      expect(isHyperlinkableValue("DD:SYSOUT")).toBe(false);
      expect(isHyperlinkableValue("/DD:SYSOUT")).toBe(false);
      expect(isHyperlinkableValue("///DD:SYSOUT")).toBe(false);
    });

    it("should return false for non-matching values", () => {
      expect(isHyperlinkableValue("")).toBe(false);
      expect(isHyperlinkableValue("SYSOUT")).toBe(false);
      expect(isHyperlinkableValue("some random text")).toBe(false);
      expect(isHyperlinkableValue("123456")).toBe(false);
      expect(isHyperlinkableValue("/path/to/file")).toBe(false);
      expect(isHyperlinkableValue("USER.PROD.DATA")).toBe(false);
    });

    it("should be case sensitive for //DD prefix", () => {
      expect(isHyperlinkableValue("//dd:SYSOUT")).toBe(false);
      expect(isHyperlinkableValue("//Dd:SYSOUT")).toBe(false);
      expect(isHyperlinkableValue("//DD:sysout")).toBe(true);
      expect(isHyperlinkableValue("//DD:user.prod.data")).toBe(true);
    });

    it("should not match //DD: with leading spaces", () => {
      expect(isHyperlinkableValue(" //DD:SYSOUT")).toBe(false);
      expect(isHyperlinkableValue("  //DD:SYSOUT")).toBe(false);
      expect(isHyperlinkableValue(" //DD:USER.PROD.DATA")).toBe(false);
    });

    it("should match //DD: with trailing content", () => {
      expect(isHyperlinkableValue("//DD:SYSOUT ")).toBe(true);
      expect(isHyperlinkableValue("//DD:SYSOUT extra")).toBe(true);
      expect(isHyperlinkableValue("//DD:USER.PROD.DATA extra")).toBe(true);
    });

    it("should not match //DD: in the middle of text", () => {
      expect(isHyperlinkableValue("text //DD:SYSOUT")).toBe(false);
      expect(isHyperlinkableValue("prefix//DD:SYSOUT")).toBe(false);
      expect(isHyperlinkableValue("text //DD:USER.DATA")).toBe(false);
    });

    it("should handle multiline strings", () => {
      expect(isHyperlinkableValue("//DD:SYSOUT\nmore text")).toBe(true);
      expect(isHyperlinkableValue("text\n//DD:SYSOUT")).toBe(false);
      expect(isHyperlinkableValue("//DD:USER.PROD.DATA\nmore")).toBe(true);
    });

    it("should match //DD: with mixed case in dataset names", () => {
      expect(isHyperlinkableValue("//DD:SysOut")).toBe(true);
      expect(isHyperlinkableValue("//DD:SYSOUT")).toBe(true);
      expect(isHyperlinkableValue("//DD:sysout")).toBe(true);
      expect(isHyperlinkableValue("//DD:MyUser.Prod.DataSet")).toBe(true);
    });

    it("should match //DD: with complex qualified dataset names", () => {
      expect(isHyperlinkableValue("//DD:PROD.PAYROLL.MASTER.DATA")).toBe(true);
      expect(isHyperlinkableValue("//DD:SYS1.LINKLIB")).toBe(true);
      expect(isHyperlinkableValue("//DD:FINANCE.APP.CNTL")).toBe(true);
      expect(isHyperlinkableValue("//DD:DEV.CICS.REGION1.LOADLIB")).toBe(true);
    });
  });
});

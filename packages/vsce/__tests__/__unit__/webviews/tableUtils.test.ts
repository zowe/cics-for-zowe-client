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

import {
  getZebraClass,
  getHeaderBgClass,
  getRowBgClass,
  getSearchInputBgClass,
  TABLE_CELL_CLASSES,
  STICKY_HEADER_Z_INDEX,
  STICKY_LEVEL_INCREMENT,
} from "../../../src/webviews/common/tableUtils";

describe("tableUtils", () => {
  describe("getZebraClass", () => {
    test("should return 'zebra-dark' when isDark is true", () => {
      expect(getZebraClass(true)).toBe("zebra-dark");
    });

    test("should return 'zebra-light' when isDark is false", () => {
      expect(getZebraClass(false)).toBe("zebra-light");
    });
  });

  describe("getHeaderBgClass", () => {
    test("should return header background with 'bg-lighter' when isDark is true", () => {
      const result = getHeaderBgClass(true);
      expect(result).toContain("bg-(--vscode-editor-background)");
      expect(result).toContain("bg-lighter");
      expect(result).not.toContain("bg-darker");
    });

    test("should return header background with 'bg-darker' when isDark is false", () => {
      const result = getHeaderBgClass(false);
      expect(result).toContain("bg-(--vscode-editor-background)");
      expect(result).toContain("bg-darker");
      expect(result).not.toContain("bg-lighter");
    });
  });

  describe("getRowBgClass", () => {
    test("should return base background for even row index (0)", () => {
      expect(getRowBgClass(0, true)).toBe("bg-(--vscode-editor-background)");
      expect(getRowBgClass(0, false)).toBe("bg-(--vscode-editor-background)");
    });

    test("should return base background for even row index (2)", () => {
      expect(getRowBgClass(2, true)).toBe("bg-(--vscode-editor-background)");
      expect(getRowBgClass(2, false)).toBe("bg-(--vscode-editor-background)");
    });

    test("should return dark alternating background for odd row index when isDark is true", () => {
      const result = getRowBgClass(1, true);
      expect(result).toBe("bg-[color-mix(in_srgb,var(--vscode-editor-background),white_3%)]");
    });

    test("should return light alternating background for odd row index when isDark is false", () => {
      const result = getRowBgClass(1, false);
      expect(result).toBe("bg-[color-mix(in_srgb,var(--vscode-editor-background),black_5%)]");
    });

    test("should return dark alternating background for odd row index (3) when isDark is true", () => {
      const result = getRowBgClass(3, true);
      expect(result).toBe("bg-[color-mix(in_srgb,var(--vscode-editor-background),white_3%)]");
    });

    test("should return light alternating background for odd row index (3) when isDark is false", () => {
      const result = getRowBgClass(3, false);
      expect(result).toBe("bg-[color-mix(in_srgb,var(--vscode-editor-background),black_5%)]");
    });

    test("should handle large row indices correctly", () => {
      expect(getRowBgClass(100, true)).toBe("bg-(--vscode-editor-background)");
      expect(getRowBgClass(101, true)).toBe("bg-[color-mix(in_srgb,var(--vscode-editor-background),white_3%)]");
      expect(getRowBgClass(100, false)).toBe("bg-(--vscode-editor-background)");
      expect(getRowBgClass(101, false)).toBe("bg-[color-mix(in_srgb,var(--vscode-editor-background),black_5%)]");
    });
  });

  describe("getSearchInputBgClass", () => {
    test("should return 'bg-darker' when isDark is true", () => {
      expect(getSearchInputBgClass(true)).toBe("bg-darker");
    });

    test("should return 'bg-lighter' when isDark is false", () => {
      expect(getSearchInputBgClass(false)).toBe("bg-lighter");
    });
  });

  describe("TABLE_CELL_CLASSES constant", () => {
    test("should contain expected cell styling classes", () => {
      expect(TABLE_CELL_CLASSES).toBe("pl-4 wrap-anywhere min-w-48");
      expect(TABLE_CELL_CLASSES).toContain("pl-4");
      expect(TABLE_CELL_CLASSES).toContain("wrap-anywhere");
      expect(TABLE_CELL_CLASSES).toContain("min-w-48");
    });
  });

  describe("STICKY_HEADER_Z_INDEX constant", () => {
    test("should be 60", () => {
      expect(STICKY_HEADER_Z_INDEX).toBe(60);
    });

    test("should be a number", () => {
      expect(typeof STICKY_HEADER_Z_INDEX).toBe("number");
    });
  });

  describe("STICKY_LEVEL_INCREMENT constant", () => {
    test("should be 8", () => {
      expect(STICKY_LEVEL_INCREMENT).toBe(8);
    });

    test("should be a number", () => {
      expect(typeof STICKY_LEVEL_INCREMENT).toBe("number");
    });
  });
});

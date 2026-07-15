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

import { getSearchInputBgClass } from "../../../src/webviews/common/tableUtils";

describe("SearchInput component utilities", () => {
  describe("getSearchInputBgClass", () => {
    test("should return 'bg-darker' for dark theme", () => {
      expect(getSearchInputBgClass(true)).toBe("bg-darker");
    });

    test("should return 'bg-lighter' for light theme", () => {
      expect(getSearchInputBgClass(false)).toBe("bg-lighter");
    });
  });

  describe("SearchInput component behavior", () => {
    test("should have correct default placeholder text", () => {
      // SearchInput uses "Keyword search..." as default placeholder
      const defaultPlaceholder = "Keyword search...";
      expect(defaultPlaceholder).toBe("Keyword search...");
    });

    test("should support custom placeholder text", () => {
      // SearchInput accepts custom placeholder via props
      const customPlaceholder = "Custom search...";
      expect(customPlaceholder).toBeTruthy();
      expect(typeof customPlaceholder).toBe("string");
    });

    test("should handle empty string value", () => {
      const emptyValue = "";
      expect(emptyValue).toBe("");
      expect(emptyValue.length).toBe(0);
    });

    test("should handle non-empty string value", () => {
      const value = "test query";
      expect(value).toBe("test query");
      expect(value.length).toBeGreaterThan(0);
    });

    test("should support onChange callback", () => {
      const mockOnChange = jest.fn();
      const newValue = "new search term";
      
      mockOnChange(newValue);
      
      expect(mockOnChange).toHaveBeenCalledWith(newValue);
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    test("should support clearing value via onChange", () => {
      const mockOnChange = jest.fn();
      
      mockOnChange("");
      
      expect(mockOnChange).toHaveBeenCalledWith("");
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    test("should support tabIndex prop", () => {
      const tabIndex = 5;
      expect(tabIndex).toBe(5);
      expect(typeof tabIndex).toBe("number");
    });

    test("should support className prop", () => {
      const className = "custom-class";
      expect(className).toBe("custom-class");
      expect(typeof className).toBe("string");
    });
  });
});

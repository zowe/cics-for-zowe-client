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

import { getFolderIcon, getIconFilePathFromName } from "../../../src/utils/iconUtils";

const iconPath = {
  light: "program-dark.svg",
  dark: "program-light.svg",
};

describe("Test suite for iconUtils", () => {
  describe("Test suite for getIconPathResources", () => {
    it("Should return icon path for dark and light theme", () => {
      const result = getIconFilePathFromName("program");
      expect(result.dark).toContain(iconPath.dark);
      expect(result.light).toContain(iconPath.light);
    });
  });

  describe("Test suite for getFolderIcon", () => {
    it("Should return icon path for folder open when true", () => {
      const result = getFolderIcon(true);
      expect(result.dark).toContain("folder-open-light");
      expect(result.light).toContain("folder-open-dark");
    });
    it("Should return icon path for folder closed when false", () => {
      const result = getFolderIcon(false);
      expect(result.dark).toContain("folder-closed-light");
      expect(result.light).toContain("folder-closed-dark");
    });
  });
});

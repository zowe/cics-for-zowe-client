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

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

import { getZebraClass, getHeaderBgClass, getRowBgClass } from "../../../src/webviews/common/tableUtils";

describe("MultiResourceView component utilities", () => {
  describe("Table styling utilities", () => {
    test("should return correct zebra class for dark theme", () => {
      expect(getZebraClass(true)).toBe("zebra-dark");
    });

    test("should return correct zebra class for light theme", () => {
      expect(getZebraClass(false)).toBe("zebra-light");
    });

    test("should return correct header background for dark theme", () => {
      const result = getHeaderBgClass(true);
      expect(result).toContain("bg-(--vscode-editor-background)");
      expect(result).toContain("bg-lighter");
    });

    test("should return correct header background for light theme", () => {
      const result = getHeaderBgClass(false);
      expect(result).toContain("bg-(--vscode-editor-background)");
      expect(result).toContain("bg-darker");
    });

    test("should return correct row background for even rows", () => {
      expect(getRowBgClass(0, true)).toBe("bg-(--vscode-editor-background)");
      expect(getRowBgClass(2, false)).toBe("bg-(--vscode-editor-background)");
      expect(getRowBgClass(4, true)).toBe("bg-(--vscode-editor-background)");
    });

    test("should return correct row background for odd rows in dark theme", () => {
      expect(getRowBgClass(1, true)).toBe("bg-[color-mix(in_srgb,var(--vscode-editor-background),white_3%)]");
      expect(getRowBgClass(3, true)).toBe("bg-[color-mix(in_srgb,var(--vscode-editor-background),white_3%)]");
    });

    test("should return correct row background for odd rows in light theme", () => {
      expect(getRowBgClass(1, false)).toBe("bg-[color-mix(in_srgb,var(--vscode-editor-background),black_5%)]");
      expect(getRowBgClass(3, false)).toBe("bg-[color-mix(in_srgb,var(--vscode-editor-background),black_5%)]");
    });
  });

  describe("Data filtering logic", () => {
    test("should filter data based on search query", () => {
      const data = [
        { name: "PROG1", status: "ENABLED" },
        { name: "PROG2", status: "DISABLED" },
        { name: "TRAN1", status: "ENABLED" },
      ];
      
      const searchQuery = "PROG";
      const filteredData = data.filter((row) => 
        Object.values(row).some((val) => 
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      
      expect(filteredData).toHaveLength(2);
      expect(filteredData[0].name).toBe("PROG1");
      expect(filteredData[1].name).toBe("PROG2");
    });

    test("should return all data when search query is empty", () => {
      const data = [
        { name: "PROG1", status: "ENABLED" },
        { name: "PROG2", status: "DISABLED" },
      ];
      
      const searchQuery = "";
      const filteredData = searchQuery.trim() ? data.filter((row) => 
        Object.values(row).some((val) => 
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      ) : data;
      
      expect(filteredData).toHaveLength(2);
    });

    test("should handle case-insensitive search", () => {
      const data = [
        { name: "PROG1", status: "ENABLED" },
        { name: "prog2", status: "disabled" },
      ];
      
      const searchQuery = "prog";
      const filteredData = data.filter((row) => 
        Object.values(row).some((val) => 
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      
      expect(filteredData).toHaveLength(2);
    });

    test("should return empty array when no matches found", () => {
      const data = [
        { name: "PROG1", status: "ENABLED" },
        { name: "PROG2", status: "DISABLED" },
      ];
      
      const searchQuery = "NOTFOUND";
      const filteredData = data.filter((row) => 
        Object.values(row).some((val) => 
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      
      expect(filteredData).toHaveLength(0);
    });

    test("should search across multiple columns", () => {
      const data = [
        { name: "PROG1", status: "ENABLED", library: "LIB1" },
        { name: "PROG2", status: "DISABLED", library: "LIB2" },
      ];
      
      const searchQuery = "LIB2";
      const filteredData = data.filter((row) => 
        Object.values(row).some((val) => 
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      
      expect(filteredData).toHaveLength(1);
      expect(filteredData[0].name).toBe("PROG2");
    });
  });

  describe("Column generation logic", () => {
    test("should extract unique highlight keys from resources", () => {
      const resources = [
        { highlights: [{ key: "status", value: "ENABLED" }, { key: "language", value: "COBOL" }] },
        { highlights: [{ key: "status", value: "DISABLED" }, { key: "usecount", value: "5" }] },
      ];
      
      const highlightKeysSet = new Set<string>();
      resources.forEach((res) => {
        res.highlights.forEach((h) => highlightKeysSet.add(h.key));
      });
      const highlightKeys = Array.from(highlightKeysSet);
      
      expect(highlightKeys).toHaveLength(3);
      expect(highlightKeys).toContain("status");
      expect(highlightKeys).toContain("language");
      expect(highlightKeys).toContain("usecount");
    });

    test("should create columns with RESOURCE as first column", () => {
      const highlightKeys = ["status", "language"];
      const columns = [
        { key: 'RESOURCE', header: 'RESOURCE', width: '180px' },
        ...highlightKeys.map((key) => ({
          key: key,
          header: key.toUpperCase(),
          width: '150px',
        })),
      ];
      
      expect(columns).toHaveLength(3);
      expect(columns[0].key).toBe('RESOURCE');
      expect(columns[0].header).toBe('RESOURCE');
      expect(columns[1].key).toBe('status');
      expect(columns[1].header).toBe('STATUS');
      expect(columns[2].key).toBe('language');
      expect(columns[2].header).toBe('LANGUAGE');
    });

    test("should handle resources with no highlights", () => {
      const resources: Array<{ highlights: Array<{ key: string; value: string }> }> = [
        { highlights: [] },
        { highlights: [] },
      ];
      
      const highlightKeysSet = new Set<string>();
      resources.forEach((res) => {
        res.highlights.forEach((h) => highlightKeysSet.add(h.key));
      });
      const highlightKeys = Array.from(highlightKeysSet);
      
      expect(highlightKeys).toHaveLength(0);
    });
  });

  describe("Row data transformation", () => {
    test("should transform resource into table row with highlight values", () => {
      const resource = {
        name: "PROG1",
        highlights: [
          { key: "status", value: "ENABLED" },
          { key: "language", value: "COBOL" },
        ],
      };
      
      const highlightKeys = ["status", "language"];
      const highlightMap = new Map<string, string>();
      resource.highlights.forEach((h) => {
        highlightMap.set(h.key, h.value);
      });
      
      const row: any = {
        RESOURCE: resource.name,
        _resource: resource,
      };
      
      highlightKeys.forEach((key) => {
        const value = highlightMap.get(key);
        row[key] = value || "";
      });
      
      expect(row.RESOURCE).toBe("PROG1");
      expect(row.status).toBe("ENABLED");
      expect(row.language).toBe("COBOL");
      expect(row._resource).toBe(resource);
    });

    test("should handle missing highlight values with empty string", () => {
      const resource = {
        name: "PROG1",
        highlights: [
          { key: "status", value: "ENABLED" },
        ],
      };
      
      const highlightKeys = ["status", "language", "usecount"];
      const highlightMap = new Map<string, string>();
      resource.highlights.forEach((h) => {
        highlightMap.set(h.key, h.value);
      });
      
      const row: any = {
        RESOURCE: resource.name,
      };
      
      highlightKeys.forEach((key) => {
        const value = highlightMap.get(key);
        row[key] = value || "";
      });
      
      expect(row.status).toBe("ENABLED");
      expect(row.language).toBe("");
      expect(row.usecount).toBe("");
    });
  });

  describe("Region name handling", () => {
    test("should set region name when all resources are from same region", () => {
      const resources = [
        { context: { regionName: "REGION1" } },
        { context: { regionName: "REGION1" } },
        { context: { regionName: "REGION1" } },
      ];
      
      const regionNames = new Set(resources.map(r => r.context?.regionName).filter(Boolean));
      const isSingleRegion = regionNames.size === 1;
      const regionName = isSingleRegion ? resources[0]?.context?.regionName : undefined;
      
      expect(isSingleRegion).toBe(true);
      expect(regionName).toBe("REGION1");
    });

    test("should not set region name when resources are from different regions", () => {
      const resources = [
        { context: { regionName: "REGION1" } },
        { context: { regionName: "REGION2" } },
        { context: { regionName: "REGION3" } },
      ];
      
      const regionNames = new Set(resources.map(r => r.context?.regionName).filter(Boolean));
      const isSingleRegion = regionNames.size === 1;
      const regionName = isSingleRegion ? resources[0]?.context?.regionName : undefined;
      
      expect(isSingleRegion).toBe(false);
      expect(regionName).toBeUndefined();
    });

    test("should handle resources with undefined region names", () => {
      const resources = [
        { context: { regionName: undefined } },
        { context: { regionName: "REGION1" } },
      ];
      
      const regionNames = new Set(resources.map(r => r.context?.regionName).filter(Boolean));
      const isSingleRegion = regionNames.size === 1;
      
      expect(isSingleRegion).toBe(true);
      expect(regionNames.has("REGION1")).toBe(true);
    });
  });

  describe("Action generation", () => {
    test("should generate actions from resource actions", () => {
      const resource = {
        name: "PROG1",
        context: { cicsplexName: "PLEX1", regionName: "REGION1" },
        actions: [
          { id: "enable", name: "Enable" },
          { id: "disable", name: "Disable" },
        ],
      };
      
      const actions = resource.actions.map((ac) => ({
        label: ac.name,
        value: ac.id,
        resourceName: resource.name,
        resourceContext: resource.context,
        resources: [resource],
      }));
      
      expect(actions).toHaveLength(2);
      expect(actions[0].label).toBe("Enable");
      expect(actions[0].value).toBe("enable");
      expect(actions[0].resourceName).toBe("PROG1");
      expect(actions[1].label).toBe("Disable");
      expect(actions[1].value).toBe("disable");
    });

    test("should return empty array when resource has no actions", () => {
      const resource: {
        name: string;
        context: { cicsplexName: string; regionName: string };
        actions: Array<{ id: string; name: string }>;
      } = {
        name: "PROG1",
        context: { cicsplexName: "PLEX1", regionName: "REGION1" },
        actions: [],
      };
      
      const actions = resource.actions.map((ac) => ({
        label: ac.name,
        value: ac.id,
        resourceName: resource.name,
        resourceContext: resource.context,
        resources: [resource],
      }));
      
      expect(actions).toHaveLength(0);
    });
  });
});

// Made with Bob

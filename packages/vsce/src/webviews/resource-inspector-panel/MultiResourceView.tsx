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

import { type JSX, useEffect, useMemo, useState } from "react";
import { type IResourceInspectorResource, postVscMessage } from "../common/vscode";
import { ContextMenu } from "./Contextmenu";
import { renderHyperlinkableValue } from "./utils/hyperlinkUtils";
import { useTheme } from "../common/ThemeContext";
import { Breadcrumb } from "./Breadcrumb";
import { RefreshButton } from "../common/RefreshButton";
import { SearchInput } from "../common/SearchInput";
import { getZebraClass, getHeaderBgClass, getRowBgClass } from "../common/tableUtils";


interface Column<T> {
  key: keyof T;
  header: string;
  width?: string;
}

interface TableProps<T extends Record<string, any>> {
  data: T[];
  columns: Column<T>[];
  searchQuery: string;
  getRowActions?: (row: T, index: number) => Array<{
    label: string;
    value: string;
    resourceName: string;
    resourceContext: IResourceInspectorResource['context'];
    resources: IResourceInspectorResource[];
  }>;
}

function ResourceTable<T extends Record<string, any>>({
  data,
  columns,
  searchQuery,
  getRowActions,
}: TableProps<T>) {
  const { isDark } = useTheme();

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return data;
    }
    const query = searchQuery.toLowerCase();
    // Cache string representations to avoid repeated conversions
    const rowStrings = data.map((row) =>
      columns.map((col) => String(row[col.key]).toLowerCase()).join(' ')
    );
    return data.filter((_, index) => rowStrings[index].includes(query));
  }, [data, columns, searchQuery]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Scrollable Table Container */}
      <div className="overflow-x-auto overflow-y-auto w-full flex-1">
        <table className="border-collapse w-full text-xs min-w-7xl">
          <thead>
            <tr className={`text-left ${getHeaderBgClass(isDark)} h-8 sticky top-0 z-20`}>
              {/* First column - sticky left */}
              <th
                className={`text-left pl-2 pr-2 font-normal ${getHeaderBgClass(isDark)} sticky left-0 z-25`}
                style={{
                  minWidth: columns[0]?.width || '9rem',
                  boxShadow: 'inset -3px 0 3px -3px rgba(0,0,0,0.15)'
                }}
              >
                <span>{columns[0]?.header}</span>
              </th>

              {/* Middle columns */}
              {columns.slice(1).map((col) => (
                <th
                  key={String(col.key)}
                  className={`text-left pl-2 pr-2 font-normal ${getHeaderBgClass(isDark)} z-20`}
                  style={{
                    minWidth: col.width || '8rem'
                  }}
                >
                  <span>{col.header}</span>
                </th>
              ))}

              {/* Actions column - sticky right */}
              <th
                className={`text-center pl-2 pr-2 font-normal ${getHeaderBgClass(isDark)} sticky right-0 z-25 w-16`}
                style={{
                  boxShadow: 'inset 3px 0 3px -3px rgba(0,0,0,0.15)'
                }}
              >
                <span></span>
              </th>
            </tr>
          </thead>

          <tbody className="text-left">
            {filteredData.map((row, rowIndex) => (
              <tr key={rowIndex} className={`h-8 ${getZebraClass(isDark)}`}>
                {/* First column - sticky left */}
                <td
                  className={
                    `pl-2 pr-2 max-w-48 sticky left-0 overflow-hidden text-ellipsis whitespace-nowrap ${getRowBgClass(rowIndex, isDark)} z-10`
                  }
                  style={{
                    boxShadow: 'inset -3px 0 3px -3px rgba(0,0,0,0.15)'
                  }}
                  title={String(row[columns[0].key])}
                >
                  {String(row[columns[0].key])}
                </td>

                {/* Middle columns */}
                {columns.slice(1).map((col) => (
                  <td
                    key={String(col.key)}
                    className="pl-2 pr-2 max-w-48 overflow-hidden text-ellipsis whitespace-nowrap z-1"
                    title={String(row[col.key])}
                  >
                    {String(row[col.key])}
                  </td>
                ))}

                {/* Actions column - sticky right */}
                <td
                  className={`px-2 sticky right-0 ${getRowBgClass(rowIndex, isDark)} z-10`}
                  style={{
                    boxShadow: 'inset 3px 0 3px -3px rgba(0,0,0,0.15)'
                  }}
                >
                  <div className="flex items-center justify-center">
                    {(() => {
                      const actions = getRowActions ? getRowActions(row, rowIndex) : [];
                      return actions.length > 0 && <ContextMenu tabIndex={rowIndex + 1} data={actions} />;
                    })()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="p-10 text-center text-(--vscode-disabledForeground)">
            No results found
          </div>
        )}
      </div>
    </div>
  );
}

// Transform resources into table data
type TableRow = Record<string, string | JSX.Element> & {
  RESOURCE: string;
  _resource: IResourceInspectorResource;
};

const MultiResourceView = ({ resources }: { resources: IResourceInspectorResource[];  }) => {

  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [cicsplexName, setCicsplexName] = useState<string | undefined>(undefined);
  const [regionName, setRegionName] = useState<string | undefined>(undefined);
  const [resourceType, setResourceType] = useState<string | undefined>(undefined);

  const [data, setData] = useState<TableRow[]>([]);
  const [columns, setColumns] = useState<Column<any>[]>([]);

  const handleRefresh = () => {
    postVscMessage({
      type: "refresh",
      resources,
    });
  };

  useEffect(() => {
    // Get all unique highlight keys from all resources
    const highlightKeysSet = new Set<string>();
    resources.forEach((res) => {
      res.highlights.forEach((h) => highlightKeysSet.add(h.key));
    });
    const highlightKeys = Array.from(highlightKeysSet);

    // Create columns: RESOURCE column + highlight attribute columns
    setColumns([
      { key: 'RESOURCE', header: 'RESOURCE', width: '180px' },
      ...highlightKeys.map((key) => ({
        key: key,
        header: key.toUpperCase(),
        width: '150px',
      })),
    ] as Column<any>[]);

    setData(resources.map((res) => {
      // Create a map of highlight key to value for this resource
      const highlightMap = new Map<string, string>();
      res.highlights.forEach((h) => {
        highlightMap.set(h.key, h.value);
      });

      // Build row object with resource name + highlight values
      const row: TableRow = {
        RESOURCE: res.name,
        _resource: res,
      } as TableRow;

      highlightKeys.forEach((key) => {
        const value = highlightMap.get(key);
        row[key] = value ? renderHyperlinkableValue(value, res.context) : "";
      });

      return row;
    }));

    setResourceType(resources[0]?.meta?.humanReadableNamePlural || "Resources");
    setCicsplexName(resources[0]?.context?.cicsplexName);

    const regionNames = new Set(resources.map(r => r.context?.regionName).filter(Boolean));
    const isSingleRegion = regionNames.size === 1;
    setRegionName(isSingleRegion ? resources[0]?.context?.regionName : undefined);
    
  }, [resources]);

  if (!resources || resources.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className={`sticky top-2 w-full ${getHeaderBgClass(isDark)} z-50 px-2 h-8 flex items-center justify-between`}
      >
        <Breadcrumb
          cicsplexName={cicsplexName}
          regionName={regionName}
          resourceType={resourceType}
          tabIndex={1}
          showContextMenu={false}
        />

        <div className="flex items-center gap-2">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            tabIndex={2}
          />
          <RefreshButton onClick={handleRefresh} tabIndex={3} />
        </div>
      </div>

      <div className="w-full" style={{ height: 'calc(100vh - 2.5rem)' }}>
        <ResourceTable
          data={data}
          columns={columns}
          searchQuery={searchQuery}
          getRowActions={(row) => {
            const resource = row._resource;
            if (!resource.actions || resource.actions.length === 0) {
              return [];
            }
            return resource.actions.map((ac) => ({
              label: ac.name,
              value: ac.id,
              resourceName: resource.name || "",
              resourceContext: resource.context,
              resources: [resource],
            }));
          }}
        />
      </div>
    </>
  );
};

export default MultiResourceView;

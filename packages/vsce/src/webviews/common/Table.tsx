import React = require("react");

import { IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { MenuButton, RefreshButton } from "./Breadcrumb";
import { IResourceInspectorResource } from "./vscode";

interface ITableProps {
  headers: (string | React.JSX.Element)[];
  rows: string[][];
  highlightDifferences?: boolean;
  refresh?: () => void;
  stickyLevel?: number;
  menuData?: { label: string; value: string; resourceName: string; resourceContext: IResourceContext; resources: IResourceInspectorResource[]; }[];
}

const Table = ({ headers, rows, highlightDifferences = false, refresh = undefined, stickyLevel = 0, menuData = undefined }: ITableProps) => {

  const [showHiddenRows, setShowHiddenRows] = React.useState(false);
  const [filterValue, setFilterValue] = React.useState("");

  const valuesDiffer = (vals: string[]) => {
    // Array -> Set -> Array = removes duplicates
    return [...new Set(vals.map((v) => v.trim().toUpperCase()))].length > 1;
  };

  return (
    <table className={`border-collapse border-spacing-4 w-full ${highlightDifferences ? "table-fixed" : ""}`}>
      <thead>
        <tr className={`text-left bg-(--vscode-panel-border) h-8 sticky top-${stickyLevel * 8}`}>
          {headers.map((hder, idx: number) => {
            return (
              <th key={`th-${idx}`} className={`text-left px-2 font-normal first:w-32 lg:first:w-42`}>
                <span>{hder}</span>
              </th>
            );
          })}
          <th>
            <div className="flex gap-1 md:gap-2 xl:gap-4 items-center justify-end px-1">
              <div className="flex gap-2 items-center">
                {refresh && (
                  <RefreshButton onClick={refresh} />
                )}
                {menuData && (
                  <MenuButton data={menuData} />
                )}
              </div>
              <div className="relative flex items-center">
                <input
                  className="w-48 lg:w-64 bg-(--vscode-panel-background) pl-2 pr-6 h-6 placeholder:text-(--vscode-disabledForeground) font-normal"
                  placeholder="Keyword search..."
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                />
                <span className={`absolute right-1 cursor-pointer codicon codicon-close`} onClick={() => setFilterValue("")} />
              </div>
            </div>
          </th>
        </tr>
      </thead>
      <tbody className="text-left">
        {rows?.filter((rw) => rw.join("").toUpperCase().includes(filterValue.toUpperCase().trim()) && (!highlightDifferences ? true : valuesDiffer(rw.slice(1)))).map((row, idx: number) => (
          <tr key={`1-tr-${idx}`} className={`even:bg-(--vscode-tab-activeBackground) h-8`}>
            {row.map((txt, idx) => (
              <td key={`1-td-${idx}`} title={txt} className="pl-4 wrap-anywhere min-w-48">{txt}</td>
            ))}
            <td></td>
          </tr>
        ))}
        {highlightDifferences && (
          <tr className="border-b-2 border-(--vscode-tab-activeBackground) sticky top-8 bg-(--vscode-panel-background) h-8">
            <td></td>
            <td></td>
            <td></td>
            <td
              className="flex justify-end items-center h-8">
              <button
                className="flex items-center cursor-pointer gap-1 text-(--vscode-disabledForeground)"
                onClick={() => setShowHiddenRows(!showHiddenRows)}
              >
                <span>{showHiddenRows ? "Hide" : "Show"} shared attributes</span>
                <span className={`codicon codicon-chevron-${showHiddenRows ? "up" : "down"}`} />
              </button>
            </td>
          </tr>
        )}
        {highlightDifferences && showHiddenRows && rows?.filter((rw) => rw.join("").toUpperCase().includes(filterValue.toUpperCase().trim()) && !valuesDiffer(rw.slice(1))).map((row, idx: number) => (
          <tr key={`2-tr-${idx}`} className={`even:bg-(--vscode-tab-activeBackground) h-8`}>
            {row.map((txt, idx) => (
              <td key={`2-td-${idx}`} title={txt} className="pl-4 wrap-anywhere min-w-48">{txt}</td>
            ))}
            <td></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;

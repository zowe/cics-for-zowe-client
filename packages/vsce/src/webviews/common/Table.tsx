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

import { IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { createContext, JSX, useContext, useState } from "react";
import { ContextMenu } from "../resource-inspector-panel/Contextmenu";
import { RefreshButton } from "./RefreshButton";
import { IResourceInspectorResource } from "./vscode";

interface ITableProps {
  headers: (string | JSX.Element)[];
  rows: (string | JSX.Element)[][];
  highlightDifferences?: boolean;
  refresh?: () => void;
  stickyLevel?: number;
  menuData?: { label: string; value: string; resourceName: string; resourceContext: IResourceContext; resources: IResourceInspectorResource[]; }[];
  className?: string;
}

const TableSearchContext = createContext<{ filterValue: string; setFilterValue: (s: string) => void; }>({
  filterValue: "",
  setFilterValue: () => { },
});

const Table = ({ headers, rows, highlightDifferences = false, refresh = undefined, stickyLevel = 0, menuData = undefined, className = "" }: ITableProps) => {

  const [showHiddenRows, setShowHiddenRows] = useState(false);
  const [filterValue, setFilterValue] = useState("");

  const valuesDiffer = (vals: (string | JSX.Element)[]) => {
    // Array -> Set -> Array = removes duplicates
    return [...new Set(vals.map((v) => v.toString().trim().toUpperCase()))].length > 1;
  };

  const filterSearchCriteria = (rw: (string | JSX.Element)[]) => {
    return rw.join("").toUpperCase().includes(filterValue.toUpperCase().trim());
  };
  const filterDifferingValues = (rw: (string | JSX.Element)[]) => {
    return highlightDifferences ? valuesDiffer(rw.slice(1)) : true;
  };

  return (
    <table className={`${className} border-collapse border-spacing-4 w-full`}>
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
                  <ContextMenu data={menuData} />
                )}
              </div>
              <TableSearchContext value={{ filterValue, setFilterValue }}>
                <TableSearchInput />
              </TableSearchContext>
            </div>
          </th>
        </tr>
      </thead>
      <tbody className="text-left">
        {rows?.filter(filterSearchCriteria)
          .filter(filterDifferingValues)
          .map((row, idx: number) =>
            <TableRow row={row} idx={idx} />
          )}

        {highlightDifferences && (
          <>
            <ShowHiddenAttributesRow showHiddenRows={showHiddenRows} setShowHiddenRows={setShowHiddenRows} />

            {showHiddenRows &&
              rows?.filter(filterSearchCriteria)
                .filter((rw) => !valuesDiffer(rw.slice(1)))
                .map((row, idx: number) =>
                  <TableRow row={row} idx={idx} />
                )}
          </>
        )}
      </tbody>
    </table>
  );
};

const TableSearchInput = () => {

  const { filterValue, setFilterValue } = useContext(TableSearchContext);

  return (
    <div className="relative flex items-center">
      <input
        className="w-36 md:w-42 lg:w-64 bg-(--vscode-panel-background) pl-2 pr-6 h-6 placeholder:text-(--vscode-disabledForeground) font-normal"
        placeholder="Keyword search..."
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
      />
      <span className={`absolute right-1 cursor-pointer codicon codicon-close`} onClick={() => setFilterValue("")} />
    </div>
  );
};

const TableRow = ({ row, idx }: { row: (string | JSX.Element)[]; idx: number; }) => {
  return (
    <tr key={`tr-${idx}`} className={`even:bg-(--vscode-tab-activeBackground) h-8`}>
      {row.map((txt, idx) => (
        <td key={`td-${idx}`} title={txt.toString()} className="pl-4 wrap-anywhere min-w-48">{txt}</td>
      ))}
      <td></td>
    </tr>
  );
};

const ShowHiddenAttributesRow = ({ showHiddenRows, setShowHiddenRows }: { showHiddenRows: boolean; setShowHiddenRows: (b: boolean) => void; }) => {
  return (
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
  );
};

export default Table;

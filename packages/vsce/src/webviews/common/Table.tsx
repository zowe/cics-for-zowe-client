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

import { createContext, JSX, useContext, useEffect, useState } from "react";
import { useTheme } from "./ThemeContext";

interface ITableProps {
  headers: (string | JSX.Element)[];
  rows: (string | JSX.Element)[][];
  stickyLevel?: number;
  className?: string;
  headerActions?: JSX.Element;
  customRows?: (filterValue: string) => JSX.Element;
  searchTabIndex?: number;
}

const TableSearchContext = createContext<{ filterValue: string; setFilterValue: (s: string) => void; }>({
  filterValue: "",
  setFilterValue: () => { },
});

export { TableSearchContext };

const Table = ({ headers, rows, stickyLevel = 0, className = "", headerActions, customRows, searchTabIndex }: ITableProps) => {
  const { isDark } = useTheme();
  const [filterValue, setFilterValue] = useState("");

  useEffect(() => {
    setFilterValue("");
  }, [rows]);

  const filterSearchCriteria = (rw: (string | JSX.Element)[]) => {
    return rw.join("").toUpperCase().includes(filterValue.toUpperCase().trim());
  };

  return (
    <table className={`${className} border-collapse border-spacing-4 w-full text-xs`}>
      <thead>
        <tr className={`text-left bg-(--vscode-editor-background) ${isDark ? "bg-lighter" : "bg-darker"} h-8 sticky top-${(stickyLevel * 8) + 2}`} style={{ zIndex: 60 }}>
          {headers.map((hder, idx: number) => {
            return (
              <th key={`th-${idx}`} className={`text-left px-2 font-normal first:w-32 lg:first:w-42`}>
                <span>{hder}</span>
              </th>
            );
          })}
          <th>
            <div className="flex gap-1 md:gap-2 xl:gap-4 items-center justify-end px-1">
              {headerActions}
              <TableSearchContext value={{ filterValue, setFilterValue }}>
                <TableSearchInput tabIndex={searchTabIndex} />
              </TableSearchContext>
            </div>
          </th>
        </tr>
      </thead>
      <tbody className="text-left">
        {rows?.filter(filterSearchCriteria)
          .map((row, idx: number) =>
            <TableRow row={row} idx={idx} key={`tr-${idx}`} />
          )}
        {customRows && customRows(filterValue)}
      </tbody>
    </table>
  );
};

const TableSearchInput = ({ tabIndex }: { tabIndex?: number; }) => {
  const { isDark } = useTheme();
  const { filterValue, setFilterValue } = useContext(TableSearchContext);

  return (
    <div className="relative flex items-center">
      <input
        className={`w-36 md:w-42 lg:w-64 ${isDark ? "bg-darker" : "bg-lighter"} pl-2 pr-6 h-6 placeholder:text-(--vscode-disabledForeground) font-normal`}
        placeholder="Keyword search..."
        value={filterValue}
        onChange={(e) => setFilterValue(e.target.value)}
        tabIndex={tabIndex}
      />
      {filterValue.length > 0 && (
        <span className={`absolute right-1 cursor-pointer codicon codicon-close`} onClick={() => setFilterValue("")} />
      )}
    </div>
  );
};

const TableRow = ({ row }: { row: (string | JSX.Element)[]; idx: number; }) => {
  const { isDark } = useTheme();
  return (
    <tr className={`h-8 zebra-${isDark ? "dark" : "light"}`}>
      {row.map((txt, idx) => (
        <td key={`td-${idx}`} title={txt.toString()} className="pl-4 wrap-anywhere min-w-48">{txt}</td>
      ))}
      <td></td>
    </tr>
  );
};

export default Table;

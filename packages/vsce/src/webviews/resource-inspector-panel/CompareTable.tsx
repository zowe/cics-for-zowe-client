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

import { type JSX, useCallback, useMemo, useState } from "react";
import { RefreshButton } from "../common/RefreshButton";
import Table from "../common/Table";
import { useTheme } from "../common/ThemeContext";

interface ICompareTableProps {
  headers: (string | JSX.Element)[];
  rows: (string | JSX.Element)[][];
  onRefresh: () => void;
  className?: string;
  refreshTabIndex?: number;
  searchTabIndex?: number;
}

const CompareTable = ({ headers, rows, onRefresh, className = "", refreshTabIndex, searchTabIndex }: ICompareTableProps) => {
  const { isDark } = useTheme();
  const [showHiddenRows, setShowHiddenRows] = useState(false);

  const valuesDiffer = (vals: (string | JSX.Element)[]) => {
    return [...new Set(vals.map((v) => v.toString().trim().toUpperCase()))].length > 1;
  };

  const filterSearchCriteria = useCallback((rw: (string | JSX.Element)[], filterValue: string) => {
    return rw.join("").toUpperCase().includes(filterValue.toUpperCase().trim());
  }, []);

  const visibleRows = useMemo(() => rows.filter((rw) => valuesDiffer(rw.slice(1))), [rows]);
  const hiddenRows = useMemo(() => rows.filter((rw) => !valuesDiffer(rw.slice(1))), [rows]);

  const customRows = useCallback((filterValue: string) => {
    const filteredHiddenRows = hiddenRows.filter((rw) => filterSearchCriteria(rw, filterValue));

    return (
      <>
        {filteredHiddenRows.length > 0 && (
          <tr className="sticky z-50 top-10 bg-(--vscode-editor-background) h-8 shadow-[0_0.5px_0_0_var(--vscode-disabledForeground)]">
            <td colSpan={headers.length + 1}>
              <div className="flex justify-end items-center h-8 w-full px-4">
                <button
                  className="flex items-center cursor-pointer gap-1 text-(--vscode-disabledForeground)"
                  onClick={() => setShowHiddenRows(!showHiddenRows)}
                >
                  <span>{showHiddenRows ? "Hide" : "Show"} {filteredHiddenRows.length} shared attributes</span>
                  <span className={`codicon codicon-chevron-${showHiddenRows ? "up" : "down"}`} />
                </button>
              </div>
            </td>
          </tr>
        )}

        {showHiddenRows && filteredHiddenRows.map((row, idx: number) => (
          <tr key={`tr-hidden-${idx}`} className={`zebra-${isDark ? "dark" : "light"} h-8`}>
            {row.map((txt, idx2) => (
              <td key={`td-${idx2}`} title={txt.toString()} className="pl-4 wrap-anywhere min-w-48">{txt}</td>
            ))}
            <td></td>
          </tr>
        ))}
      </>
    );
  }, [hiddenRows, showHiddenRows, isDark, filterSearchCriteria]);

  return (
    <Table
      headers={headers}
      rows={visibleRows}
      className={className}
      headerActions={<RefreshButton onClick={onRefresh} tabIndex={refreshTabIndex} />}
      customRows={customRows}
      searchTabIndex={searchTabIndex}
    />
  );
};

export default CompareTable;

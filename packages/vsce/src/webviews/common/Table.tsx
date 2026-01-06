import * as React from "react";

interface TableProps {
  headers: string[];
  rows: string[][];
  highlightDifference?: boolean;
}

const Table = ({ headers, rows, highlightDifference = false }: TableProps) => {

  const [search, setSearch] = React.useState("");

  return (
    <table className="w-full mt-4">
      <thead className="px-4 h-8 sticky z-0 top-10 bg-[var(--vscode-editor-background)]">
        <tr>

          {headers.slice(0, -1).map((hd, idx) => (
            <th key={`hd-${idx}`} className="h-8 text-start pl-4 text-[var(--vscode-breadcrumb-foreground)] font-medium">{hd}</th>
          ))}
          <th key={`hd`} className="h-8 z-1 pl-4 text-[var(--vscode-breadcrumb-foreground)] font-medium flex justify-between items-center">
            {headers.slice(-1)}
            {/* <input
              type="text"
              placeholder="Keyword search..."
              value={search}
              className="w-48 focus:outline-none"
              onChange={(e) => setSearch(e.target.value)}
            /> */}
          </th>

        </tr>
      </thead>

      <tbody>

        {rows
          .filter((row) => row.join("").toUpperCase().includes(search.trim().toUpperCase()))
          .map((row, idx) => (
            <tr key={`row-${idx}`} className={`h-8 ${highlightDifference && [...new Set([...row.slice(1)])].length > 1 ? 'font-bold italic' : ''} even:bg-[var(--vscode-editor-background)]`}>
              {row.map((field, idx) => (
                <td
                  className={`px-6`}
                  key={`td-${idx}`}
                >
                  {field}
                </td>
              ))}
            </tr>
          ))}

      </tbody>
    </table>
  );

};

export default Table;
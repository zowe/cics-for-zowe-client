import React = require("react");

interface ITableProps {
  headers: (string | React.JSX.Element)[];
  rows: string[][];
  highlightDifferences?: boolean;
}

const Table = ({ headers, rows, highlightDifferences = false }: ITableProps) => {

  const valuesDiffer = (vals: string[]) => {
    // Array -> Set -> Array = removes duplicates
    return [...new Set(vals.map((v) => v.trim().toUpperCase()))].length > 1;
  };

  return (
    <table className="border-collapse border-spacing-4 w-full">
      <thead>
        <tr className="text-left bg-(--vscode-panel-border) h-8 sticky top-8">
          {headers.map((hder, idx: number) => (
            <th key={`comp-th-${idx}`} className='text-left min-w-36 px-2'>{hder}</th>
          ))}
        </tr>
      </thead>
      <tbody className="text-left">
        {rows?.map((row, idx: number) => (
          <tr key={`comp-tr-${idx}`} className={`even:bg-(--vscode-tab-activeBackground) h-8 ${highlightDifferences && valuesDiffer(row.slice(1)) ? "font-bold italic" : ""}`}>
            {row.map((txt) => (
              <td className="pl-4">{txt}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;

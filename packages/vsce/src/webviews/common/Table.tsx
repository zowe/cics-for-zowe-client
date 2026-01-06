import React = require("react");

interface ITableProps {
  headers: (string | React.JSX.Element)[];
  rows: string[][];
  highlightDifferences?: boolean;
  refresh?: () => void;
  stickyLevel?: number;
}

const RefreshButton = ({ refresh }: { refresh: () => void; }) => {
  return <span
    className="codicon codicon-refresh rotate-45 cursor-pointer font-bold"
    onClick={refresh}
  />;
};
const MenuButton = () => {
  return <span
    className="codicon codicon-kebab-vertical rotate-90 cursor-pointer font-bold"
    onClick={(e) => console.log("CLICKED MENU")}
  />;
};

const Table = ({ headers, rows, highlightDifferences = false, refresh = undefined, stickyLevel = 0 }: ITableProps) => {

  const [showHiddenRows, setShowHiddenRows] = React.useState(false);

  const valuesDiffer = (vals: string[]) => {
    // Array -> Set -> Array = removes duplicates
    return [...new Set(vals.map((v) => v.trim().toUpperCase()))].length > 1;
  };

  return (
    <table className="border-collapse border-spacing-4 w-full">
      <thead>
        <tr className={`text-left bg-(--vscode-panel-border) h-8 sticky top-${stickyLevel * 8}`}>
          {headers.map((hder, idx: number) => {
            return (
              <th key={`comp-th-${idx}`} className='text-left min-w-36 px-2 font-normal'>
                <div className="flex justify-between items-center">
                  <span>{hder}</span>
                  {refresh && idx === headers.length - 1 && (
                    <RefreshButton refresh={refresh} />
                  )}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody className="text-left">
        {rows?.filter((rw) => !highlightDifferences ? true : valuesDiffer(rw.slice(1))).map((row, idx: number) => (
          <tr key={`comp-tr-${idx}`} className={`even:bg-(--vscode-tab-activeBackground) h-8`}>
            {row.map((txt) => (
              <td className="pl-4">{txt}</td>
            ))}
          </tr>
        ))}
        {highlightDifferences && (
          <tr className="h-2 border-b-2 border-(--vscode-tab-activeBackground)">
            <td></td>
            <td></td>
            <td className="flex justify-end items-center"><button className="flex items-center cursor-pointer gap-1 hover:italic" onClick={() => setShowHiddenRows(!showHiddenRows)}> <span>{showHiddenRows ? "Hide" : "Show"} shared attributes</span><span className="codicon codicon-chevron-down" /></button></td>
          </tr>
        )}
        {highlightDifferences && showHiddenRows && rows?.filter((rw) => !valuesDiffer(rw.slice(1))).map((row, idx: number) => (
          <tr key={`comp-tr-${idx}`} className={`even:bg-(--vscode-tab-activeBackground) h-8`}>
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

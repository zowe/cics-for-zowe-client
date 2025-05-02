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
import {
  VscodeCollapsible,
  VscodeTable,
  VscodeTableBody,
  VscodeTableCell,
  VscodeTableHeader,
  VscodeTableHeaderCell,
  VscodeTableRow,
} from "@vscode-elements/react-elements";
import { useEffect, useState } from "react";
const vscodeApi = acquireVsCodeApi();

export function App() {
  const [label, setLabel] = useState<any>({});
  const [attr, setAttr] = useState<any>({});

  useEffect(() => {
    window.addEventListener("message", (event) => {
      console.log("printing event: ", event);
      setLabel(event.data.label);
    });

    window.addEventListener("message", (event) => {
      setAttr(event.data.attribute);
    });
    vscodeApi.postMessage({ command: "init" });
  }, []);

  console.log("printing label: ", label);
  console.log("printing attr: ", attr);
  const keys = Object.keys(attr);
  let map: Map<string, string> = new Map(Object.entries(attr));

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "1rem", gap: "1rem" }}>
      <VscodeCollapsible title={label} description={label}>
        {keys.map((x) => (
          <p style={{ paddingLeft: "20px" }}>
            {x} : {map.get(x)}
          </p>
        ))}
      </VscodeCollapsible>

      <VscodeTable>
        <VscodeTableHeader>
          <VscodeTableRow>
            <VscodeTableHeaderCell>Attributes</VscodeTableHeaderCell>
            <VscodeTableHeaderCell>value</VscodeTableHeaderCell>
          </VscodeTableRow>
        </VscodeTableHeader>
        <VscodeTableBody>
          {keys.map((x) => (
            <VscodeTableRow>
              <VscodeTableCell>{x}</VscodeTableCell>
              <VscodeTableCell>{map.get(x)}</VscodeTableCell>
            </VscodeTableRow>
          ))}
        </VscodeTableBody>
      </VscodeTable>
    </div>
  );
}

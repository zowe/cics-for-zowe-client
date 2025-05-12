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
  VscodeTextfield,
} from "@vscode-elements/react-elements";
import { useEffect, useState } from "react";
const vscodeApi = acquireVsCodeApi();

export function App() {
  const [label, setLabel] = useState<any>({});
  const [attr, setAttr] = useState<any>({});
  const [resource, setResource] = useState<any>({});
  const [search, setSearch] = useState("");
  const [details, setDetails] = useState<any>({});

  console.log("printing resource: ", resource);

  useEffect(() => {
    window.addEventListener("message", (event) => {
      const data = event.data.data;
      setLabel(data.label);
      setAttr(data.attributes);
      setResource(data.resource);
      setDetails(data.details);
    });
    vscodeApi.postMessage({ command: "init" });
  }, []);

  const attributesMap: Map<string, string> = new Map(Object.entries(attr));
  const detailsMap: Map<string, string> = new Map(Object.entries(details));

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "1rem", gap: "1rem" }}>
      <VscodeCollapsible title={label} description={details.status} open={true}>
        {Array.from(detailsMap)
          .filter(([key1]) => {
            return key1 !== "status";
          })
          .map(([key, value]) => (
            <p style={{ paddingLeft: "30px", lineHeight: "0.5" }}>
              {key} : {value}
            </p>
          ))}
      </VscodeCollapsible>
      <VscodeTable style={{ paddingRight: "175px", overflow: "auto", height: "500px", width: "75%" }}>
        <VscodeTableHeader>
          <VscodeTableRow>
            <VscodeTableHeaderCell style={{ paddingLeft: "75px" }}>Attributes</VscodeTableHeaderCell>
            <VscodeTableHeaderCell>Value</VscodeTableHeaderCell>
            <VscodeTableHeaderCell>
              <VscodeTextfield
                type="text"
                placeholder="Keyword search..."
                onInput={(e) => setSearch((e.target as HTMLInputElement)?.value || "")}
                value={search}
              ></VscodeTextfield>
            </VscodeTableHeaderCell>
          </VscodeTableRow>
        </VscodeTableHeader>
        <VscodeTableBody>
          {Array.from(attributesMap)
            .filter(([key1, value1]) => {
              return search.toLowerCase() === "" ? key1 : key1.toLowerCase().includes(search) || value1.toLowerCase().includes(search);
            })
            .map(([key, value]) => (
              <VscodeTableRow>
                <VscodeTableCell style={{ paddingLeft: "75px" }}>{key}</VscodeTableCell>
                <VscodeTableCell>{value}</VscodeTableCell>
                <VscodeTableCell></VscodeTableCell>
              </VscodeTableRow>
            ))}
        </VscodeTableBody>
      </VscodeTable>
    </div>
  );
}

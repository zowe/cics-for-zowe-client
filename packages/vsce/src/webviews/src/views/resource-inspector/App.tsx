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
//const locFileAttributes = ["VSAMTYPE", "RECORDSIZE", "KEYLENGTH", "DSNAME"];

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
      console.log("printing event: ", data);
      setLabel(data.label);
      setAttr(data.attributes);
      setResource(data.resource);
      setDetails(data.details);
    });
    vscodeApi.postMessage({ command: "init" });
  }, []);

  console.log("printing label: ", label);
  console.log("printing attr: ", attr);

  const keys = Object.keys(attr);
  let map: Map<string, string> = new Map(Object.entries(attr));

  const keys2 = Object.keys(details);
  let map2: Map<string, string> = new Map(Object.entries(details));

  console.log("printing details: ", details);

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "1rem", gap: "1rem" }}>
      <VscodeCollapsible title={label} description={details.status} open={true}>
        {keys2
          .filter((x) => {
            return x !== "status";
          })
          .map((x) => (
            <p style={{ paddingLeft: "20px", lineHeight: "0.5" }}>
              {x} : {map2.get(x)}
            </p>
          ))}
      </VscodeCollapsible>
      <VscodeTable style={{ paddingRight: "175px", overflow: "auto", height: "500px" }}>
        <VscodeTableHeader>
          <VscodeTableRow>
            <VscodeTableHeaderCell style={{ paddingLeft: "50px" }}>Attributes</VscodeTableHeaderCell>
            <VscodeTableHeaderCell style={{ paddingLeft: "188px" }}>value</VscodeTableHeaderCell>
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
          {keys
            .filter((x) => {
              return search.toLowerCase() === "" ? x : x.toLowerCase().includes(search);
            })
            .map((x) => (
              <VscodeTableRow>
                <VscodeTableCell style={{ paddingLeft: "50px" }}>{x}</VscodeTableCell>
                <VscodeTableCell>{map.get(x)}</VscodeTableCell>
              </VscodeTableRow>
            ))}
        </VscodeTableBody>
      </VscodeTable>
    </div>
  );
}

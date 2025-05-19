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
  VscodeTable,
  VscodeTableBody,
  VscodeTableCell,
  VscodeTableHeader,
  VscodeTableHeaderCell,
  VscodeTableRow,
  VscodeTextfield,
} from "@vscode-elements/react-elements";

import * as React from "react";
import * as vscode from "../common/vscode";

import "../css/style.css";

const RIPanelView = () => {
  const [label, setLabel] = React.useState<any>({});
  const [attr, setAttr] = React.useState<any>({});
  const [resource, setResource] = React.useState<any>({});
  const [search, setSearch] = React.useState("");
  const [details, setDetails] = React.useState<any>({});

  console.log("printing resource: ", resource);

  React.useEffect(() => {
    const listener = (event: MessageEvent<vscode.TransformWebviewMessage>): void => {
      const data = event.data.data;
      console.log("printing event: ", data);
      setLabel(data.label);
      setAttr(data.attributes);
      setResource(data.resource);
      setDetails(data.details);
    };
    vscode.addVscMessageListener(listener);

    vscode.postVscMessage({ command: "init" });

    return () => {
      vscode.removeVscMessageListener(listener);
    };
  }, []);

  const attributesMap: Map<string, string> = new Map(Object.entries(attr));
  const detailsMap: Map<string, string> = new Map(Object.entries(details));

  return (
    <div className="maindiv">
      <VscodeTable>
        <VscodeTableHeader>
          <VscodeTableRow>
            <VscodeTableHeaderCell className="header-cell-1">
              <div className="div-display-1">{(label + "").replace(/Closed|Disabled|Unenabled|\(|\)/g, "")}</div>
              <div className="div-display-1 div-display-2">{details.status + ""}</div>
            </VscodeTableHeaderCell>
          </VscodeTableRow>
        </VscodeTableHeader>
        <VscodeTableBody>
          <VscodeTableCell className="padding-left-20">
            {Array.from(detailsMap)
              .filter(([key]) => {
                return key !== "status";
              })
              .map(([key, value]) => (
                <p className="line">
                  {key} : {value}
                </p>
              ))}
          </VscodeTableCell>
        </VscodeTableBody>
      </VscodeTable>

      <VscodeTable zebra={true} columns={["30%", "70%"]}>
        <VscodeTableHeader>
          <VscodeTableRow>
            <VscodeTableHeaderCell className="padding-right-10">Attributes</VscodeTableHeaderCell>
            <VscodeTableHeaderCell className="padding-right-10">
              <div>
                <div className="div-display-1">Values</div>
                <VscodeTextfield
                  type="text"
                  placeholder="Keyword search..."
                  onInput={(e: { target: HTMLInputElement }) => setSearch(e.target.value)}
                  value={search}
                  className="search-style div-display-1"
                ></VscodeTextfield>
              </div>
            </VscodeTableHeaderCell>
          </VscodeTableRow>
        </VscodeTableHeader>
        <VscodeTableBody>
          {Array.from(attributesMap)
            .filter(([key, value]) => {
              return (
                (search.toLowerCase() === "" ? key : key.toLowerCase().includes(search) || value.toLowerCase().includes(search)) && key !== "_keydata"
              );
            })
            .map(([key, value]) => (
              <VscodeTableRow>
                <VscodeTableCell className="padding-left-20">{key}</VscodeTableCell>
                <VscodeTableCell className="padding-right-75">{value}</VscodeTableCell>
              </VscodeTableRow>
            ))}
        </VscodeTableBody>
      </VscodeTable>
    </div>
  );
};

export default RIPanelView;


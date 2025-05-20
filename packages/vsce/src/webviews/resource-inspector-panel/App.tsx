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
  const [search, setSearch] = React.useState("");

  const [riArgs, setRIArgs] = React.useState<{
    label: string;
    details: { [key: string]: string };
    resource: { [key: string]: string };
    attributes: { [key: string]: string };
  }>();

  React.useEffect(() => {
    const listener = (event: MessageEvent<vscode.TransformWebviewMessage>): void => {
      const data = event.data.data;
      setRIArgs(data);
    };
    vscode.addVscMessageListener(listener);

    vscode.postVscMessage({ command: "init" });

    return () => {
      vscode.removeVscMessageListener(listener);
    };
  }, []);

  return (
    riArgs && (
      <div className="maindiv">
        <VscodeTable>
          <VscodeTableHeader>
            <VscodeTableRow>
              <VscodeTableHeaderCell className="header-cell-1">
                <div className="div-display-1">{(riArgs.label + "").replace(/Closed|Disabled|Unenabled|\(|\)/g, "")}</div>
                <div className="div-display-1 div-display-2">{riArgs.details.status + ""}</div>
              </VscodeTableHeaderCell>
            </VscodeTableRow>
          </VscodeTableHeader>
          <VscodeTableBody>
            <VscodeTableCell className="padding-left-20">
              {Object.entries(riArgs.details)
                .filter(([key, value]) => key !== "status")
                .map(([key, value]) => (
                  <p className="line">
                    {key}: {value}
                  </p>
                ))}
            </VscodeTableCell>
          </VscodeTableBody>
        </VscodeTable>

        <VscodeTable zebra={true} columns={["30%", "70%"]}>
          <VscodeTableHeader>
            <VscodeTableRow>
              <VscodeTableHeaderCell className="div-display-1 padding-right-10">Attribute</VscodeTableHeaderCell>
              <VscodeTableHeaderCell className="padding-right-10">
                <div>
                  <div className="div-display-1">Value</div>
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
            {Object.entries(riArgs.attributes)
              .filter(([key, value]) => key.toLowerCase() !== "_keydata")
              .filter(
                ([key, value]) =>
                  key.toLowerCase().trim().includes(search.toLowerCase().trim()) || value.toLowerCase().trim().includes(search.toLowerCase().trim())
              )
              .map(([key, value]) => (
                <VscodeTableRow>
                  <VscodeTableCell className="padding-left-20">{key}</VscodeTableCell>
                  <VscodeTableCell className="padding-right-75">{value}</VscodeTableCell>
                </VscodeTableRow>
              ))}
          </VscodeTableBody>
        </VscodeTable>
      </div>
    )
  );
};

export default RIPanelView;

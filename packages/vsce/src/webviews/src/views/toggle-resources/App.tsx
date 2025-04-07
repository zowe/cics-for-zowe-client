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
import { VSCodeDivider } from "@vscode/webview-ui-toolkit/react";
import { useEffect, useState } from "react";
import Button from "../../components/Button";
import CheckBox from "../../components/CheckBox";
import PanelTab from "../../components/PanelTab";
import "../../style.css";

const vscodeApi = acquireVsCodeApi();

export function App() {
  const [msg, setMsg] = useState<string>("not set");

  useEffect(() => {
    console.log(msg);
    window.addEventListener("message", (event) => {
      setMsg(event.data.msg);
    });
    vscodeApi.postMessage({ command: "init" });
  }, []);

  return (
    <div className="main-panel container">
      <h3>Select the resources to show in the CICS extension tree</h3>
      <VSCodeDivider />
      <br />
      <CheckBox label="resources"></CheckBox>
      {/* <VSCodePanels activeid="ds-panel-tab">
        <VSCodePanelTab id="ds-panel-tab">T
        <h2>Zowe Commands</h2>  
        </VSCodePanelTab> */}
      {/* <VSCodePanelTab id="ds-panel-tab2">Tab 2</VSCodePanelTab> */}
      {/* </VSCodePanels> */}
      <PanelTab></PanelTab>
      <Button name="Apply"></Button> <Button name="Reset" type="secondary"></Button>
    </div>
  );
}

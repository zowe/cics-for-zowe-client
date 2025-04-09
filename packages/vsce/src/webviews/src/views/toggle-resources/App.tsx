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
import "../../style.css";
import ToggleResources from "./TogglePanel";

const vscodeApi = acquireVsCodeApi();

export function App() {
  const [msg, setMsg] = useState<string>("not set");
  // const [resources, setResources] = useState<resource[]>([]);
  const [metas, setMetas] = useState<
    {
      resourceName: string;
      humanReadableName: string;
      visible: boolean;
    }[]
  >([]);

  useEffect(() => {
    window.addEventListener("message", (event) => {
      console.log("printing event: ", event.data.metas);
      setMetas(event.data.metas);
    });
    console.log(msg);
    window.addEventListener("message", (event) => {
      setMsg(event.data.msg);
    });
    vscodeApi.postMessage({ command: "metas" });
  }, []);

  const print = () => {
    console.log("printing metas", metas);
  };
  return (
    <div className="main-panel container">
      <div>
        hello workd
        <h3>Select the resources to show in the CICS extension tree</h3>
      </div>
      <div className="bg-color">
        <div>
          <ToggleResources items={metas}></ToggleResources>
        </div>
        <VSCodeDivider className="padd-sides" />
        <div>
          <span className="left-padd">
            <Button name="Apply" onclick={print}></Button>{" "}
            <Button name="Reset" type="secondary" onclick={() => console.log("clicked again")}></Button>
          </span>
        </div>
      </div>
    </div>
  );
}
// function onclick() {
//   console.log("clicked save button");
// }

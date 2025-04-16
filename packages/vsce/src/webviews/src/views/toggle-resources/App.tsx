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
import { useEffect, useState } from "react";
import Button from "../../components/Button";
import "../../style.css";
import ToggleResources from "./TogglePanel";
import Divider from "../../components/Divider";

const vscodeApi = acquireVsCodeApi();

export function App() {
  const [metas, setMetas] = useState<
    {
      resourceName: string;
      humanReadableName: string;
      visible: boolean;
    }[]
  >([]);

  useEffect(() => {
    window.addEventListener("message", (event) => {
      setMetas(event.data.metas);
    });
    vscodeApi.postMessage({ command: "init" });
  }, []);

  const print = () => {
    const filtered = metas.filter((val) => val.visible);
    console.log("printing metas", filtered);
    vscodeApi.postMessage({ command: "save", metas });
  };
  return (
    <div className="main-panel">
      <div>
        <h3>Select the resources to show in the CICS extension tree</h3>
      </div>
      <div id="toggle-resource-body" className="bg-color">
        <div>
          <ToggleResources items={metas}></ToggleResources>
        </div>
        <div className="divider-style">
          <Divider />
        </div>
        <div className="button-style">
          <Button
            name="Apply"
            // onclick={() => {
            //   console.log("printing metas == ", metas);
            //   vscodeApi.postMessage({ command: "save", metas });
            // }}
            onclick={print}
            styles="button-style"
          ></Button>
          <Button name="Reset" type="secondary" styles="button-style" onclick={() => console.log("clicked again")}></Button>
        </div>
      </div>
    </div>
  );
}
// function onclick() {
//   console.log("clicked save button");
// }

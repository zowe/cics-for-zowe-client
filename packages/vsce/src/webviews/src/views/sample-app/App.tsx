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
import CheckBox from "../../components/CheckBox";

const vscodeApi = acquireVsCodeApi();

export function App() {
  const [msg, setMsg] = useState<string>("not set");

  useEffect(() => {
    window.addEventListener("message", (event) => {
      setMsg(event.data.msg);
    });

    vscodeApi.postMessage({ command: "init" });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "1rem", gap: "1rem" }}>
      <h1 style={{ fontSize: "2rem" }}>{msg}</h1>
      <Button name="Sample"></Button>
      <h2>Hello from HMR</h2>
      <CheckBox label="resources" checked={true}></CheckBox>
    </div>
  );
}

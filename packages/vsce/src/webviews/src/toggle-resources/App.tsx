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
import { VscodeButton, VscodeCheckbox } from "@vscode-elements/react-elements";
import { useEffect, useState } from "preact/hooks";
import PersistentVSCodeAPI from "src/PersistentVSCodeAPI";

const vscodeApi = PersistentVSCodeAPI.getVSCodeAPI();

export function App() {

  const [metas, setMetas] = useState<{ resourceName: string; humanReadableName: string; visible: boolean; }[]>([]);

  useEffect(() => {

    window.addEventListener("message", (event) => {
      setMetas(event.data.metas);
    });

    vscodeApi.postMessage({ command: "metas" });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "1rem", gap: "1rem" }}>

      <h1 style={{ fontSize: "2rem" }}>Choose resources to appear in the CICS tree</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", padding: "2rem" }}>
        {metas.length > 0 && (
          metas.map((meta) => (
            <div style={{ display: "block", minWidth: "10rem" }}>
              <VscodeCheckbox checked={meta.visible} onChange={(e) => {
                setMetas([...metas.map((_) => {
                  if (_ === meta) {
                    _.visible = (e.target as HTMLInputElement).checked;
                  }
                  return _;
                })]);
              }}>{meta.humanReadableName}</VscodeCheckbox>
            </div>
          ))
        )}
      </div>

      <VscodeButton onClick={() => {
        vscodeApi.postMessage({ command: "save", metas });
      }}>Save</VscodeButton>
    </div >
  );
}

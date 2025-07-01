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

import * as React from "react";
import * as vscode from "../common/vscode";

import "../css/style.css";

const Breadcrumb = () => {
  const [resourceInfo, setResourceInfo] = React.useState<{
    profileHandler: { key: string; value: string }[];
  }>();

  React.useEffect(() => {
    const listener = (event: MessageEvent<vscode.TransformWebviewMessage>): void => {
      setResourceInfo(event.data.data);
    };
    vscode.addVscMessageListener(listener);

    vscode.postVscMessage({ command: "init" });

    return () => {
      vscode.removeVscMessageListener(listener);
    };
  }, []);

  return (
    <div id="breadcrumb-div" className="breadcrumb-div">
      <ul className="breadcrumb">
        {resourceInfo &&
          resourceInfo.profileHandler
            .filter((profileHandler) => profileHandler.value !== null)
            .map((profile) => (
              <li key={profile.key}>
                <a>{profile.value}</a>
              </li>
            ))}
      </ul>
    </div>
  );
};

export default Breadcrumb;

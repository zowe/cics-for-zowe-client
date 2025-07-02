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

import "../css/style.css";

const Breadcrumb = ({ profileHandler }: { profileHandler: { key: string; value: string }[] }) => {
  return (
    <div id="breadcrumb-div" className="breadcrumb-div">
      <ul className="breadcrumb">
        {profileHandler &&
          profileHandler
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

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

import { useTheme } from "./ThemeContext";

export const RefreshButton = ({ onClick, tabIndex }: { onClick: () => void; tabIndex?: number; }) => {
  const { isDark } = useTheme();

  return (
    <button
      id="refresh-icon"
      onClick={onClick}
      tabIndex={tabIndex}
      className={`p-0.5 flex items-center justify-center rounded-sm ${isDark ? "hover-lighter" : "hover-darker"}`}
    >
      <span className="codicon codicon-refresh rotate-45 cursor-pointer font-bold" />
    </button>
  );
};

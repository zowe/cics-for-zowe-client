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

/**
 * Custom hook to detect and track VSCode theme changes
 * @returns {boolean} Whether dark theme is active
 */
export const useThemeDetection = (): boolean => {
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);

  useEffect(() => {
    const isDarkThemeActive = (): boolean => {
      return (
        document.body.classList.contains("vscode-dark") ||
        (document.body.classList.contains("vscode-high-contrast") && !document.body.classList.contains("vscode-high-contrast-light"))
      );
    };
    setIsDarkTheme(isDarkThemeActive());
    const updateTheme = () => setIsDarkTheme(isDarkThemeActive());
    window.addEventListener("vscode-theme-changed", updateTheme);
    // Create a MutationObserver to watch for class changes on the body element
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "class") {
          updateTheme();
        }
      }
    });
    observer.observe(document.body, { attributes: true });
    return () => {
      window.removeEventListener("vscode-theme-changed", updateTheme);
      observer.disconnect();
    };
  }, []);

  return isDarkTheme;
};

export default useThemeDetection;

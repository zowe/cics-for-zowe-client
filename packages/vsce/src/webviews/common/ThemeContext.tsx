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

import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface ThemeContextType {
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const checkTheme = () => {
    return document.body.classList.contains("vscode-dark") ||
      (document.body.classList.contains("vscode-high-contrast") &&
        !document.body.classList.contains("vscode-high-contrast-light"));
  };

  const [isDark, setIsDark] = useState(checkTheme());

  useEffect(() => {
    const updateTheme = () => {
      const newIsDark = checkTheme();
      setIsDark(newIsDark);
    };

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          updateTheme();
          break;
        }
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};


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
import { getSearchInputBgClass } from "./tableUtils";

interface ISearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  tabIndex?: number;
  className?: string;
}

/**
 * Reusable search input component with clear button
 */
export const SearchInput = ({
  value,
  onChange,
  placeholder = "Keyword search...",
  tabIndex,
  className = "",
}: ISearchInputProps) => {
  const { isDark } = useTheme();

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-36 md:w-42 lg:w-64 ${getSearchInputBgClass(
          isDark
        )} pl-2 pr-6 h-6 placeholder:text-(--vscode-disabledForeground) font-normal text-xs`}
        tabIndex={tabIndex}
      />
      {value.length > 0 && (
        <span
          className="absolute right-1 cursor-pointer codicon codicon-close"
          onClick={() => onChange("")}
        />
      )}
    </div>
  );
};

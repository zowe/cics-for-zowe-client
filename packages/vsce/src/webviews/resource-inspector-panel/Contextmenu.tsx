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

import { IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import { createContext, ReactNode, RefObject, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../common/ThemeContext";
import { IResourceInspectorResource, postVscMessage } from "../common/vscode";

const DropdownContext = createContext<{
  open: boolean;
  setOpen: (o: boolean) => void;
  buttonRef: RefObject<HTMLButtonElement> | null;
}>({
  open: false,
  setOpen: (_o: boolean) => {},
  buttonRef: null,
});

interface DropDownProps {
  children: ReactNode;
}

const DropDown = ({ children }: DropDownProps) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const close = (e: Event) => {
      if (!dropdownRef?.current.contains(e.target)) {
        setOpen(false);
      }
    };

    if (open) {
      window.addEventListener("click", close);
    }

    return () => {
      window.removeEventListener("click", close);
    };
  }, [open]);

  return (
    <DropdownContext value={{ open, setOpen, buttonRef }}>
      <div ref={dropdownRef} className="relative">
        {children}
      </div>
    </DropdownContext>
  );
};

const DropDownButton = ({ tabIndex }: { tabIndex?: number }) => {
  const { isDark } = useTheme();
  const { open, setOpen, buttonRef } = useContext(DropdownContext);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleOpen();
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={toggleOpen}
      onKeyDown={handleKeyDown}
      tabIndex={tabIndex}
      className={`flex items-center justify-center p-0.5 rounded-sm ${isDark ? "hover-lighter" : "hover-darker"}`}
      aria-label="Actions menu"
      aria-expanded={open}
    >
      <span className="codicon codicon-kebab-vertical rotate-90 cursor-pointer font-bold" />
    </button>
  );
};

interface DropDownContentProps {
  children: ReactNode;
}

const DropDownContent = ({ children }: DropDownContentProps) => {
  const { open, buttonRef } = useContext(DropdownContext);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const updatePosition = () => {
      if (open && buttonRef?.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 2,
          left: rect.right - 192, // 192px = width of menu to offset to the left
        });
      }
    };

    if (open) {
      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
    }

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, buttonRef]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed z-60 flex flex-col bg-(--vscode-editor-background) min-w-48 rounded-lg p-1 border border-(--vscode-disabledForeground)"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {children}
    </div>,
    document.body
  );
};

interface DropDownListProps {
  children: ReactNode;
}

const DropDownList = ({ children }: DropDownListProps) => {
  const { setOpen } = useContext(DropdownContext);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (listRef.current) {
      const firstItem = listRef.current.querySelector("li");
      if (firstItem) {
        (firstItem as HTMLElement).focus();
      }
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = listRef.current?.querySelectorAll("li");
    if (!items) return;

    const currentIndex = Array.from(items).findIndex((item) => item === document.activeElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      (items[nextIndex] as HTMLElement).focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
      (items[prevIndex] as HTMLElement).focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <ul ref={listRef} onClick={() => setOpen(false)} onKeyDown={handleKeyDown} className="flex flex-col gap-0 py-0.5" role="menu">
      {children}
    </ul>
  );
};

interface DropDownListItemProps {
  children: ReactNode;
  actionId: string;
  resourceName: string;
  resourceContext: IResourceContext;
  resources: IResourceInspectorResource[];
}

const DropDownListItem = ({ children, actionId, resources }: DropDownListItemProps) => {
  const { setOpen } = useContext(DropdownContext);

  const handleClick = () => {
    postVscMessage({ type: "executeAction", actionId, resources });
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <li
      className="cursor-pointer hover:bg-(--vscode-button-background) hover:text-white rounded-md px-2 py-0.5"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="menuitem"
    >
      {children}
    </li>
  );
};

export const ContextMenu = ({
  data,
  tabIndex,
}: {
  data: { label: string; value: string; resourceName: string; resourceContext: IResourceContext; resources: IResourceInspectorResource[] }[];
  tabIndex?: number;
}) => {
  return (
    <DropDown>
      <DropDownButton tabIndex={tabIndex} />
      <DropDownContent>
        <DropDownList>
          {data.map((d) => (
            <DropDownListItem
              key={d.value}
              actionId={d.value}
              resourceName={d.resourceName}
              resourceContext={d.resourceContext}
              resources={d.resources}
            >
              {d.label}
            </DropDownListItem>
          ))}
        </DropDownList>
      </DropDownContent>
    </DropDown>
  );
};

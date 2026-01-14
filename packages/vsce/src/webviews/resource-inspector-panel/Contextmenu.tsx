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
import { createContext, RefObject, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from 'react-dom';
import { IResourceInspectorResource, postVscMessage } from "../common/vscode";

const DropdownContext = createContext<{
  open: boolean;
  setOpen: (o: boolean) => void;
  buttonRef: RefObject<HTMLButtonElement> | null;
}>({
  open: false,
  setOpen: (o: boolean) => { },
  buttonRef: null,
});

const DropDown = ({ children, ...props }: any) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {

    const close = (e: Event) => {
      if (!dropdownRef.current.contains(e.target)) {
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
      <div ref={dropdownRef} className="relative">{children}</div>
    </DropdownContext>
  );
};

const DropDownButton = () => {

  const { open, setOpen, buttonRef } = useContext(DropdownContext);

  const toggleOpen = () => {
    setOpen(!open);
  };

  return (
    <button ref={buttonRef} onClick={toggleOpen} className='flex items-center justify-center'>
      <span className="codicon codicon-kebab-vertical rotate-90 cursor-pointer font-bold" />
    </button>
  );
};

const DropDownContent = ({ children }: any) => {

  const { open, buttonRef } = useContext(DropdownContext);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const updatePosition = () => {
      if (open && buttonRef?.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 2,
          left: rect.right - 192 // 192px = width of menu to offset to the left
        });
      }
    };

    if (open) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [open, buttonRef]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed z-50 flex flex-col bg-(--vscode-panel-border)/95 min-w-48 rounded-lg p-1 border border-(--vscode-disabledForeground)"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {children}
    </div>,
    document.body
  );
};

const DropDownList = ({ children }: any) => {
  const { setOpen } = useContext(DropdownContext);

  return (
    <ul onClick={() => setOpen(false)} className='flex flex-col gap-0 py-0.5'>
      {children}
    </ul>
  );
};
const DropDownListItem = ({ children, actionId, resourceName, resourceContext, resources }: { children: any; actionId: string; resourceName: string; resourceContext: IResourceContext; resources: IResourceInspectorResource[]; }) => {
  return (
    <li className='cursor-pointer hover:bg-(--vscode-button-background) hover:text-white rounded-md px-2 py-0.5' onClick={() => {
      postVscMessage({ command: "action", actionId, resourceName, resourceContext, resources });
    }}>{children}</li>
  );
};

export const ContextMenu = ({ data }: { data: { label: string; value: string; resourceName: string; resourceContext: IResourceContext; resources: IResourceInspectorResource[]; }[]; }) => {
  return (
    <DropDown>
      <DropDownButton />
      <DropDownContent>
        <DropDownList>
          {data.map((d) => (
            <DropDownListItem key={d.value} actionId={d.value} resourceName={d.resourceName} resourceContext={d.resourceContext} resources={d.resources}>{d.label}</DropDownListItem>
          ))}
        </DropDownList>
      </DropDownContent>
    </DropDown>
  );
};
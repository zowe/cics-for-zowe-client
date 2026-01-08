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

import { IResourceContext } from '@zowe/cics-for-zowe-explorer-api';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Chevron } from './Chevron';
import { IResourceInspectorIconPath, IResourceInspectorResource, postVscMessage } from './vscode';

export const SecondaryText = ({ txt, className = "" }: { txt: string; className?: string; }) => <div className={`flex items-center gap-0.5 ${className}`}><span className="text-(--vscode-disabledForeground)">{txt}</span><Chevron /></div>;

export const RegionResourceBreadcrumb = (props: {
  profileName: string;
  cicsplexName?: string;
  regionName: string;
  resourceName: string;
  menuData: { label: string; value: string; resourceName: string; resourceContext: IResourceContext; resources: IResourceInspectorResource[]; }[];
}) => {

  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="flex gap-1">

      <div className="flex items-center gap-1 relative cursor-text" onMouseOver={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
        <div className={`bg-(--vscode-panel-border)/95 shadow-lg rounded-md px-2 py-1 absolute left-0 top-5 ${showTooltip ? "" : "hidden"} flex items-center gap-1`}>
          <span>{props.profileName}</span>
          <Chevron />
          {props.cicsplexName && (
            <>
              <span>{props.cicsplexName}</span>
              <Chevron />
            </>
          )}
          <span>{props.regionName}</span>
        </div>
        <SecondaryText txt={props.regionName} className={"hidden md:flex"} />
        <span className="font-bold">{props.resourceName}</span>
      </div>

      <MenuButton data={props.menuData} />
    </div>
  );
};

export const BreadcrumbSection = (props: { cicsplexName?: string; regionName?: string; resourceName?: string; resourceType?: string; resourceIconPath?: IResourceInspectorIconPath; }) => {
  return (
    <div className="flex items-center w-full gap-2">

      {props.cicsplexName && <SecondaryText txt={props.cicsplexName} />}
      {props.regionName && <SecondaryText txt={props.regionName} />}
      {props.resourceName && (
        <span className="font-bold">{props.resourceName}</span>
      )}
      {props.resourceType && (
        <span className="font-bold">{props.resourceType}</span>
      )}
      {props.resourceIconPath && (
        <img
          src={document.body.classList.contains("vscode-dark") ? props.resourceIconPath.dark : props.resourceIconPath.light}
          alt="RES"
          width="16px"
          height="16px"
        />
      )}
    </div>
  );
};

export const RefreshButton = ({ onClick }: { onClick: () => void; }) => {
  return <span
    className="codicon codicon-refresh rotate-45 cursor-pointer font-bold"
    onClick={onClick}
  />;
};

const DropdownContext = React.createContext<{
  open: boolean;
  setOpen: (o: boolean) => void;
  buttonRef: React.RefObject<HTMLButtonElement> | null;
}>({
  open: false,
  setOpen: (o: boolean) => { },
  buttonRef: null,
});

const DropDown = ({ children, ...props }: any) => {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {

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
    <DropdownContext.Provider value={{ open, setOpen, buttonRef }}>
      <div ref={dropdownRef} className="relative">{children}</div>
    </DropdownContext.Provider>
  );
};

const DropDownButton = () => {

  const { open, setOpen, buttonRef } = React.useContext(DropdownContext);

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

  const { open, buttonRef } = React.useContext(DropdownContext);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });

  React.useEffect(() => {
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

  return ReactDOM.createPortal(
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
  const { setOpen } = React.useContext(DropdownContext);

  return (
    <ul onClick={() => setOpen(false)} className='flex flex-col gap-0 py-0.5'>
      {children}
    </ul>
  );
};
const DropDownListItem = ({ children, actionId, resourceName, resourceContext, resources }: { children: any; actionId: string; resourceName: string; resourceContext: IResourceContext; resources: IResourceInspectorResource[]; }) => {
  return (
    <li className='cursor-pointer hover:bg-(--vscode-button-background) hover:text-(--vscode-banner-foreground) rounded-md px-2 py-0.5' onClick={() => {
      postVscMessage({ command: "action", actionId, resourceName, resourceContext, resources });
    }}>{children}</li>
  );
};

export const MenuButton = ({ data }: { data: { label: string; value: string; resourceName: string; resourceContext: IResourceContext; resources: IResourceInspectorResource[]; }[]; }) => {
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

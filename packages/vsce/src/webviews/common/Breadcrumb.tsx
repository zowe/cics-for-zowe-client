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
import { Chevron } from './Chevron';
import { IResourceInspectorIconPath, IResourceInspectorResource, postVscMessage } from './vscode';

export const SecondaryText = ({ txt }: { txt: string; }) => <div className='flex items-center gap-0.5'><span className="text-(--vscode-disabledForeground)">{txt}</span><Chevron /></div>;

export const RegionResourceBreadcrumb = (props: { regionName: string; resourceName: string; menuData: { label: string; value: string; resourceName: string; resourceContext: IResourceContext; resources: IResourceInspectorResource[]; }[]; }) => {
  return (
    <div className="flex gap-1">
      <SecondaryText txt={props.regionName} />
      <span className="font-bold">{props.resourceName}</span>
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

const DropdownContext = React.createContext({
  open: false,
  setOpen: (o: boolean) => { },
});

const DropDown = ({ children, ...props }: any) => {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

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
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={dropdownRef} className="relative">{children}</div>
    </DropdownContext.Provider>
  );
};

const DropDownButton = () => {

  const { open, setOpen } = React.useContext(DropdownContext);

  const toggleOpen = () => {
    setOpen(!open);
  };

  return (
    <button onClick={toggleOpen} className='flex items-center justify-center'>
      <span className="codicon codicon-kebab-vertical rotate-90 cursor-pointer font-bold" />
    </button>
  );
};

const DropDownContent = ({ children }: any) => {

  const { open } = React.useContext(DropdownContext);

  return (
    <div className={`absolute right-0 z-20 ${open ? "" : "hidden"} flex flex-col bg-(--vscode-panel-border)/95 min-w-48 rounded-lg p-1 border border-(--vscode-disabledForeground)`}>
      {children}
    </div>
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
            <DropDownListItem actionId={d.value} resourceName={d.resourceName} resourceContext={d.resourceContext} resources={d.resources}>{d.label}</DropDownListItem>
          ))}
        </DropDownList>
      </DropDownContent>
    </DropDown>
  );
};

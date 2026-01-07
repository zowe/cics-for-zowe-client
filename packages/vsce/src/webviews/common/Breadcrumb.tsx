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

import * as React from 'react';
import { Chevron } from './Chevron';
import { IResourceInspectorIconPath } from './vscode';

export const SecondaryText = ({ txt }: { txt: string; }) => <> <span className="text-(--vscode-disabledForeground)">{txt}</span> <Chevron /></>;

export const RegionResourceBreadcrumb = (props: { regionName: string; resourceName: string; }) => {
  return (
    <div className="flex gap-1">
      <SecondaryText txt={props.regionName} />
      <span className="font-bold">{props.resourceName}</span>
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
export const MenuButton = ({ onClick }: { onClick: () => void; }) => {
  return <span
    className="codicon codicon-kebab-vertical rotate-90 cursor-pointer font-bold"
    onClick={onClick}
  />;
};

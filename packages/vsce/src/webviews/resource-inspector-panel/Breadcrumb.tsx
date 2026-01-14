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
import { useState } from 'react';
import { Chevron } from '../common/Chevron';
import { IResourceInspectorIconPath, IResourceInspectorResource } from '../common/vscode';
import { ContextMenu } from './Contextmenu';

export const SecondaryText = ({ txt, className = "" }: { txt: string; className?: string; }) => <div className={`flex items-center gap-0.5 ${className}`}><span className="text-(--vscode-disabledForeground)">{txt}</span><Chevron /></div>;

export const RegionResourceBreadcrumb = (props: {
  profileName: string;
  cicsplexName?: string;
  regionName: string;
  resourceName: string;
  menuData: { label: string; value: string; resourceName: string; resourceContext: IResourceContext; resources: IResourceInspectorResource[]; }[];
}) => {

  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="flex gap-1 items-center">

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
        <span className="font-normal">{props.resourceName}</span>
      </div>

      <ContextMenu data={props.menuData} />
    </div>
  );
};

export const BreadcrumbSection = (props: { cicsplexName?: string; regionName?: string; resourceName?: string; resourceType?: string; resourceIconPath?: IResourceInspectorIconPath; }) => {
  return (
    <div className="flex items-center w-full gap-1">

      {props.cicsplexName && <SecondaryText txt={props.cicsplexName} />}
      {props.regionName && <SecondaryText txt={props.regionName} />}
      <div className="flex gap-1">
        {props.resourceIconPath && (
          <img
            src={document.body.classList.contains("vscode-dark") ? props.resourceIconPath.dark : props.resourceIconPath.light}
            alt="RES"
            width="16px"
            height="16px"
          />
        )}
        {props.resourceName ? (
          <>
            <span className="font-normal">{props.resourceName}</span>
            {props.resourceType && (
              <span className="text-(--vscode-disabledForeground) font-normal">({props.resourceType})</span>
            )}
          </>
        ) : props.resourceType && (
          <span className="font-normal">{props.resourceType}</span>
        )}
      </div>
    </div>
  );
};

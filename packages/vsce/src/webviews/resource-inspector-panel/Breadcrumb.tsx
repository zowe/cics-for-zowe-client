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

import { IResource, IResourceProfileNameInfo } from "@zowe/cics-for-zowe-explorer-api";
import * as React from "react";
import { Uri } from "vscode";
import { postVscMessage } from "../common/vscode";
import "../css/style.css";
import Contextmenu from "./Contextmenu";

interface IconPath {
  light: string;
  dark: string;
}

interface IBreadcrumbProps {
  resourceContext: IResourceProfileNameInfo;
  resources: {
    name: string;
    resourceIconPath: { light: string; dark: string; };
    humanReadableNameSingular: string;
    humanReadableNamePlural: string;
    highlights: { key: string; value: string; }[];
    resource: IResource;
  }[];
  resourceActions: { id: string; name: string; iconPath?: { light: Uri; dark: Uri; }; }[],
}

const Breadcrumb = ({
  resourceContext,
  resources,
  resourceActions,
}: IBreadcrumbProps) => {

  const handleRefresh = () => {
    postVscMessage({ command: "refresh" });
  };

  const Chevron = () => (
    <span className="codicon codicon-chevron-right text-[var(--vscode-breadcrumb-foreground)]" />
  );
  const ResourceIcon = () => (
    <div className="w-4">
      <img
        src={resources ? resources[0].resourceIconPath.dark : null}
      />
    </div>
  );
  const ResourceBreadcrumbComp = () => (
    <div className="flex gap-1 items-center">
      <ResourceIcon />

      {resources?.length === 1 && (
        <span>{resources[0].name}</span>
      )}
      <span>{resources ? resources?.length > 1 ? resources[0].humanReadableNamePlural : `(${resources[0].humanReadableNameSingular})` : ""}</span>
    </div>
  );
  const ContextBreadcrumbComp = ({ txt }: { txt: string; }) => (
    <>
      <span className="text-[var(--vscode-breadcrumb-foreground)]">{txt}</span>
      <Chevron />
    </>
  );
  const RefreshButton = () => (
    <button className="w-4 flex justify-center items-center cursor-pointer" id="refresh-icon" onClick={handleRefresh}>
      <span className="codicon codicon-refresh" />
    </button>
  );

  return (
    <>
      <div id="portal-root" className="max-w-6xl relative w-full" />
      <div className="flex flex-col gap-0 w-full sticky top-0">
        <div className="w-full sticky top-0 h-2 bg-[var(--vscode-panel-background)]"></div>
        <div className="w-full px-4 sticky top-2 bg-[var(--vscode-editor-background)] h-8 flex items-center">
          <div className="flex justify-between items-center w-full">


            <div className="flex justify-start gap-2">
              {resourceContext?.cicsplexName && (
                <ContextBreadcrumbComp txt={resourceContext.cicsplexName} />
              )}
              <ContextBreadcrumbComp txt={resourceContext?.regionName} />
              <ResourceBreadcrumbComp />
            </div>

            <div className="flex gap-1">
              <RefreshButton />
              <Contextmenu resourceActions={resourceActions} />
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Breadcrumb;
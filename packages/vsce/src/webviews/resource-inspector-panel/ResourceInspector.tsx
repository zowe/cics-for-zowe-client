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


import * as React from "react";

import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import Table from "../common/Table";
import { addVscMessageListener, IResourceInspectorIconPath, IResourceInspectorProps, IResourceInspectorResource, postVscMessage, removeVscMessageListener } from "../common/vscode";
import ResourceCompare from "./ResourceCompare";

const ResourceInspector = () => {

  const [resources, setResources] = React.useState<IResourceInspectorResource[]>([]);
  const [resourceHeaders, setResourceHeaders] = React.useState<(string | React.JSX.Element)[]>([]);
  const [resourceRows, setResourceRows] = React.useState<string[][]>([]);

  const [isComparing, setIsComparing] = React.useState(false);

  const [resourceHumanName, setHumanName] = React.useState<{ plural: string; singular: string; }>();
  const [resourceIconPath, setResourceIconPath] = React.useState<IResourceInspectorIconPath>();

  React.useEffect(() => {

    const listener = (event: MessageEvent<IResourceInspectorProps>): void => {
      setResources(event.data.resources);
      setHumanName({
        plural: event.data.humanReadableNamePlural,
        singular: event.data.humanReadableNameSingular,
      });
      setResourceIconPath(event.data.resourceIconPath);
    };

    addVscMessageListener(listener);
    postVscMessage({ command: "init" });

    return () => {
      removeVscMessageListener(listener);
    };
  }, []);


  React.useEffect(() => {
    if (!resources || resources.length === 0) {
      return;
    }

    if (resources.length > 2) {
      const _headers = ["Resource", ...Object.keys(resources[0].resource).filter((r) => !r.startsWith("_")).map((r) => r.toUpperCase())];
      const _rows = resources.map((res) => {
        const newRes: { [key: string]: string; } = {};
        for (const [k, v] of Object.entries(res.resource)) {
          if (!k.startsWith("_")) {
            newRes[k] = v;
          }
        }
        return [res.name, ...Object.values(newRes)];
      });

      setResourceHeaders(_headers);
      setResourceRows(_rows);
      setIsComparing(false);
    } else {
      const _headers: (string | React.JSX.Element)[] = ["Attribute"];
      if (resources.length > 1) {
        _headers.push(...resources.map((res) => <RegionResourceBreadcrumb regionName={res.context.regionName} resourceName={res.name} />));
      } else {
        _headers.push("Value");
      }

      const attributes = Object.keys(resources[0].resource).filter((attr) => !attr.startsWith("_"));
      const _rows = attributes.map((attr: keyof IResource) => [attr, ...resources.map((res) => res.resource[attr])]);

      setResourceHeaders(_headers);
      setResourceRows(_rows);
      setIsComparing(true);
    }
  }, [resources]);


  return (
    <div
      className="flex flex-col items-start gap-0 py-0 px-4 min-w-lg w-full max-w-7xl"
      data-vscode-context='{"webviewSection": "main", "mouseCount": 4}'>

      {resources?.length === 1 && (
        <>
          <div className="sticky top-0 w-full bg-(--vscode-panel-border) px-2 h-8 flex items-center justify-between">
            <BreadcrumbSection
              cicsplexName={resources[0].context.cicsplexName}
              regionName={resources[0].context.regionName}
              resourceName={resources[0].name}
              resourceIconPath={resourceIconPath}
            />

            <div className="flex gap-2 items-center">
              <RefreshButton />
              <MenuButton />
            </div>
          </div>

          <HighlightsSection resource={resources[0]} />

          <div className="w-full">
            <Table
              headers={resourceHeaders}
              rows={resourceRows}
              highlightDifferences={false}
              stickyLevel={1}
            />
          </div>
        </>
      )}

      {resources?.length === 2 && <ResourceCompare resources={resources} />}
      {resources?.length > 2 && (
        <>
          <div className="sticky top-0 w-full bg-(--vscode-panel-border) px-2 h-8 flex items-center justify-between">

            <BreadcrumbSection
              cicsplexName={resources[0].context.cicsplexName}
              regionName={resources[0].context.regionName}
              resourceType={resourceHumanName.plural}
              resourceIconPath={resourceIconPath}
            />

            <div className="flex gap-2 items-center">
              <RefreshButton />
              <MenuButton />
            </div>
          </div>

          <div className="w-full">
            <Table
              headers={resourceHeaders}
              rows={resourceRows}
              highlightDifferences={isComparing}
              stickyLevel={1}
            />
          </div>
        </>
      )}

    </div>
  );
};

const Chevron = () => <span className="text-(--vscode-disabledForeground)">{">"}</span>;
const SecondaryText = ({ txt }: { txt: string; }) => <> <span className="text-(--vscode-disabledForeground)">{txt}</span> <Chevron /></>;

const RegionResourceBreadcrumb = (props: { regionName: string; resourceName: string; }) => {
  return (
    <div className="flex gap-1">
      <SecondaryText txt={props.regionName} />
      <span className="font-bold">{props.resourceName}</span>
    </div>
  );
};

const BreadcrumbSection = (props: { cicsplexName?: string; regionName?: string; resourceName?: string; resourceType?: string; resourceIconPath?: IResourceInspectorIconPath; }) => {


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

const HighlightsSection = ({ resource }: { resource: IResourceInspectorResource; }) => {
  return (
    <div className="flex flex-col gap-0.5 px-4 mt-2 mb-4">
      {resource.highlights.map((h) => (
        <div className="text-sm"><span className="text-(--vscode-disabledForeground)">{h.key}: </span>{h.value}</div>
      ))}
    </div>
  );
};

const RefreshButton = () => {
  return <span
    className="codicon codicon-refresh rotate-45 cursor-pointer font-bold"
    onClick={(e) => console.log("CLICKED REFRESH")}
  />;
};
const MenuButton = () => {
  return <span
    className="codicon codicon-kebab-vertical rotate-90 cursor-pointer font-bold"
    onClick={(e) => console.log("CLICKED MENU")}
  />;
};

export default ResourceInspector;
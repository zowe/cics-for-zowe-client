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
import { BreadcrumbSection, MenuButton, RefreshButton } from "../common/Breadcrumb";
import Table from "../common/Table";
import { IResourceInspectorIconPath, IResourceInspectorResource } from "../common/vscode";

const SingleResource = ({ resources, resourceIconPath }: { resources: IResourceInspectorResource[]; resourceIconPath: IResourceInspectorIconPath; }) => {

  const [resourceHeaders, setResourceHeaders] = React.useState<(string | React.JSX.Element)[]>([]);
  const [resourceRows, setResourceRows] = React.useState<string[][]>([]);

  React.useEffect(() => {
    if (!resources || resources.length !== 1) {
      return;
    }

    const _headers: (string | React.JSX.Element)[] = ["Attribute", "Value"];
    const attributes = Object.keys(resources[0].resource).filter((attr) => !attr.startsWith("_"));
    const _rows = attributes.map((attr: keyof IResource) => [attr, ...resources.map((res) => res.resource[attr])]);

    setResourceHeaders(_headers);
    setResourceRows(_rows);

  }, [resources]);


  return (
    <>
      <div className="sticky top-0 w-full bg-(--vscode-panel-border) px-2 h-8 flex items-center justify-between">
        <BreadcrumbSection
          cicsplexName={resources[0].context.cicsplexName}
          regionName={resources[0].context.regionName}
          resourceName={resources[0].name}
          resourceIconPath={resourceIconPath}
        />

        <div className="flex gap-2 items-center">
          <RefreshButton onClick={() => console.log("REFRESHING FROM RI")} />
          <MenuButton data={resources[0].actions.map((ac) => { return { label: ac.name, value: ac.id, resources: resources, resourceName: resources[0].name, resourceContext: resources[0].context }; })} />
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
  );
};

const HighlightsSection = ({ resource }: { resource: IResourceInspectorResource; }) => {
  return (
    <div className="flex flex-col gap-0.5 px-4 mt-2 mb-4">
      {resource.highlights.map((h) => (
        <div key={h.attribute} className="text-sm"><span className="text-(--vscode-disabledForeground)">{h.key}: </span>{h.value}</div>
      ))}
    </div>
  );
};

export default SingleResource;
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

import { BreadcrumbSection, MenuButton, RefreshButton } from "../common/Breadcrumb";
import Table from "../common/Table";
import { IResourceInspectorIconPath, IResourceInspectorResource } from "../common/vscode";

const ResourceTable = ({ resources, resourceIconPath }: { resources: IResourceInspectorResource[]; resourceIconPath: IResourceInspectorIconPath; }) => {

  const [resourceHeaders, setResourceHeaders] = React.useState<(string | React.JSX.Element)[]>([]);
  const [resourceRows, setResourceRows] = React.useState<string[][]>([]);

  React.useEffect(() => {
    if (!resources || resources.length <= 2) {
      return;
    }

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

  }, [resources]);


  return (
    <>
      <div className="sticky top-0 w-full bg-(--vscode-panel-border) px-2 h-8 flex items-center justify-between">

        <BreadcrumbSection
          cicsplexName={resources[0].context.cicsplexName}
          regionName={resources[0].context.regionName}
          resourceType={resources[0].meta.humanReadableNamePlural}
          resourceIconPath={resourceIconPath}
        />

        <div className="flex gap-2 items-center">
          <RefreshButton onClick={() => console.log("REFRESHING FROM RI TABLE VIEW")} />
          <MenuButton data={[]} />
        </div>
      </div>

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

export default ResourceTable;
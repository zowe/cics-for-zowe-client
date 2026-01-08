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
import { RegionResourceBreadcrumb } from "../common/Breadcrumb";
import Table from "../common/Table";
import { IResourceInspectorResource } from "../common/vscode";

const ResourceCompare = ({ resources }: { resources: IResourceInspectorResource[]; }) => {

  const [resourceHeaders, setResourceHeaders] = React.useState<(string | React.JSX.Element)[]>([]);
  const [resourceRows, setResourceRows] = React.useState<string[][]>([]);

  React.useEffect(() => {
    if (!resources || resources.length !== 2) {
      return;
    }

    const _headers = [
      "Attribute",
      ...resources.map(
        (res) => <RegionResourceBreadcrumb profileName={res.context.profile.name} cicsplexName={res.context.cicsplexName} regionName={res.resource.eyu_cicsname} resourceName={res.name} menuData={res.actions.map((ac) => { return { label: ac.name, value: ac.id, resourceName: res.name, resourceContext: res.context, resources: [res] }; })} />
      ),
    ];
    const attributes = Object.keys(resources[0].resource).filter((attr) => !attr.startsWith("_"));
    const _rows = attributes.map((attr: keyof IResource) => [attr, ...resources.map((res) => res.resource[attr])]);

    setResourceHeaders(_headers);
    setResourceRows(_rows);

  }, [resources]);


  return (
    <div className="w-full">
      <Table
        headers={resourceHeaders}
        rows={resourceRows}
        highlightDifferences={true}
        refresh={() => console.log("REFRESHINGG FROM RESOURCE COMPARE")}
        stickyLevel={0}
      />
    </div>
    // </>
  );
};

export default ResourceCompare;
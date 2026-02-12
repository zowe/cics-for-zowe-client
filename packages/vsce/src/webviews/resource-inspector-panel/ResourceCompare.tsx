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

import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { JSX, useEffect, useState } from "react";
import { IResourceInspectorResource, postVscMessage } from "../common/vscode";
import { Breadcrumb } from "./Breadcrumb";
import CompareTable from "./CompareTable";
import { renderHyperlinkableValue } from "./utils/hyperlinkUtils";

const ResourceCompare = ({ resources }: { resources: IResourceInspectorResource[]; }) => {

  const [resourceHeaders, setResourceHeaders] = useState<(string | JSX.Element)[]>([]);
  const [resourceRows, setResourceRows] = useState<(string | JSX.Element)[][]>([]);

  useEffect(() => {
    if (!resources || resources.length !== 2) {
      return;
    }

    const _headers = [
      "ATTRIBUTE",
      ...resources.map((res, idx) => (
        <Breadcrumb
          cicsplexName={res.context.cicsplexName}
          regionName={res.resource.eyu_cicsname}
          resourceName={res.name}
          actions={res.actions}
          resources={[res]}
          tabIndex={idx + 1}
        />
      )),
    ];

    const attributes = Object.keys(resources[0].resource).filter((attr) => !attr.startsWith("_"));
    const _rows = attributes.map(
      (attr: keyof IResource) => [
        attr.toUpperCase(),
        ...resources.map(
          (res) => renderHyperlinkableValue(res.resource[attr], res.context)
        )
      ]
    );

    setResourceHeaders(_headers);
    setResourceRows(_rows);

  }, [resources]);

  const handleRefresh = () => {
    postVscMessage({
      type: "refresh",
      resources,
    });
  };

  return (
    <div className="w-full pb-16">
      <CompareTable
        headers={resourceHeaders}
        rows={resourceRows}
        onRefresh={handleRefresh}
        className="table-fixed min-w-xl"
        refreshTabIndex={3}
        searchTabIndex={4}
      />
    </div>
  );
};

export default ResourceCompare;
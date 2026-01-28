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
import { RefreshButton } from "../common/RefreshButton";
import Table from "../common/Table";
import { useTheme } from "../common/ThemeContext";
import { IResourceInspectorIconPath, IResourceInspectorResource, postVscMessage } from "../common/vscode";
import { Breadcrumb } from "./Breadcrumb";
import { renderHyperlinkableValue } from "./utils/hyperlinkUtils";

const SingleResource = ({ resources, resourceIconPath }: { resources: IResourceInspectorResource[]; resourceIconPath: IResourceInspectorIconPath; }) => {
  const { isDark } = useTheme();
  const [resourceHeaders, setResourceHeaders] = useState<(string | JSX.Element)[]>([]);
  const [resourceRows, setResourceRows] = useState<(string | JSX.Element)[][]>([]);

  useEffect(() => {
    if (!resources || resources.length !== 1) {
      return;
    }

    const _headers: (string | JSX.Element)[] = ["ATTRIBUTE", "VALUE"];
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

  const refreshResource = () => {
    postVscMessage({
      command: "refresh",
      resources,
    });
  };


  return (
    <>
      <div className={`sticky top-0 w-full bg-(--vscode-panel-background) ${isDark ? "brightness-125" : "brightness-97"} z-50 px-2 h-8 flex items-center justify-between`}>
        <Breadcrumb
          cicsplexName={resources[0].context.cicsplexName}
          regionName={resources[0].context.regionName}
          resourceName={resources[0].name}
          resourceType={resources[0].meta.humanReadableNameSingular}
          resourceIconPath={resourceIconPath}
          actions={resources[0].actions}
          resources={resources}
          tabIndex={1}
        />

        <RefreshButton onClick={refreshResource} tabIndex={2} />
      </div>

      <HighlightsSection resource={resources[0]} />

      <div className="w-full">
        <Table
          headers={resourceHeaders}
          rows={resourceRows}
          stickyLevel={1}
          searchTabIndex={3}
        />
      </div>
    </>
  );
};

const HighlightsSection = ({ resource }: { resource: IResourceInspectorResource; }) => {
  return (
    <div className="flex flex-col gap-0.5 px-4 mt-2 mb-4">
      {resource.highlights.map((h) => (
        <div key={h.key} className="text-sm">
          <span className="text-(--vscode-disabledForeground)">{h.key}: </span>
          {h.value}
        </div>
      ))}
    </div>
  );
};

export default SingleResource;
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

import type { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { type JSX, useEffect, useState } from "react";
import { RefreshButton } from "../common/RefreshButton";
import Table from "../common/Table";
import { useTheme } from "../common/ThemeContext";
import { type IResourceInspectorIconPath, type IResourceInspectorResource, postVscMessage } from "../common/vscode";
import { Breadcrumb } from "./Breadcrumb";
import { ContextMenu } from "./Contextmenu";
import { renderHyperlinkableValue } from "./utils/hyperlinkUtils";

const SingleResource = ({
  resources,
  resourceIconPath,
  shouldRenderDatasetLinks,
}: {
  resources: IResourceInspectorResource[];
  resourceIconPath: IResourceInspectorIconPath;
  shouldRenderDatasetLinks: boolean;
}) => {
  const { isDark } = useTheme();
  const [resourceHeaders, setResourceHeaders] = useState<(string | JSX.Element)[]>([]);
  const [resourceRows, setResourceRows] = useState<(string | JSX.Element)[][]>([]);

  useEffect(() => {
    if (!resources || resources.length !== 1) {
      return;
    }

    const _headers: (string | JSX.Element)[] = ["ATTRIBUTE", "VALUE"];
    const attributes = Object.keys(resources[0].resource).filter((attr) => !attr.startsWith("_"));
    const _rows = attributes.map((attr: keyof IResource) => [
      attr.toUpperCase(),
      ...resources.map((res) => renderHyperlinkableValue(res.resource[attr], res.context, shouldRenderDatasetLinks)),
    ]);

    setResourceHeaders(_headers);
    setResourceRows(_rows);
  }, [resources, shouldRenderDatasetLinks]);

  const refreshResource = () => {
    postVscMessage({
      type: "refresh",
      resources,
    });
  };

  return (
    <>
      <div
        className={`sticky top-2 w-full bg-(--vscode-editor-background) ${
          isDark ? "bg-lighter" : "bg-darker"
        } z-50 px-2 h-8 flex items-center justify-between`}
      >
        <Breadcrumb
          cicsplexName={resources[0].context.cicsplexName}
          regionName={resources[0].context.regionName}
          resourceName={resources[0].name}
          resourceType={resources[0].meta.humanReadableNameSingular}
          resourceIconPath={resourceIconPath}
          tabIndex={1}
          showContextMenu={false}
        />

        <div className="flex items-center gap-2">
          {resources[0].actions && resources[0].actions.length > 0 && (
            <ContextMenu
              tabIndex={2}
              data={resources[0].actions.map((ac) => ({
                label: ac.name,
                value: ac.id,
                resourceName: resources[0].name || "",
                resourceContext: resources[0].context,
                resources: resources,
              }))}
            />
          )}
          <RefreshButton onClick={refreshResource} tabIndex={3} />
        </div>
      </div>

      <HighlightsSection resource={resources[0]} />

      <div className="w-full">
        <Table headers={resourceHeaders} rows={resourceRows} stickyLevel={1} searchTabIndex={3} />
      </div>
    </>
  );
};

const HighlightsSection = ({ resource }: { resource: IResourceInspectorResource }) => {
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

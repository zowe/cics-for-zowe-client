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
import * as vscode from "../common/vscode";

import { IResource, IResourceProfileNameInfo } from "@zowe/cics-for-zowe-explorer-api";
import Table from "../common/Table2";

const ResourceInspector = () => {

  const [resources, setResources] = React.useState<vscode.Resource[]>([]);
  const [context, setContext] = React.useState<IResourceProfileNameInfo>();

  const [resourceHeaders, setResourceHeaders] = React.useState<string[]>([]);
  const [resourceRows, setResourceRows] = React.useState<string[][]>([]);

  const [isComparing, setIsComparing] = React.useState(false);

  React.useEffect(() => {
    const listener = (event: MessageEvent<vscode.TransformWebviewMessage>): void => {
      setResources(event.data.resources);
      setContext(event.data.context);
    };

    vscode.addVscMessageListener(listener);
    vscode.postVscMessage({ command: "init" });

    return () => {
      vscode.removeVscMessageListener(listener);
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
      const _headers = ["Attribute", ...resources.map((res) => res.name)];

      const attributes = Object.keys(resources[0].resource).filter((attr) => !attr.startsWith("_"));
      const _rows = attributes.map((attr: keyof IResource) => [attr, ...resources.map((res) => res.resource[attr])]);

      setResourceHeaders(_headers);
      setResourceRows(_rows);
      setIsComparing(true);
    }
  }, [resources]);


  return (
    <div
      className="flex flex-col items-start gap-4 py-0 px-4 min-w-lg w-full"
      data-vscode-context='{"webviewSection": "main", "mouseCount": 4}'>

      <div className="sticky top-0 w-full bg-(--vscode-panel-border) px-2 h-8 flex items-center gap-2">
        {context && resources?.length > 0 && (
          <>
            <span className="font-bold">{context.regionName}</span>
            <span>{">"}</span>
            <span className="font-bold">{resources[0].name}</span>
          </>
        )}
      </div>

      <div className="w-full py-4">
        <Table
          headers={resourceHeaders}
          rows={resourceRows}
          highlightDifferences={isComparing}
        />
      </div>

    </div>
  );
};

export default ResourceInspector;
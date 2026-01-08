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

import { addVscMessageListener, IResourceInspectorIconPath, IResourceInspectorProps, IResourceInspectorResource, postVscMessage, removeVscMessageListener } from "../common/vscode";
import ResourceCompare from "./ResourceCompare";
import ResourceTable from "./ResourceTable";
import SingleResource from "./SingleResource";

const ResourceInspector = () => {

  const [resources, setResources] = React.useState<IResourceInspectorResource[]>([]);
  const [resourceIconPath, setResourceIconPath] = React.useState<IResourceInspectorIconPath>();

  React.useEffect(() => {

    const listener = (event: MessageEvent<IResourceInspectorProps>): void => {
      setResources(event.data.resources);
      setResourceIconPath(event.data.resourceIconPath);
    };

    addVscMessageListener(listener);
    postVscMessage({ command: "init" });

    return () => {
      removeVscMessageListener(listener);
    };
  }, []);

  return (
    <div
      className="flex flex-col items-start gap-0 py-0 px-4 min-w-lg w-full max-w-7xl"
      data-vscode-context='{"webviewSection": "main", "mouseCount": 4}'
    >

      {resources?.length === 1 && <SingleResource resources={resources} resourceIconPath={resourceIconPath} />}
      {resources?.length === 2 && <ResourceCompare resources={resources} />}
      {resources?.length > 2 && <ResourceTable resources={resources} resourceIconPath={resourceIconPath} />}
    </div>
  );
};

export default ResourceInspector;
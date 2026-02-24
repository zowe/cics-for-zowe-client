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

import { useEffect, useState } from "react";
import {
  IResourceInspectorIconPath,
  IResourceInspectorResource,
  addVscMessageListener,
  postVscMessage,
  removeVscMessageListener,
} from "../common/vscode";
import ResourceCompare from "./ResourceCompare";
import SingleResource from "./SingleResource";

const ResourceInspector = () => {
  const [resources, setResources] = useState<IResourceInspectorResource[]>([]);
  const [resourceIconPath, setResourceIconPath] = useState<IResourceInspectorIconPath>();
  const [shouldRenderDatasetLinks, setShouldRenderDatasetLinks] = useState<boolean>(false);

  useEffect(() => {
    const listener = (event: MessageEvent): void => {
      if (event.data.type === "updateResources") {
        setResources(event.data.resources);
        setResourceIconPath(event.data.resourceIconPath);
        setShouldRenderDatasetLinks(event.data.shouldRenderDatasetLinks ?? false);
      }
    };

    addVscMessageListener(listener);
    postVscMessage({ type: "init" });

    return () => {
      removeVscMessageListener(listener);
    };
  }, []);

  return (
    <div
      className="flex flex-col items-start gap-0 py-0 px-4 min-w-xl w-full max-w-7xl bg-(--vscode-editor-background)"
      data-vscode-context='{"webviewSection": "main", "mouseCount": 4}'
    >
      <div className="z-80 w-full h-2 sticky top-0 bg-(--vscode-editor-background)" />
      {resources?.length === 1 && (
        <SingleResource resources={resources} resourceIconPath={resourceIconPath} shouldRenderDatasetLinks={shouldRenderDatasetLinks} />
      )}
      {resources?.length === 2 && <ResourceCompare resources={resources} shouldRenderDatasetLinks={shouldRenderDatasetLinks} />}
    </div>
  );
};

export default ResourceInspector;

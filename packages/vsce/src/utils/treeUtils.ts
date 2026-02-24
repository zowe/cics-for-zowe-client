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

import type { IResource, IResourceContext } from "@zowe/cics-for-zowe-explorer-api";
import type { ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import type { IContainedResource, IResourceMeta } from "../doc";
import { Resource } from "../resources";
import type { CICSResourceContainerNode, CICSTree } from "../trees";
import { toArray } from "./commandUtils";

export function evaluateTreeNodes<T extends IResource>(node: CICSResourceContainerNode<T>, response: ICMCIApiResponse, meta: IResourceMeta<T>) {
  if (response?.response?.records[meta.resourceName.toLowerCase()]) {
    const singleResource = toArray(response.response.records[meta.resourceName.toLowerCase()])[0];
    const updatedResource = new Resource<T>(singleResource);

    if (node.getParent()) {
      (node.getParent() as CICSResourceContainerNode<T>).updateStoredItem({ meta, resource: updatedResource });
    }
  }
}

export const findResourceNodeInTree = (
  cicsTree: CICSTree,
  resourceContext: IResourceContext,
  resource: IContainedResource<IResource>
): CICSResourceContainerNode<IResource> | undefined => {
  const sessionNodeForResource = cicsTree.getSessionNodeForProfile(resourceContext.profile);
  if (sessionNodeForResource?.children?.length > 0) {
    const regionNode = sessionNodeForResource.getRegionNodeFromName(resourceContext.regionName, resourceContext.cicsplexName);
    if (regionNode?.children?.length > 0) {
      const parentNode = regionNode.getContainerNodeForResourceType(resource.meta);
      if (parentNode?.children?.length > 0) {
        return parentNode.getChildNodeMatchingResourceName(resource);
      }
    }
  }
};

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
import { ICMCIApiResponse } from "@zowe/cics-for-zowe-sdk";
import { Resource } from "../resources";
import { CICSResourceContainerNode } from "../trees";
import { toArray } from "./commandUtils";
import { IResourceMeta } from "../doc";

export function evaluateTreeNodes<T extends IResource>(
  node: CICSResourceContainerNode<T>,
  response: ICMCIApiResponse,
  meta: IResourceMeta<T>
) {
  const parentNode = node.getParent() as CICSResourceContainerNode<T>;

  if (response?.response?.records[meta.resourceName.toLowerCase()]) {
    const singleResource = toArray(response.response.records[meta.resourceName.toLowerCase()])[0];
    const updatedResource = new Resource<T>(singleResource);
    node.setContainedResource(updatedResource);
    node.buildProperties();

    if (parentNode) {
      parentNode.refreshingDescription = true;
    }
  }
}

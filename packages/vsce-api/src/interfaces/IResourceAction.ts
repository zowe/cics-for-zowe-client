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

import { ResourceTypes } from "../resources";
import { IResource } from "./resources/IResource";
import { IResourceContext } from "./IResourceContext";

export interface IResourceAction<T extends IResource> {
  id: string;
  name: string;
  resourceType: ResourceTypes;
  visibleWhen?: (resource: T, resourceContext: IResourceContext) => boolean | Promise<boolean>;
  action: string | ((resource: T, resourceContext: IResourceContext) => void | Promise<void>);
}

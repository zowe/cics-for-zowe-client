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
import { IResource } from "./IResource";
import { IResourceContext } from "./IResourceContext";

export interface IResourceAction {
  id: string;
  name: string;
  resourceType: ResourceTypes;
  iconPath?: string;
  visibleWhen?: (resource: IResource, resourceContext: IResourceContext) => boolean | Promise<boolean>;
  enabledWhen?: (resource: IResource, resourceContext: IResourceContext) => boolean | Promise<boolean>;
  action: string | ((resource: IResource, resourceContext: IResourceContext) => void | Promise<void>);
}

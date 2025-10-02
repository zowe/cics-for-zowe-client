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

import { IResourceAction } from "./IResourceAction";
import { IResource } from "./resources";

export interface IResourceExtender {
  registeredActions: IResourceAction<IResource>[];

  registerAction: (action: IResourceAction<IResource>) => void;
  deregisterAction: (id: string) => void;
  getActions: () => IResourceAction<IResource>[];
  getAction: (id: string) => IResourceAction<IResource>;
}

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

import { IResourceWithEnableStatus } from "./IResource";

export interface ILocalFile extends IResourceWithEnableStatus {
  file: string;
  vsamtype: string;
  read: string;
  browse: string;
  keylength: string;
  recordsize: string;
  dsname: string;
  openstatus: string;
  update: string;
  add: string;
  delete: string;
}

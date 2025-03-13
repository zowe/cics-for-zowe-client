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

import { IResource } from "./IResource";

export interface ILocalFile extends IResource {
  file: string;
  enablestatus: string;
  openstatus: string;
  eyu_cicsname: string;
}

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

import { IResourceWithStatus } from "./IResource";

export interface IProgram extends IResourceWithStatus {
  library: string;
  librarydsn: string;
  program: string;
  progtype: string;
  newcopycnt: string;
}

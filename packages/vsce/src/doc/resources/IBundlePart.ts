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

// /CICSSystemManagement/CICSBundlePart/VSCDSMSJ?CRITERIA=BUNDLE='WRITE2Q'
export interface IBundlePart extends IResource {
  bundle: string;
  bundlepart: string;
  enablestatus: string;
  eyu_cicsname: string;
  partclass: string;
}

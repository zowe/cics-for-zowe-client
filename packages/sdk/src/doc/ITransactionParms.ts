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

import { IBaseParms } from "./IBaseParms";

export interface ITransactionParms extends IBaseParms {
  /**
   * The name of the program to associate to the transaction
   * Up to eight characters long
   */
  programName?: string;

  /**
   * CSD group for the transaction
   * Up to eight characters long
   */
  csdGroup?: string;
}

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

import { IResourceAction } from "@zowe/cics-for-zowe-explorer-api";
import { getLocalFileActions } from "./LocalFileActions";
import { getProgramActions } from "./ProgramActions";
import { getTransactionActions } from "./TransactionActions";

export function getBuiltInResourceActions(): IResourceAction[] {
  return [...getProgramActions(), ...getLocalFileActions(), ...getTransactionActions()];
}

export * from "./LocalFileActions";
export * from "./ProgramActions";
export * from "./TransactionActions";
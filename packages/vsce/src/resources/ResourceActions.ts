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

import { ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { IResourceActionWithIcon } from "../doc";
import { getLocalFileActions } from "./actions/LocalFileActions";
import { getProgramActions } from "./actions/ProgramActions";

export function getBuiltInResourceActions(resType: string): IResourceActionWithIcon[] {
  switch (resType) {
    case ResourceTypes.CICSLocalFile.toString(): {
      return getLocalFileActions();
    }
    case ResourceTypes.CICSProgram.toString(): {
      return getProgramActions();
    }
    default: {
      return null;
    }
  }
}
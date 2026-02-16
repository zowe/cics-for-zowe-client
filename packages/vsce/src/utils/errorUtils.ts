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

import { getMetas } from "../doc";
import { URLConstants } from "../errors/urlConstants";

export function getErrorCode(error: any) {
  return error.mDetails?.errorCode || error.response?.status;
}

export function getHelpTopicNameFromMetas(resourceType: string): { docFile: string; anchor: string } | undefined {
  if (resourceType === URLConstants.GET_RESOURCE) {
    return { docFile: URLConstants.GET_COMMAND_URI, anchor: URLConstants.GET_COMMAND_URI_FRAGMENT };
  }
  const result = getResourceTypeAndHelpTopic(resourceType);
  if (!result || !result.docFile) {
    return undefined;
  }
  return { docFile: result.docFile, anchor: result.anchor };
}

export function getEIBFNameFromMetas(eibfnAlt: string): string | undefined {
  return getResourceTypeAndHelpTopic(eibfnAlt)?.eibfnName;
}

function getResourceTypeAndHelpTopic(resourceType: string): { eibfnName: string; docFile: string; anchor: string } | undefined {
  if (!resourceType) {
    return undefined;
  }

  const meta = getMetas().find((m) => m.eibfnName && resourceType.trim().toLowerCase().includes(m.eibfnName.toLowerCase()));

  if (!meta) {
    return undefined;
  }

  return {
    eibfnName: meta.eibfnName,
    docFile: meta.setCommandDocFile,
    anchor: meta.anchorFragmentForSet,
  };
}

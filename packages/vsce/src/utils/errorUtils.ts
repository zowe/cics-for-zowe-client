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

export function getHelpTopicNameFromMetas(resourceType?: string): { queryParam: string; fragment: string } | undefined {
  if (resourceType === URLConstants.GET_RESOURCE) {
    return { queryParam: URLConstants.GET_COMMAND_URI, fragment: URLConstants.GET_COMMAND_URI_FRAGMENT };
  }
  const { queryParam, fragment } = getResourceTypeAndHelpTopic(resourceType);
  return { queryParam, fragment };
}

export function getEIBFNameFromMetas(eibfnAlt?: string): string | undefined {
  return getResourceTypeAndHelpTopic(eibfnAlt)?.eibfnName;
}

function getResourceTypeAndHelpTopic(resourceType?: string): { eibfnName?: string; queryParam?: string; fragment?: string } | undefined {
  if (!resourceType) {
    return undefined;
  }

  const meta = getMetas().find((m) => m.eibfnName && resourceType.trim().toLowerCase().includes(m.eibfnName.toLowerCase()));

  if (!meta) {
    return undefined;
  }

  return {
    eibfnName: meta.eibfnName,
    queryParam: meta.queryParamForSet,
    fragment: meta.anchorFragmentForSet,
  };
}

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

import { env, Uri } from "vscode";
import { URLConstants } from "../errors/urlConstants";
import { getHelpTopicNameFromMetas } from "./errorUtils";

export async function openDocumentation(resourceType: string): Promise<void> {
  const url = generateDocumentationURL(resourceType);
  await env.openExternal(url);
}

export function generateDocumentationURL(resourceType: string): Uri | undefined {
  // eslint-disable-next-line max-len
  const cicsDocHost = `${URLConstants.HOSTNAME}/${URLConstants.DOCPAGE}/${URLConstants.ENLANGUAGE}/${URLConstants.CICSTS_PAGE}/${URLConstants.VERSION}`;
  const baseUri = Uri.parse(cicsDocHost);

  const result = getHelpTopicNameFromMetas(resourceType);

  if (result?.queryParam) {
    return baseUri.with({ query: `topic=${result.queryParam}` });
  }

  // Fallback to default pattern
  return baseUri;
}

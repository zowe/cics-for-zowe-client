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

export async function openDocumentation(resourceType: string | undefined) {
  const url = generateDocumentationURL(resourceType);
  await env.openExternal(url);
}

function generateDocumentationURL(resourceType: string | undefined): Uri {
  // eslint-disable-next-line max-len
  const cicsDocHost = `${URLConstants.HOTSNAME}/${URLConstants.DOCPAGE}/${URLConstants.ENLANGUAGE}/${URLConstants.CICSTS_PAGE}/${URLConstants.VERSION}`;
  //   const topicQuery = `${cicsDocHost}?${URLConstants.TOPIC}=`;
  let url = Uri.parse(cicsDocHost);

  if (resourceType) {
    url = url.with({ query: `topic=${getResourceTypeTopic(resourceType)}` });
  }
  return url;
}

function getResourceTypeTopic(resourceType: string): string {
  if (!resourceType) {
    return undefined;
  }
  return URLConstants.COMMANDS_SET + resourceType.toLowerCase();
}

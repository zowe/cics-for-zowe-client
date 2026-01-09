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

import { generateDocumentationURL } from "../../src/utils/urlUtils";

const resources = [
  "bundle",
  "file",
  "jvmserver",
  "library",
  "pipeline",
  "program",
  "task",
  "tcpipservice",
  "transaction",
  "tsqueue",
  "urimap",
  "webservice",
];

describe("Test suite to validate IBM Documentation URL", () => {
  for (const resource of resources) {
    it(`should successfully validate the documentation link for ${resource}`, async () => {
      const baseUrl = generateDocumentationURL(resource).toString(true);
      const response = await fetchUrlResponse(baseUrl);

      expect(response.status).toBe(200);
      expect(response.url).toBe(baseUrl);
      const content = await response.text();
      expect(content.length).toBeGreaterThan(0);

      const resourceUpperCase = resource.replace("-", " / ").toUpperCase();
      expect(content).toContain(`SET ${resourceUpperCase}`);
    });
  }

  it(`should successfully validate IBM Documentation hompage`, async () => {
    const baseUrl = generateDocumentationURL(undefined).toString(true);

    const response = await fetchUrlResponse(baseUrl);

    expect(response.status).toBe(200);
    expect(response.url).toBe(baseUrl);
    const content = await response.text();
    expect(content.length).toBeGreaterThan(0);

    expect(content).toContain("IBM Documentation");
  });
});

async function fetchUrlResponse(baseUrl: string) {
  return await fetch(baseUrl, {
    method: "GET",
    headers: {
      Accept: "text/html",
    },
  });
}


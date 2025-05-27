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

export function resetAllScenarios(): Promise<void> {
  const request: RequestInfo = new Request("http://localhost:8080/__admin/scenarios/reset", {
    method: "POST",
  });
  // Send the request and print the response
  return fetch(request).then((res) => {
    console.log("got response: ====", res.status);
  });
}

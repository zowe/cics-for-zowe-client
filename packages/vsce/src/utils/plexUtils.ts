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

export function evaluateCicsPlex(plex: any): number {
  return  (plex["status"] === "ACTIVE" && 7) + (plex["accesstype"] === "LOCAL" && 5) + (plex["mpstatus"] === "YES" && 3);
}

export function filterCicsplexByConstraints(cicscicsplex: any[]) {

  const allcicsplexes = new Map<string, any>();
  cicscicsplex.sort((a, b) => evaluateCicsPlex(b) - evaluateCicsPlex(a));

  for (const plex of cicscicsplex) {
    const plexname: string = plex["plexname"];
    const cicsplex = allcicsplexes.get(plexname);
    if (!cicsplex) {
      allcicsplexes.set(plexname, plex);
    }
  }

  return allcicsplexes;
}

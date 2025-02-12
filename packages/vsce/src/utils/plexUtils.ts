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

export interface ICicsPlexInfo {
  _keydata: string;
  accesstype: string,
  botrsupd: string,
  cmasname: string,
  mpstatus: string,
  plexname: string,
  readrs: string,
  rspoolid: string,
  status: string,
  sysid: string,
  toprsupd: string,
  transitcmas: string,
  transitcnt: string,
  updaters: string
}

export function scoreCicsPlexByStatus(plex: ICicsPlexInfo): number {
  return  (plex.status === "ACTIVE" && 7) + (plex.accesstype === "LOCAL" && 5) + (plex.mpstatus === "YES" && 3);
}

// pick the highest scoring cicsplexes if there are duplicates
export function getBestCICSplexes(cicscicsplex: ICicsPlexInfo[]) {
  const allcicsplexes = new Map<string, ICicsPlexInfo>();
  cicscicsplex.sort((a, b) => scoreCicsPlexByStatus(a) - scoreCicsPlexByStatus(b));

  for (const plex of cicscicsplex) {
    allcicsplexes.set(plex.plexname, plex);
  }

  return allcicsplexes;
}

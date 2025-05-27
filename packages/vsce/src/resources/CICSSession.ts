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

import { imperative } from "@zowe/zowe-explorer-api";

export class CICSSession extends imperative.Session {
  cicsplexName?: string;
  regionName?: string;

  private verified: boolean | undefined;

  constructor(profile: imperative.IProfile) {
    super({
      type: imperative.SessConstants.AUTH_TYPE_TOKEN,
      tokenType: imperative.SessConstants.TOKEN_TYPE_LTPA,
      storeCookie: true,

      protocol: profile.protocol,
      hostname: profile.hostname,
      port: Number(profile.port),

      user: profile.user || "",
      password: profile.password || "",

      rejectUnauthorized: profile.rejectUnauthorized,
    });

    this.cicsplexName = profile.cicsPlex;
    this.regionName = profile.regionName;
  }

  setVerified(v: boolean = true) {
    this.verified = v;
  }

  isVerified() {
    return this.verified;
  }
}

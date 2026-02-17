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

import { type IProfile, SessConstants, Session } from "@zowe/imperative";

export class CICSSession extends Session {
  cicsplexName?: string;
  regionName?: string;

  private verified: boolean | undefined;

  constructor(profile: IProfile) {
    const common = {
      protocol: profile.protocol,
      hostname: profile.host,
      port: Number(profile.port),
      rejectUnauthorized: profile.rejectUnauthorized,
    };

    if (profile.certFile && profile.certKeyFile) {
      super({
        ...common,
        type: SessConstants.AUTH_TYPE_CERT_PEM,
        storeCookie: false,
        cert: profile.certFile,
        certKey: profile.certKeyFile,
      });
    } else {
      super({
        ...common,
        type: SessConstants.AUTH_TYPE_TOKEN,
        tokenType: SessConstants.TOKEN_TYPE_LTPA,
        storeCookie: true,
        user: profile.user || "",
        password: profile.password || "",
      });
    }

    this.cicsplexName = profile.cicsPlex;
    this.regionName = profile.regionName;
  }

  setVerified(v: boolean = true) {
    this.verified = v;
  }

  isVerified(): boolean | undefined {
    return this.verified;
  }
}

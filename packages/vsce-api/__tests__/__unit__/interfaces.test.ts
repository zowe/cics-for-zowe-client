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

import { CICSSession } from "@zowe/cics-for-zowe-sdk";
import { imperative } from "@zowe/zowe-explorer-api";
import { IExtensionAPI } from "../../src/interfaces/IExtensionAPI";
import { IResource } from "../../src/interfaces/IResource";
import { IResourceContext } from "../../src/interfaces/IResourceContext";
import { SupportedResourceTypes } from "../../src/resources";

describe("Interfaces", () => {

  const api: IExtensionAPI = {
    resources: {
      supportedResources: SupportedResourceTypes,
    },
  };

  const res: IResource = {
    eyu_cicsname: "REGION1",
    status: "ENABLED",
  };

  const profile: imperative.IProfileLoaded = {
    failNotFound: false,
    message: "",
    type: "cics",
    name: "MYPROF",
    profile: {
      host: "MYHOST",
      port: 1234,
    },
  };

  // @ts-ignore - profile will not be undefined
  const session: CICSSession = new CICSSession(profile.profile);

  const cx: IResourceContext = {
    profile,
    cicsplexName: "myplex",
    regionName: "REGION1",
    session,
  };

  it("should assert IExtensionAPI", () => {
    expect(api).toHaveProperty("resources");
    expect(api.resources).toHaveProperty("supportedResources");
  });
  it("should assert IResource", () => {
    expect(res).toHaveProperty("eyu_cicsname");
    expect(res).toHaveProperty("status");
  });
  it("should assert IResourceContext", () => {
    expect(cx).toHaveProperty("session");
    expect(cx).toHaveProperty("profile");
    expect(cx).toHaveProperty("cicsplexName");
    expect(cx).toHaveProperty("regionName");
  });
});

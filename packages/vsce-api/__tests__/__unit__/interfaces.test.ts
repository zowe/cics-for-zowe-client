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
import { IResourceContext } from "../../src/interfaces/IResourceContext";
import { IResourceExtender } from "../../src/interfaces/IResourceExtender";
import { ResourceTypes, SupportedResourceTypes } from "../../src/resources";
import { IResource } from "../../src/interfaces/resources";
import { IResourceAction } from "../../src/interfaces/IResourceAction";

describe("Interfaces", () => {
  const action: IResourceAction = {
    id: "CICS.CICSProgram.NEWCOPY",
    name: "New Copy Program",
    resourceType: ResourceTypes.CICSProgram,
    action: async (_resource: IResource, _resourceContext: IResourceContext) => { },
    enabledWhen(_resource, _resourceContext) {
      return true;
    },
    visibleWhen(_resource, _resourceContext) {
      return true;
    },
  };

  const extender: IResourceExtender = {
    registeredActions: [],
    deregisterAction(_id) { },
    registerAction(_action) { },
    getAction(_id) {
      return action;
    },
    getActions() {
      return [];
    },
  };

  const api: IExtensionAPI = {
    resources: {
      supportedResources: SupportedResourceTypes,
    },
  };

  const res: IResource = {
    eyu_cicsname: "REGION1",
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

  it("should assert IResourceAction", () => {
    expect(action).toHaveProperty("id");
    expect(action).toHaveProperty("name");
    expect(action).toHaveProperty("resourceType");
    expect(action).toHaveProperty("action");
    expect(action).toHaveProperty("enabledWhen");
    expect(action).toHaveProperty("visibleWhen");
  });
  it("should assert IResourceExtender", () => {
    expect(extender).toHaveProperty("registeredActions");
    expect(extender).toHaveProperty("deregisterAction");
    expect(extender).toHaveProperty("registerAction");
    expect(extender).toHaveProperty("getAction");
    expect(extender).toHaveProperty("getActions");
  });
  it("should assert IExtensionAPI", () => {
    expect(api).toHaveProperty("resources");
    expect(api.resources).toHaveProperty("supportedResources");
  });
  it("should assert IResource", () => {
    expect(res).toHaveProperty("eyu_cicsname");
  });
  it("should assert IResourceContext", () => {
    expect(cx).toHaveProperty("session");
    expect(cx).toHaveProperty("profile");
    expect(cx).toHaveProperty("cicsplexName");
    expect(cx).toHaveProperty("regionName");
  });
});

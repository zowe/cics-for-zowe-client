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
import { ResourceAction, ResourceTypeMap } from "../../src/interfaces/ResourceAction";
import { IProgram, IResource } from "../../src/interfaces/resources";
import { ResourceTypes, SupportedResourceTypes } from "../../src/resources";

describe("Interfaces", () => {
  const action = new ResourceAction({
    id: "CICS.CICSProgram.NEWCOPY",
    name: "New Copy Program",
    resourceType: ResourceTypes.CICSProgram,
    action: async (_resource: IProgram, _resourceContext: IResourceContext) => {},
    visibleWhen(_resource, _resourceContext) {
      return true;
    },
  });

  const extender: IResourceExtender = {
    registeredActions: new Map(),
    registerAction: function <TType extends keyof ResourceTypeMap>(acc: ResourceAction<TType>): void {
      const arr = this.registeredActions.get(acc.resourceType) || [];
      arr.push(acc as unknown as ResourceAction<keyof ResourceTypeMap>);
      this.registeredActions.set(acc.resourceType, arr);
    },
    getActions: function (): ResourceAction<keyof ResourceTypeMap>[] {
      return [...this.registeredActions.values()].flat() as ResourceAction<keyof ResourceTypeMap>[];
    },
    getAction: function (id: string): ResourceAction<keyof ResourceTypeMap> | undefined {
      const actions = this.getActions().filter((ac: ResourceAction<keyof ResourceTypeMap>) => ac.id === id);
      if (actions.length > 0) {
        return actions[0] as ResourceAction<keyof ResourceTypeMap>;
      }
      return undefined;
    },
    getActionsFor: function <TType extends keyof ResourceTypeMap>(type: TType): ResourceAction<TType>[] {
      return (this.registeredActions.get(type) || []) as unknown as ResourceAction<TType>[];
    },
  };

  const api: IExtensionAPI = {
    resources: {
      supportedResources: SupportedResourceTypes,
      resourceExtender: extender,
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

  it("should assert ResourceAction", () => {
    expect(action).toHaveProperty("id");
    expect(action).toHaveProperty("name");
    expect(action).toHaveProperty("resourceType");
    expect(action).toHaveProperty("action");
    expect(action).toHaveProperty("visibleWhen");
  });
  it("should assert IResourceExtender", () => {
    expect(extender).toHaveProperty("registeredActions");
    expect(extender).toHaveProperty("registerAction");
    expect(extender).toHaveProperty("getAction");
    expect(extender).toHaveProperty("getActions");
  });
  it("should assert IExtensionAPI", () => {
    expect(api).toHaveProperty("resources");
    expect(api.resources).toHaveProperty("supportedResources");
    expect(api.resources).toHaveProperty("resourceExtender");
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

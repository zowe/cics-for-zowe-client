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

import { ResourceTypes } from "../resources";
import { IResourceContext } from "./IResourceContext";
import {
  IBundle,
  IJVMServer,
  ILibrary,
  ILocalFile,
  IPipeline,
  IProgram,
  IRemoteFile,
  ISharedTSQueue,
  ITask,
  ITCPIP,
  ITransaction,
  ITSQueue,
  IURIMap,
  IWebService,
} from "./resources";

export interface ResourceTypeMap {
  [ResourceTypes.CICSProgram]: IProgram;
  [ResourceTypes.CICSLocalFile]: ILocalFile;
  [ResourceTypes.CICSRemoteFile]: IRemoteFile;
  [ResourceTypes.CICSLocalTransaction]: ITransaction;
  [ResourceTypes.CICSTCPIPService]: ITCPIP;
  [ResourceTypes.CICSLibrary]: ILibrary;
  [ResourceTypes.CICSURIMap]: IURIMap;
  [ResourceTypes.CICSTask]: ITask;
  [ResourceTypes.CICSPipeline]: IPipeline;
  [ResourceTypes.CICSWebService]: IWebService;
  [ResourceTypes.CICSJVMServer]: IJVMServer;
  [ResourceTypes.CICSBundle]: IBundle;
  [ResourceTypes.CICSTSQueue]: ITSQueue;
  [ResourceTypes.CICSSharedTSQueue]: ISharedTSQueue;
}

export interface ResourceActionOptions<TType extends keyof ResourceTypeMap> {
  id: string;
  name: string;
  resourceType: TType;
  action: string | ((resource: ResourceTypeMap[TType], ctx: IResourceContext) => void | Promise<void>);
  visibleWhen?: (resource: ResourceTypeMap[TType], ctx: IResourceContext) => boolean | Promise<boolean>;
  refreshResourceInspector?: boolean;
}

export class ResourceAction<TType extends keyof ResourceTypeMap> {
  private _id: string;
  private _name: string;
  private _resourceType: TType;
  private _action: ResourceActionOptions<TType>["action"];
  private _visibleWhen: ResourceActionOptions<TType>["visibleWhen"];
  private _refreshResourceInspector: boolean;

  constructor({ id, name, resourceType, action, visibleWhen, refreshResourceInspector }: ResourceActionOptions<TType>) {
    this._id = id;
    this._name = name;
    this._resourceType = resourceType;
    this._action = action;
    this._visibleWhen = visibleWhen;
    this._refreshResourceInspector = refreshResourceInspector ?? true;
  }

  public get id() {
    return this._id;
  }
  public get name() {
    return this._name;
  }
  public get resourceType() {
    return this._resourceType;
  }
  public get visibleWhen() {
    return this._visibleWhen;
  }
  public get action() {
    return this._action;
  }
  public get refreshResourceInspector() {
    return this._refreshResourceInspector;
  }
}

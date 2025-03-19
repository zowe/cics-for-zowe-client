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

import { toArray } from "../utils/commandUtils";
import { IResource, IResourceMeta } from "../doc";
import { CICSSession } from "./CICSSession";
import { Resource } from "./Resource";
import CICSRequester from "../utils/CICSRequester";

export class ResourceContainer<T extends IResource> {
  resources: Resource<T>[] | undefined;

  constructor(private resourceMeta: IResourceMeta<T>, private resource?: Resource<T>) { }

  getMeta() {
    return this.resourceMeta;
  }

  getResource() {
    return this.resource;
  }

  getResources() {
    return this.resources;
  }

  async loadResources(cicsSession: CICSSession, regionName: string, cicsplexName?: string, criteria?: string): Promise<Resource<T>[]> {
    const { response } = await CICSRequester.get(cicsSession, {
      resourceName: this.resourceMeta.resourceName,
      cicsplexName,
      regionName,
      criteria,
    });

    this.resources = toArray(
      response.records[this.resourceMeta.resourceName.toLowerCase()]
    ).map((res: T) => new Resource(res));
    return this.resources;
  }
}

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

import { BundleMeta, IBundle, IProgram, IRegion, IResource, ITransaction, ProgramMeta, TransactionMeta } from "../doc";
import { ResourceContainer } from "./ResourceContainer";

export class Region {
  resourceContainers: { [key: string]: ResourceContainer<IResource>; };
  attributes: IRegion;
  isActive: boolean;

  public belongsToPlex: boolean;
  public plexName?: string;

  constructor(regionResource: IRegion, { belongsToPlex, plexName }: { belongsToPlex: boolean; plexName?: string; }) {
    this.attributes = regionResource;
    this.resourceContainers = {};

    this.belongsToPlex = belongsToPlex;
    this.plexName = plexName;

    this.isActive = [regionResource.cicsstate, regionResource.cicsstatus].includes("ACTIVE");

    if (this.isActive) {
      // TODO: build dynamically from settings of included resources
      this.resourceContainers[ProgramMeta.resourceName] = new ResourceContainer<IProgram>(ProgramMeta);
      this.resourceContainers[TransactionMeta.resourceName] = new ResourceContainer<ITransaction>(TransactionMeta);
      this.resourceContainers[BundleMeta.resourceName] = new ResourceContainer<IBundle>(BundleMeta);
    }
  }

  getResourceContainers() {
    return this.resourceContainers;
  }

  getResourceContainer(resourceName: string) {
    return this.resourceContainers[resourceName];
  }

  getName() {
    return this.attributes.cicsname ?? this.attributes.applid;
  }
}

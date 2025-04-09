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

import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { Resource } from "../../resources/Resource";
import { ILibrary } from "../resources";
import { IResourceMeta } from "./IResourceMeta";
import { LibraryDatasetMeta } from "./libraryDataset.meta";

export const LibraryMeta: IResourceMeta<ILibrary> = {
  resourceName: CicsCmciConstants.CICS_LIBRARY_RESOURCE,
  humanReadableName: "Libraries",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `name=${n}`).join(" OR ");
  },

  getDefaultCriteria: function (): string {
    return "name=*";
  },

  getLabel: function (resource: Resource<ILibrary>): string {
    return `${resource.attributes.name}`;
  },

  getContext: function (resource: Resource<ILibrary>): string {
    return `${CicsCmciConstants.CICS_LIBRARY_RESOURCE}.${resource.attributes.name}`;
  },

  getIconName: function (resource: Resource<ILibrary>): string {
    return "library";
  },

  getName(resource: Resource<ILibrary>): string {
    return resource.attributes.name;
  },

  childType: LibraryDatasetMeta,
};

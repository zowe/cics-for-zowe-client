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
import { PersistentStorage } from "../../utils/PersistentStorage";
import { ILibrary, ILibraryDataset } from "../resources";
import { IResourceMeta } from "./IResourceMeta";
import { ProgramMeta } from "./program.meta";

const persistentStorage = new PersistentStorage("zowe.cics.persistent");

const customProgramMeta = { ...ProgramMeta };
customProgramMeta.getDefaultCriteria = (parentResource: ILibraryDataset) => {
  return Promise.resolve(`(librarydsn='${parentResource.dsname}')`);
};

export const LibraryDatasetMeta: IResourceMeta<ILibraryDataset> = {
  resourceName: CicsCmciConstants.CICS_LIBRARY_DATASET_RESOURCE,
  humanReadableName: "Library Datasets",

  buildCriteria(criteria: string[], parentResource: ILibrary) {
    return `LIBRARY=${parentResource.name} AND (${criteria.map((n) => `DSNAME=${n}`).join(" OR ")})`;
  },

  getDefaultCriteria: function (parentResource: ILibrary) {
    return Promise.resolve(`LIBRARY=${parentResource.name}`);
  },

  getLabel: function (resource: Resource<ILibraryDataset>): string {
    return `${resource.attributes.dsname}`;
  },

  getContext: function (resource: Resource<ILibraryDataset>): string {
    return `${CicsCmciConstants.CICS_LIBRARY_DATASET_RESOURCE}.${resource.attributes.dsname}`;
  },

  getIconName: function (_resource: Resource<ILibraryDataset>): string {
    return "library-dataset";
  },

  getName(resource: Resource<ILibraryDataset>): string {
    return resource.attributes.dsname;
  },

  getHighlights(resource: Resource<ILibraryDataset>) {
    return [
      {
        key: "Library",
        value: resource.attributes.library,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await persistentStorage.addDatasetSearchHistory(criteria);
  },

  getCriteriaHistory() {
    return persistentStorage.getDatasetSearchHistory();
  },

  childType: customProgramMeta,
};

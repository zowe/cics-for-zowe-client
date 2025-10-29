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
import PersistentStorage from "../../utils/PersistentStorage";
import { IResourceMeta } from "./IResourceMeta";
import { ProgramMeta } from "./program.meta";
import { ILibrary, ILibraryDataset, IProgram } from "@zowe/cics-for-zowe-explorer-api";

const customProgramMeta = { ...ProgramMeta };
customProgramMeta.getDefaultCriteria = (parentResource: ILibraryDataset) => {
  return `(LIBRARYDSN='${parentResource.dsname}')`;
};

customProgramMeta.getContext = function (program: Resource<IProgram>): string {
  //overriding context value of cics program because here parent of the cics program is the librarydataset
  return `${CicsCmciConstants.CICS_PROGRAM_RESOURCE}.${program.attributes.status.trim().toUpperCase()}.PARENT.${CicsCmciConstants.CICS_LIBRARY_DATASET_RESOURCE}.${program.attributes.program}`;
};

customProgramMeta.buildCriteria = (criteria: string[], parentResource: ILibraryDataset) => {
  return `(LIBRARYDSN='${parentResource.dsname}') AND (${criteria.map((n) => `PROGRAM=${n}`).join(" OR ")})`;
};

export const LibraryDatasetMeta: IResourceMeta<ILibraryDataset> = {
  resourceName: CicsCmciConstants.CICS_LIBRARY_DATASET_RESOURCE,
  humanReadableNamePlural: "Library Datasets",
  humanReadableNameSingular: "Library Dataset",

  buildCriteria(criteria: string[], parentResource: ILibrary) {
    let criteriaString = `(${criteria.map((n) => `DSNAME='${n}'`).join(" OR ")})`;
    if (parentResource) {
      criteriaString += ` AND (LIBRARY='${parentResource.name}')`;
    }
    return criteriaString;
  },

  getDefaultCriteria: function (parentResource: ILibrary) {
    return `LIBRARY=${parentResource.name}`;
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
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_LIBRARY_DATASET_RESOURCE, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_LIBRARY_DATASET_RESOURCE);
  },

  childType: [customProgramMeta],
  maximumPrimaryKeyLength: 44,
};

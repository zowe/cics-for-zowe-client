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

import { ILibrary } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { l10n } from "vscode";
import { Resource } from "../../resources/Resource";
import PersistentStorage from "../../utils/PersistentStorage";
import { IResourceMeta } from "./IResourceMeta";
import { LibraryDatasetMeta } from "./libraryDataset.meta";

export const LibraryMeta: IResourceMeta<ILibrary> = {
  resourceName: CicsCmciConstants.CICS_LIBRARY_RESOURCE,
  humanReadableNamePlural: l10n.t("Libraries"),
  humanReadableNameSingular: l10n.t("Library"),
  eibfnName: "LIBRARY",
  helpTopicNameForSet: "commands-set-library#setlibrary1__conditions__title__1",

  buildCriteria(criteria: string[]) {
    return criteria.map((n) => `name=${n}`).join(" OR ");
  },

  getDefaultCriteria() {
    return PersistentStorage.getDefaultResourceFilter(CicsCmciConstants.CICS_LIBRARY_RESOURCE, "library");
  },

  getLabel: function (resource: Resource<ILibrary>): string {
    let label = `${resource.attributes.name}`;

    if (resource.attributes.enablestatus.trim().toLowerCase() !== "enabled") {
      const status = resource.attributes.enablestatus.trim().toLowerCase();
      label += ` (${status.charAt(0).toUpperCase()}${status.slice(1)})`;
    }

    return label;
  },

  getContext: function (resource: Resource<ILibrary>): string {
    return `${CicsCmciConstants.CICS_LIBRARY_RESOURCE}.${resource.attributes.enablestatus.trim().toUpperCase()}.${resource.attributes.name}`;
  },

  getIconName: function (resource: Resource<ILibrary>): string {
    let iconName = `library`;
    if (resource.attributes.enablestatus.trim().toUpperCase() === "DISABLED") {
      iconName += `-disabled`;
    }
    return iconName;
  },

  getName(resource: Resource<ILibrary>): string {
    return resource.attributes.name;
  },

  getHighlights(resource: Resource<ILibrary>) {
    return [
      {
        key: l10n.t("Status"),
        value: resource.attributes.enablestatus,
      },
      {
        key: l10n.t("Ranking"),
        value: resource.attributes.ranking,
      },
      {
        key: l10n.t("Number of DS Names"),
        value: resource.attributes.numdsnames,
      },
    ];
  },

  async appendCriteriaHistory(criteria: string) {
    await PersistentStorage.appendSearchHistory(CicsCmciConstants.CICS_LIBRARY_RESOURCE, criteria);
  },

  getCriteriaHistory() {
    return PersistentStorage.getSearchHistory(CicsCmciConstants.CICS_LIBRARY_RESOURCE);
  },

  childType: [LibraryDatasetMeta],
};

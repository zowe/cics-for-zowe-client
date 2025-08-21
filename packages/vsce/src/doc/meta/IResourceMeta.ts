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

import { Resource } from "../../resources/Resource";
import { IResource } from "../resources/IResource";

export interface IResourceMeta<T extends IResource> {
  resourceName: string;
  humanReadableNamePlural: string;
  humanReadableNameSingular: string;

  buildCriteria(criteria: string[], parentResource?: IResource): string;
  getDefaultCriteria(parentResource?: IResource): string;
  getLabel(resource: Resource<T>): string;
  getContext(resource: Resource<T>): string;
  getIconName(resource: Resource<T>): string;
  getName(resource: Resource<T>): string;
  getHighlights(resource: Resource<T>): { key: string; value: string; }[];

  getCriteriaHistory(): string[];
  appendCriteriaHistory(criteria: string): Promise<void>;

  maximumPrimaryKeyLength?: number;
  childType?: IResourceMeta<IResource>;
  filterCaseSensitive?: boolean;
}

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


export interface ResourceMeta<T> {

  resourceName: string;
  humanReadableName: string;
  contextPrefix: string;
  combinedContextPrefix: string;
  filterAttribute: string;
  primaryKeyAttribute: string;

  persistentStorageKey: string;
  persistentStorageAllKey: string;

  getDefaultFilter(): Promise<string>;
  getLabel(resource: T): string;
  getContext(resource: T): string;
  getIconName(resource: T): string;

}

export default ResourceMeta;

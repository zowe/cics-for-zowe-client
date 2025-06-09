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

import { ConfigurationTarget, workspace } from "vscode";
import constants from "../constants/CICS.defaults";

class SCICSPersistentStorage {
  private static _instance: SCICSPersistentStorage;
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  private persistentKey = "zowe.cics.persistent";
  private pageSizeKey = "zowe.cics.resourcePageCount";
  private maxSearchHistory = constants.PERSISTENT_STORAGE_MAX_LENGTH;

  private constructor() { }

  /**
   * Gets search history for resource type
   *
   * @param resourceName currently in a form similar to "localFile" - will be proper resource names (CICSLocalFile) in V4
   * @returns List of previous searches
   */
  async getResourceSearchHistory(resourceName: string): Promise<string[]> {
    return workspace.getConfiguration(this.persistentKey).get(`${resourceName}SearchHistory`);
  }

  /**
   * Resets search history to empty list for resource type
   *
   * @param resourceName currently in a form similar to "localFile" - will be proper resource names (CICSLocalFile) in V4
   */
  async resetResourceSearchHistory(resourceName: string) {
    await workspace.getConfiguration(this.persistentKey).update(`${resourceName}SearchHistory`, [], ConfigurationTarget.Global);
  }

  /**
   * Adds new item to the saved search history for a resource type
   *
   * @param resourceName currently in a form similar to "localFile" - will be proper resource names (CICSLocalFile) in V4
   * @param entry new search pattern to add to list
   * @returns updated list of previous searches
   */
  async appendResourceSearchHistory(resourceName: string, entry: string): Promise<string[]> {
    let history = new Set([...(await this.getResourceSearchHistory(resourceName))]);
    history.add(entry);

    if (history.size > this.maxSearchHistory) {
      history = new Set([...history].pop());
    }

    return [...history];
  }

  /**
   *
   * @param resourceName CICS Resource name (CICSLocalFile)
   * @param settingsKey current settings name if applicable - defaults to resourceName, will be removed in V4
   * @returns default filter for the given resource type
   */
  async getResourceDefaultFilter(resourceName: string, settingsKey?: string): Promise<string> {
    const constantsKey = `DEFAULT_${resourceName.toUpperCase()}_FILTER` as keyof typeof constants;
    const configKey = `zowe.cics.${settingsKey ?? resourceName}.filter`;

    const filterFromConfig = await workspace.getConfiguration().get(configKey);

    if (!filterFromConfig) {
      const defaultValue = constants[constantsKey];
      await workspace.getConfiguration().update(configKey, defaultValue);
      return `${defaultValue}`;
    }

    return `${filterFromConfig}`;
  }

  /**
   * @returns number of records to return per page of resources
   */
  async getResourcePageSize(): Promise<number> {
    const valFromConfig = await workspace.getConfiguration().get(this.pageSizeKey);

    if (!valFromConfig) {
      await workspace.getConfiguration().update(this.pageSizeKey, constants.DEFAULT_RESOURCE_PAGE_SIZE);
      return constants.DEFAULT_RESOURCE_PAGE_SIZE;
    }

    return parseInt(`${valFromConfig}`, 10);
  }

  private getPersistedConfig() {
    return { ...workspace.getConfiguration(this.persistentKey) };
  }

  async getPersistedCICSProfiles(): Promise<string[]> {
    const settings = this.getPersistedConfig();

    if (!settings?.loadedCICSProfile) {
      settings.loadedCICSProfile = [];
      await this.updatePersistedCICSProfiles(settings.loadedCICSProfile);
    }

    return settings.loadedCICSProfile;
  }

  private async updatePersistedCICSProfiles(profiles: string[]) {
    const existingConfig = this.getPersistedConfig();

    await workspace.getConfiguration().update(this.persistentKey, { ...existingConfig, loadedCICSProfile: profiles }, ConfigurationTarget.Global);
    return profiles;
  }

  async removePersistedCICSProfile(profileNameToRemove: string) {
    const existingProfiles: Set<string> = new Set([...this.getPersistedConfig().loadedCICSProfile]);
    existingProfiles.delete(profileNameToRemove);
    return this.updatePersistedCICSProfiles([...existingProfiles]);
  }

  async appendPersistedCICSProfile(profileNameToAppend: string) {
    const profiles: Set<string> = new Set([...await this.getPersistedCICSProfiles()]);
    profiles.add(profileNameToAppend);
    return this.updatePersistedCICSProfiles([...profiles]);
  }
}

const CICSPersistentStorage = SCICSPersistentStorage.Instance;
export default CICSPersistentStorage;

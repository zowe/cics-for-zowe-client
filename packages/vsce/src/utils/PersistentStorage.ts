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
import { ConfigurationTarget, ExtensionContext, workspace } from "vscode";
import constants from "../constants/CICS.defaults";
import { ILastUsedRegion } from "../doc/commands/ILastUsedRegion";

class SPersistentStorage {
  private static _instance: SPersistentStorage;
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }
  private context: ExtensionContext;

  public setContext(cxt: ExtensionContext) {
    this.context = cxt;
  }

  private constructor() {
    this.buildSearchHistoryMap();
  }

  private buildSearchHistoryMap() {
    this.searchHistoryKeyMap = new Map<string, string>();
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_PROGRAM_RESOURCE, "programSearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_LIBRARY_RESOURCE, "librarySearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_LOCAL_TRANSACTION, "transactionSearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_CMCI_LOCAL_FILE, "localFileSearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_TCPIPSERVICE_RESOURCE, "tcpipsSearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_URIMAP, "urimapsSearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_CMCI_PIPELINE, "pipelineSearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_WEBSERVICE_RESOURCE, "webserviceSearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_CMCI_BUNDLE, "bundleSearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_JVMSERVER_RESOURCE, "jvmServerSearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_LIBRARY_DATASET_RESOURCE, "datasetSearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_CMCI_BUNDLE_PART, "bundlePartSearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_CMCI_REGION, "regionSearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_CMCI_JVM_ENDPOINT, "jvmEndpointSearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_CMCI_TS_QUEUE, "tsQueueSearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_CMCI_SHARED_TS_QUEUE, "tsQueueSearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_CMCI_MANAGED_REGION, "managedRegionSearchHistory");
    this.searchHistoryKeyMap.set(CicsCmciConstants.CICS_CMCI_REGION_GROUP, "regionSearchHistory");
  }

  private schema: string = "zowe.cics.persistent";

  private LAST_USED_REGION_KEY = "lastUsedRegion";
  private LOADED_CICS_PROFILES_KEY = "loadedCICSProfile";
  private RESOURCE_PAGE_COUNT_KEY = "zowe.cics.resourcePageCount";

  private searchHistoryKeyMap: Map<string, string>;

  getLastUsedRegion(): ILastUsedRegion {
    return workspace.getConfiguration(this.schema).get(this.LAST_USED_REGION_KEY, { regionName: null, cicsPlexName: null, profileName: null });
  }

  async setLastUsedRegion(lastUsedRegion: ILastUsedRegion): Promise<void> {
    await this.updateSettingsObject(this.LAST_USED_REGION_KEY, lastUsedRegion);
  }

  getSearchHistory(resourceType: string): string[] {
    return workspace.getConfiguration(this.schema).get(this.searchHistoryKeyMap.get(resourceType), []);
  }

  async appendSearchHistory(resourceType: string, content: string): Promise<void> {
    const currentHistory = this.getSearchHistory(resourceType);

    // Append content to start of list, moving existing entry if already there, and ensuring no more than 10 items are present
    const updatedHistory = currentHistory.filter((element) => {
      return element.trim() !== content.trim();
    });
    updatedHistory.unshift(content);
    if (updatedHistory.length > constants.PERSISTENT_STORAGE_MAX_LENGTH) {
      updatedHistory.pop();
    }

    await this.updateSettingsObject(this.searchHistoryKeyMap.get(resourceType), updatedHistory);
  }

  getLoadedCICSProfiles(): string[] {
    return workspace.getConfiguration(this.schema).get(this.LOADED_CICS_PROFILES_KEY, []);
  }

  async appendLoadedCICSProfile(profileName: string) {
    const currentProfiles = this.getLoadedCICSProfiles();
    const updatedProfiles = currentProfiles.filter((element) => {
      return element.trim() !== profileName.trim();
    });
    updatedProfiles.unshift(profileName);

    await this.updateSettingsObject(this.LOADED_CICS_PROFILES_KEY, updatedProfiles);
  }

  async removeLoadedCICSProfile(profileName: string) {
    const currentProfiles = this.getLoadedCICSProfiles();
    const updatedProfiles = currentProfiles.filter((element) => {
      return element.trim() !== profileName.trim();
    });

    await this.updateSettingsObject(this.LOADED_CICS_PROFILES_KEY, updatedProfiles);
  }

  private async updateSettingsObject(key: string, content: any) {
    // Get the full object, update specific property, and push back to settings
    const settings = { ...workspace.getConfiguration(this.schema) };
    settings[key] = content;

    await workspace.getConfiguration().update(this.schema, settings, ConfigurationTarget.Global);
  }

  getDefaultResourceFilter(resourceName: string, settingsKey?: string): string {
    const constantsKey = `DEFAULT_${resourceName.toUpperCase()}_FILTER` as keyof typeof constants;
    const configKey = `zowe.cics.${settingsKey ?? resourceName}.filter`;

    return `${workspace.getConfiguration().get(configKey, constants[constantsKey])}`;
  }

  getNumberOfResourcesToFetch(): number {
    const valFromConfig = workspace.getConfiguration().get(this.RESOURCE_PAGE_COUNT_KEY, constants.DEFAULT_RESOURCE_PAGE_SIZE);
    return parseInt(`${valFromConfig}`, 10);
  }

  public async setCriteria(nodeContextValue: string, criteria?: string) {
    await this.context.workspaceState.update(nodeContextValue, criteria);
  }

  public getCriteria(nodeContextValue: string): string | undefined {
    return this.context.workspaceState.get(nodeContextValue);
  }

  public getCriteriaKeysForSession(profileName: string) {
    return this.context.workspaceState.keys().filter((k: string) => k.startsWith(`${profileName}-`));
  }
}

const PersistentStorage = SPersistentStorage.Instance;
export default PersistentStorage;

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

import { IResource } from "@zowe/cics-for-zowe-explorer-api";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { imperative } from "@zowe/zowe-explorer-api";
import { l10n, TreeItem, TreeItemCollapsibleState, workspace } from "vscode";
import {
  BundleMeta,
  IResourceMeta,
  JVMServerMeta,
  LibraryMeta,
  LocalFileMeta,
  PipelineMeta,
  ProgramMeta,
  RemoteFileMeta,
  SharedTSQueueMeta,
  TaskMeta,
  TCPIPMeta,
  TransactionMeta,
  TSQueueMeta,
  URIMapMeta,
  WebServiceMeta,
} from "../doc";
import { getIconFilePathFromName } from "../utils/iconUtils";
import { runGetResource } from "../utils/resourceUtils";
import { CICSRegionsContainer } from "./CICSRegionsContainer";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSResourceContainerNode } from "./CICSResourceContainerNode";
import { CICSSessionTree } from "./CICSSessionTree";

export class CICSPlexTree extends TreeItem {
  children: (CICSRegionsContainer | CICSRegionTree | CICSResourceContainerNode<IResource>)[] = [];
  plexName: string;
  profile: imperative.IProfileLoaded;
  parent: CICSSessionTree;
  resourceFilters: any;
  activeFilter: string | undefined;
  groupName: string | undefined;
  regionsContainer: CICSRegionsContainer | undefined;

  constructor(plexName: string, profile: imperative.IProfileLoaded, sessionTree: CICSSessionTree, group?: string) {
    super(plexName, TreeItemCollapsibleState.Collapsed);
    this.plexName = plexName;
    this.profile = profile;
    this.parent = sessionTree;
    this.contextValue = `cicsplex.${plexName}`;
    this.resourceFilters = {};
    this.activeFilter = undefined;
    this.groupName = group;
    this.iconPath = group ? getIconFilePathFromName("cics-system-group") : getIconFilePathFromName("cics-plex");
    this.addNewCombinedTrees();
    this.addRegionContainer();
  }

  /**
   * Method for adding a region when a plex AND region name were specified upon profile creation
   */
  public async loadOnlyRegion() {
    const plexProfile = this.getProfile();
    const regionsObtained = await runGetResource({
      profileName: plexProfile.name,
      resourceName: CicsCmciConstants.CICS_CMCI_REGION,
      cicsPlex: plexProfile.profile.cicsPlex,
      regionName: plexProfile.profile.regionName,
    });
    const newRegionTree = new CICSRegionTree(
      plexProfile.profile.regionName,
      regionsObtained.response.records.cicsregion,
      this.getParent(),
      this,
      this
    );
    this.clearChildren();
    this.children.push(newRegionTree);
  }

  public getResourceFilter(regionName: string) {
    return this.resourceFilters[regionName];
  }

  public getPlexName() {
    return this.plexName.split(" ")[0];
  }

  public getProfile() {
    return this.profile;
  }

  public getParent() {
    return this.parent;
  }

  public async getChildren() {
    if (this.profile.profile.regionName && this.profile.profile.cicsPlex && !this.getGroupName()) {
      await this.loadOnlyRegion();
      return this.children;
    }

    await this.regionsContainer.getChildren();
    if (this.regionsContainer.children.length === 0) {
      this.children = [this.regionsContainer];
    }
    this.regionsContainer.collapsibleState = TreeItemCollapsibleState.Expanded;

    return this.children;
  }

  public clearChildren() {
    this.children = [];
  }

  public setLabel(label: string) {
    this.label = label;
    //this.plexName = label;
  }

  public getActiveFilter() {
    return this.activeFilter;
  }

  public addNewCombinedTrees() {
    const config = workspace.getConfiguration("zowe.cics.resources");

    if (config.get<boolean>("Program", true)) {
      this.children.push(this.buildCombinedTree(l10n.t("All {0}", ProgramMeta.humanReadableNamePlural), [ProgramMeta]));
    }
    if (config.get<boolean>("Transaction", true)) {
      this.children.push(this.buildCombinedTree(l10n.t("All {0}", TransactionMeta.humanReadableNamePlural), [TransactionMeta]));
    }
    if (config.get<boolean>("LocalFile", true)) {
      this.children.push(this.buildCombinedTree(l10n.t("All Files"), [LocalFileMeta, RemoteFileMeta]));
    }
    if (config.get<boolean>("Task", true)) {
      this.children.push(this.buildCombinedTree(l10n.t("All {0}", TaskMeta.humanReadableNamePlural), [TaskMeta]));
    }
    if (config.get<boolean>("Library", true)) {
      this.children.push(this.buildCombinedTree(l10n.t("All {0}", LibraryMeta.humanReadableNamePlural), [LibraryMeta]));
    }
    if (config.get<boolean>("Pipeline", true)) {
      this.children.push(this.buildCombinedTree(l10n.t("All {0}", PipelineMeta.humanReadableNamePlural), [PipelineMeta]));
    }
    if (config.get<boolean>("TCP/IPService", true)) {
      this.children.push(this.buildCombinedTree(l10n.t("All {0}", TCPIPMeta.humanReadableNamePlural), [TCPIPMeta]));
    }
    if (config.get<boolean>("URIMap", true)) {
      this.children.push(this.buildCombinedTree(l10n.t("All {0}", URIMapMeta.humanReadableNamePlural), [URIMapMeta]));
    }
    if (config.get<boolean>("WebService", true)) {
      this.children.push(this.buildCombinedTree(l10n.t("All {0}", WebServiceMeta.humanReadableNamePlural), [WebServiceMeta]));
    }
    if (config.get<boolean>("JVMServer", true)) {
      this.children.push(this.buildCombinedTree(l10n.t("All {0}", JVMServerMeta.humanReadableNamePlural), [JVMServerMeta]));
    }
    if (config.get<boolean>("Bundle", true)) {
      this.children.push(this.buildCombinedTree(l10n.t("All {0}", BundleMeta.humanReadableNamePlural), [BundleMeta]));
    }
    if (config.get<boolean>("TSQueue", true)) {
      this.children.push(this.buildCombinedTree(l10n.t("All TS Queues"), [TSQueueMeta, SharedTSQueueMeta]));
    }
    this.children.sort((r1, r2) => `${r1.label}`.localeCompare(`${r2.label}`));
  }

  private buildCombinedTree(label: string, metas: IResourceMeta<IResource>[]) {
    return new CICSResourceContainerNode(
      label,
      {
        profile: this.getProfile(),
        parentNode: this,
        cicsplexName: this.getPlexName(),
      },
      null,
      metas
    );
  }

  public addRegionContainer() {
    const regionContainer = new CICSRegionsContainer(this);
    this.children.unshift(regionContainer);
    this.regionsContainer = regionContainer;
  }

  public getGroupName() {
    return this.groupName;
  }

  getSession() {
    return this.parent.getSession();
  }

  getSessionNode() {
    return this.getParent();
  }

  public getRegionNodeFromName(regionName: string): CICSRegionTree | undefined {
    const regionsContainer = this.children.find((child) => child instanceof CICSRegionsContainer) as CICSRegionsContainer;
    if (regionsContainer?.children?.length > 0) {
      return regionsContainer.children.find((reg) => reg.getRegionName() === regionName);
    }
  }
}

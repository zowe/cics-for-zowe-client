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
import { imperative } from "@zowe/zowe-explorer-api";
import { TreeItem, TreeItemCollapsibleState, workspace } from "vscode";
import {
  IResource,
  IResourceMeta,
  LibraryMeta,
  LocalFileMeta,
  PipelineMeta,
  ProgramMeta,
  TCPIPMeta,
  TaskMeta,
  TransactionMeta,
  URIMapMeta,
  WebServiceMeta,
  JVMServerMeta,
} from "../doc";
import { ResourceContainer } from "../resources";
import { getIconFilePathFromName } from "../utils/iconUtils";
import { runGetResource } from "../utils/resourceUtils";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSRegionsContainer } from "./CICSRegionsContainer";
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
  }

  public addRegion(region: CICSRegionTree) {
    this.children.push(region);
  }

  /**
   * Method for adding a region when a plex AND region name were specified upon profile creation
   */
  public async loadOnlyRegion() {
    const plexProfile = this.getProfile();
    const session = this.getParent().getSession();
    const regionsObtained = await runGetResource({
      session: session,
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
    this.addRegion(newRegionTree);
  }

  // // Store all filters on children resources
  // public findResourceFilters() {
  //   const regionsContainer = this.children.filter(child => child instanceof CICSRegionsContainer)[0];
  //   if (regionsContainer){
  //     for (const region of regionsContainer.getChildren()!) {
  //       if (region instanceof CICSRegionTree) {
  //         if (region.children) {
  //           for (const resourceTree of region.children) {
  //             const filter = resourceTree.getFilter();
  //             if (filter) {
  //               this.resourceFilters[region.getRegionName()] = {[resourceTree.label!.toString().split(' ')[0]]: filter};
  //             } else {
  //               this.resourceFilters[region.getRegionName()] = {[resourceTree.label!.toString().split(' ')[0]]: undefined};
  //             }
  //           }
  //         }
  //       }
  //     }
  //   }
  // }

  // public async reapplyFilter() {
  //   const regionsContainer = this.children.filter(child => child instanceof CICSRegionsContainer)[0];
  //   for (const region of regionsContainer.getChildren()!) {
  //     if (region instanceof CICSRegionTree) {
  //       const resourceFilters = this.getResourceFilter(region.getRegionName());
  //       if (resourceFilters) {
  //         for (const resourceTree of region.children!) {
  //           if (resourceFilters[resourceTree.label!.toString().split(' ')[0]]) {
  //             resourceTree.setFilter(resourceFilters[resourceTree.label!.toString()]);
  //             await resourceTree.loadContents();
  //             resourceTree.collapsibleState = TreeItemCollapsibleState.Expanded;
  //           }
  //         }
  //       }
  //     }
  //   }
  // }

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

  public getChildren() {
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
      this.children.push(this.buildCombinedTree("All Programs", ProgramMeta));
    }
    if (config.get<boolean>("Transaction", true)) {
      this.children.push(this.buildCombinedTree("All Local Transactions", TransactionMeta));
    }
    if (config.get<boolean>("LocalFile", true)) {
      this.children.push(this.buildCombinedTree("All Local Files", LocalFileMeta));
    }
    if (config.get<boolean>("Task", true)) {
      this.children.push(this.buildCombinedTree("All Tasks", TaskMeta));
    }
    if (config.get<boolean>("Library", true)) {
      this.children.push(this.buildCombinedTree("All Libraries", LibraryMeta));
    }
    if (config.get<boolean>("Pipeline", true)) {
      this.children.push(this.buildCombinedTree("All Pipelines", PipelineMeta));
    }
    if (config.get<boolean>("TCP/IPService", true)) {
      this.children.push(this.buildCombinedTree("All TCP/IP Services", TCPIPMeta));
    }
    if (config.get<boolean>("URIMap", true)) {
      this.children.push(this.buildCombinedTree("All URI Maps", URIMapMeta));
    }
    if (config.get<boolean>("WebService", true)) {
      this.children.push(this.buildCombinedTree("All Web Services", WebServiceMeta));
    }
    if (config.get<boolean>("JVMServer", true)) {
      this.children.push(this.buildCombinedTree("All JVM Servers", JVMServerMeta));
    }
  }

  private buildCombinedTree<T extends IResource>(label: string, meta: IResourceMeta<T>) {
    return new CICSResourceContainerNode<T>(
      label,
      {
        session: this.getSession(),
        profile: this.getProfile(),
        parentNode: this,
        cicsplexName: this.getPlexName(),
      },
      null,
      {
        meta,
        resources: new ResourceContainer(meta),
      }
    );
  }

  public addRegionContainer(): CICSRegionsContainer {
    const regionContainer = new CICSRegionsContainer(this);
    this.children.push(regionContainer);
    return regionContainer;
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
}

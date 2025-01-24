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

import { CICSRegionsContainer } from "./CICSRegionsContainer";
import { getIconFilePathFromName } from "../utils/iconUtils";
import { getResource, IResource } from "@zowe/cics-for-zowe-sdk";
import { imperative } from "@zowe/zowe-explorer-api";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { LocalFileMeta, PipelineMeta, ProgramMeta, TaskMeta, TCPIPMeta, TransactionMeta, URIMapMeta } from "../doc";
import { WebServiceMeta } from "../doc/WebServiceMeta";
import { CICSCombinedLibraryTree } from "./CICSCombinedTrees/CICSCombinedLibraryTree";
import { CICSCombinedResourceTree } from "./CICSCombinedTrees/CICSCombinedResourceTree";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSSessionTree } from "./CICSSessionTree";

export class CICSPlexTree extends TreeItem {
  children: (
    | CICSRegionTree
    | CICSCombinedResourceTree<IResource>
    | CICSCombinedLibraryTree
    | CICSRegionsContainer
  )[] = [];
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
    const regionsObtained = await getResource(session, {
      name: "CICSRegion",
      cicsPlex: plexProfile.profile.cicsPlex,
      regionName: plexProfile.profile.regionName,
    });
    const newRegionTree = new CICSRegionTree(
      plexProfile.profile.regionName,
      regionsObtained.response.records.cicsregion,
      this.getParent(),
      this,
      this,
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
    this.children.push(new CICSCombinedResourceTree(this, ProgramMeta));
    this.children.push(new CICSCombinedResourceTree(this, TransactionMeta));
    this.children.push(new CICSCombinedResourceTree(this, LocalFileMeta));
    this.children.push(new CICSCombinedResourceTree(this, TaskMeta));
    this.children.push(new CICSCombinedLibraryTree(this));
    this.children.push(new CICSCombinedResourceTree(this, TCPIPMeta));
    this.children.push(new CICSCombinedResourceTree(this, URIMapMeta));
    this.children.push(new CICSCombinedResourceTree(this, WebServiceMeta));
    this.children.push(new CICSCombinedResourceTree(this, PipelineMeta));
  }

  public addRegionContainer() {
    this.children.push(new CICSRegionsContainer(this));
  }

  public getGroupName() {
    return this.groupName;
  }
}

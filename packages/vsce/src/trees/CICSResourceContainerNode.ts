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

import { CICSSession } from "@zowe/cics-for-zowe-sdk";
import { Gui, imperative } from "@zowe/zowe-explorer-api";
import { TreeItemCollapsibleState, TreeItemLabel } from "vscode";
import { CICSPlexTree, CICSTree } from ".";
import { ICICSTreeNode, IChildResource, IContainedResource, IResource } from "../doc";
import { ResourceContainer } from "../resources";
import IconBuilder from "../utils/IconBuilder";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSTreeNode } from "./CICSTreeNode";
import { TextTreeItem } from "./TextTreeItem";
import { ViewMore } from "./ViewMore";

export class CICSResourceContainerNode<T extends IResource> extends CICSTreeNode implements ICICSTreeNode {
  regionName?: string;
  cicsplexName: string;

  viewMore: boolean = false;
  refreshingDescription: boolean = false;
  loading: boolean = false;

  defaultDescription: string;

  constructor(
    label: string | TreeItemLabel,
    opts: {
      parentNode: CICSRegionTree | CICSResourceContainerNode<IResource> | CICSPlexTree;
      session: CICSSession;
      profile: imperative.IProfileLoaded;
      cicsplexName: string;
      regionName?: string; //Not provided means combined tree..?
    },
    private containedResource?: IContainedResource<T>,
    private childResource?: IChildResource<T>,
    description?: string
  ) {
    super(
      label,
      childResource?.meta ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None,
      // @ts-ignore
      opts.parentNode,
      opts.session,
      opts.profile
    );

    this.description = description;
    this.defaultDescription = description;

    this.regionName = opts.regionName;
    this.cicsplexName = opts.cicsplexName;

    this.contextValue = `CICSResourceNode.${this.label}`;
    if (this.containedResource?.meta) {
      this.contextValue = `CICSResourceNode.${this.containedResource.meta.getContext(this.containedResource.resource)}`;
    }
    if (this.childResource?.meta) {
      this.contextValue += `.FILTERABLE`;
    }
    if (this.childResource?.resources?.isFilterApplied()) {
      this.contextValue += `.FILTERED`;
    }

    this.refreshIcon();
  }

  refreshIcon(folderOpen: boolean = false): void {
    this.iconPath = this.containedResource?.meta ? IconBuilder.resource(this.containedResource) : IconBuilder.folder(folderOpen);
  }

  setLoading(isLoading: boolean = true) {
    this.loading = isLoading;
  }

  async loadPageOfResources() {
    if (this.loading) {
      return;
    }
    this.setLoading();

    if (!this.viewMore) {
      this.childResource.resources.resetContainer();
    }

    const thisParent = this.getParent() as CICSPlexTree | CICSRegionTree | CICSResourceContainerNode<T>;
    const regionToSupply =
      thisParent instanceof CICSPlexTree || thisParent instanceof CICSRegionTree ?
        this.regionName
      : this.getContainedResource().resource.attributes.eyu_cicsname;

    // Searching for resources, with or without region
    const [resources, moreToFetch] = await this.childResource.resources.loadResources(this.getSession(), regionToSupply, this.cicsplexName);

    if (!resources.length) {
      Gui.infoMessage("No resources found");
    }

    this.children = resources
      .map(
        (resource) =>
          new CICSResourceContainerNode(
            this.childResource.meta.getLabel(resource),
            {
              parentNode: this,
              cicsplexName: this.cicsplexName,
              regionName: this.regionName,
              profile: this.getProfile(),
              session: this.getSession(),
            },
            {
              resource,
              meta: this.childResource.meta,
            },
            {
              meta: this.childResource.meta.childType,
              resources: this.childResource.meta.childType ? new ResourceContainer(this.childResource.meta.childType, resource) : null,
            },
            this.regionName ? null : `(${resource.attributes.eyu_cicsname})`
          )
      )
      .sort((a, b) => (a.getContainedResourceName() > b.getContainedResourceName() ? 1 : -1));

    if (moreToFetch) {
      this.children.push(new ViewMore(this));
    }

    this.refreshingDescription = true;
    this.description = `${this.defaultDescription ? this.defaultDescription + " " : ""}${
      this.childResource.resources.isFilterApplied() ? this.childResource.resources.getFilter() : ""
    } [${resources.length} of ${this.childResource.resources.getTotalResources()}]`;

    this.setLoading(false);
    (this.getSessionNode().getParent() as CICSTree)._onDidChangeTreeData.fire(this);
  }

  getContainedResourceName(): string {
    return this.getContainedResource()?.meta.getName(this.getContainedResource()?.resource);
  }

  async getChildren(): Promise<(ICICSTreeNode | TextTreeItem)[]> {
    // Resource type does not have children
    if (!this.childResource?.meta) {
      this.viewMore = false;
      return null;
    }

    if (this.viewMore) {
      this.viewMore = false;
      return this.children;
    }
    if (this.refreshingDescription) {
      this.refreshingDescription = false;
      return this.children;
    }

    // No region so searching at a plex level - filter must be specified
    // Only apply this check to top-level nodes, so resources with children can show them immediately
    if (this.getParent() instanceof CICSPlexTree && !this.regionName && !this.childResource.resources.isFilterApplied()) {
      this.viewMore = false;
      return (this.children = [new TextTreeItem("Use the search button to filter resources", "applyfiltertext.")]);
    }

    await this.loadPageOfResources();
    this.refreshIcon(true);
    this.viewMore = false;
    await this.childResource.resources.resetNumberToFetch();
    return this.children;
  }

  getSessionNode() {
    return this.getParent().getSessionNode();
  }

  getContainedResource(): IContainedResource<T> {
    return this.containedResource;
  }

  getChildResource(): IChildResource<T> {
    return this.childResource;
  }

  setFilter(filter: string[]) {
    this.childResource.resources.setCriteria(filter);
    this.contextValue += `.FILTERED`;
  }

  async clearFilter() {
    await this.childResource.resources.resetCriteria();
    this.contextValue = this.contextValue.replace(".FILTERED", "");
  }
}

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
import { imperative } from "@zowe/zowe-explorer-api";
import { l10n, TreeItemCollapsibleState, TreeItemLabel } from "vscode";
import { CICSPlexTree, TextTreeItem } from ".";
import { ICICSTreeNode, IContainedResource, IResourceMeta } from "../doc";
import { Resource, ResourceContainer } from "../resources";
import IconBuilder from "../utils/IconBuilder";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSTreeNode } from "./CICSTreeNode";
import { ViewMore } from "./ViewMore";

export class CICSResourceContainerNode<T extends IResource> extends CICSTreeNode implements ICICSTreeNode {
  regionName?: string;
  cicsplexName: string;

  private requireDescriptionUpdate: boolean = false;

  defaultDescription: string;

  private items: IContainedResource<IResource>[] = [];
  private fetcher?: ResourceContainer;

  constructor(
    label: string | TreeItemLabel,
    opts: {
      parentNode: CICSRegionTree | CICSResourceContainerNode<IResource> | CICSPlexTree;
      profile: imperative.IProfileLoaded;
      cicsplexName?: string;
      regionName?: string;
    },
    private containedResource?: IContainedResource<T>,
    public resourceTypes: IResourceMeta<T>[] = [],
    description?: string
  ) {
    super(
      label,
      resourceTypes.length > 0 ? TreeItemCollapsibleState.Collapsed : TreeItemCollapsibleState.None,
      // @ts-ignore
      opts.parentNode,
      opts.profile
    );

    this.defaultDescription = description;
    this.regionName = opts.regionName;
    this.cicsplexName = opts.cicsplexName;

    if (resourceTypes.length > 0) {
      this.fetcher = new ResourceContainer(
        this.resourceTypes,
        {
          profileName: this.getProfileName(),
          cicsplexName: this.cicsplexName,
          regionName: this.regionName,
        },
        this.containedResource?.resource
      );
    }

    this.buildProperties();
  }

  buildProperties() {
    this.description = this.defaultDescription;
    this.contextValue = `CICSResourceNode.${this.label}`;
    if (this.containedResource?.meta) {
      this.contextValue = `CICSResourceNode.${this.containedResource.meta.getContext(this.containedResource.resource)}`;
      this.label = this.containedResource.meta.getLabel(this.containedResource.resource);
    }
    if (this.resourceTypes.length > 0) {
      this.contextValue += `.FILTERABLE`;
    }
    if (this.fetcher?.isCriteriaApplied()) {
      this.contextValue += `.FILTERED`;
    }

    this.refreshIcon();
  }

  refreshIcon(folderOpen: boolean = false): void {
    this.iconPath = this.containedResource?.meta ? IconBuilder.resource(this.containedResource) : IconBuilder.folder(folderOpen);
  }

  setContainedResource(resource: Resource<T>) {
    this.containedResource = {
      meta: this.containedResource.meta,
      resource,
    };
  }

  updateStoredItem(updatedItm: IContainedResource<T>) {
    let indexOfOutdatedResource = 0;

    const filtered = this.items.filter((itm, idx) => {
      // Using the resource name AND region applid as unique identifier
      const currentResName = itm.meta.getName(itm.resource);
      const currentResReg = itm.resource.attributes.eyu_cicsname;

      const updatedResName = updatedItm.meta.getName(updatedItm.resource);
      const updatedResReg = updatedItm.resource.attributes.eyu_cicsname;

      if (currentResName === updatedResName && currentResReg === updatedResReg) {
        indexOfOutdatedResource = idx;
        return false;
      }

      return true;
    });

    filtered.splice(indexOfOutdatedResource, 0, updatedItm);
    this.items = filtered;
  }

  setCriteria(criteria: string[]) {
    this.fetcher?.setCriteria(criteria);
    this.contextValue.replaceAll(".FILTERED", "");
    this.contextValue += `.FILTERED`;
  }

  clearCriteria() {
    this.fetcher?.resetCriteria();
    this.contextValue = this.contextValue.replaceAll(".FILTERED", "");
  }

  getSessionNode() {
    return this.getParent().getSessionNode();
  }

  getContainedResource(): IContainedResource<T> {
    return this.containedResource;
  }

  getContainedResourceName() {
    return this.containedResource.meta.getName(this.containedResource.resource);
  }

  async getChildren(): Promise<(CICSResourceContainerNode<IResource> | ViewMore | TextTreeItem)[]> {
    if (!this.fetcher) {
      return [];
    }

    if (this.requireDescriptionUpdate) {
      this.requireDescriptionUpdate = false;
      return this.children as (CICSResourceContainerNode<IResource> | ViewMore)[];
    }

    if (!this.regionName && !this.getFetcher()?.isCriteriaApplied()) {
      this.children = [new TextTreeItem(l10n.t("Use the search button to filter resources"), "applyfiltertext.")];
      this.description = "";
      this.updateDescription();
      return this.children;
    }

    if (this.items.length === 0) {
      const fetched = await this.fetcher.fetchNextPage();
      this.items.push(...fetched);
    }

    const children: (CICSResourceContainerNode<IResource> | ViewMore)[] = this.items.map(
      (r) =>
        new CICSResourceContainerNode(
          r.meta.getLabel(r.resource),
          {
            cicsplexName: this.cicsplexName,
            regionName: this.regionName,
            parentNode: this,
            profile: this.profile,
          },
          {
            meta: r.meta,
            resource: r.resource,
          },
          r.meta.childType,
          this.regionName ? null : `(${r.resource.attributes.eyu_cicsname})`
        )
    );

    if (this.fetcher.hasMore()) {
      children.push(new ViewMore(this));
    }

    this.children = children;

    this.buildDescription();
    this.updateDescription();

    return children;
  }

  private updateDescription() {
    this.requireDescriptionUpdate = true;
    // @ts-ignore
    this.getSessionNode().getParent().refresh(this);
  }

  private buildDescription() {
    this.description = ``;
    if (this.defaultDescription) {
      this.description += `${this.defaultDescription} `;
    }
    if (this.getFetcher().isCriteriaApplied()) {
      this.description += `${this.getFetcher().getCriteria(this.resourceTypes[0])} `;
    }
    const progress = this.fetcher.getProgress();
    if (progress) {
      this.description += `[${progress}]`;
    }

    this.description = this.description.trim();
  }

  async fetchNextPage() {
    if (!this.fetcher) {
      return;
    }
    const fetched = await this.fetcher.fetchNextPage();
    this.items.push(...fetched);

    this.updateDescription();
  }

  getFetcher() {
    return this.fetcher;
  }

  hasMore(): boolean {
    return this.fetcher?.hasMore() ?? false;
  }

  reset() {
    this.items = [];
    this.fetcher?.reset();
  }

  public getChildNodeMatchingResourceName(resource: IContainedResource<IResource>): CICSResourceContainerNode<IResource> | undefined {
    return this.children.find(
      (child: CICSResourceContainerNode<IResource>) => child.getContainedResourceName() === resource.meta.getName(resource.resource)
    ) as CICSResourceContainerNode<IResource>;
  }
}

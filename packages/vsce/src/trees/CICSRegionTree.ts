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

import { TreeItemCollapsibleState } from "vscode";
import { getIconByStatus } from "../utils/iconUtils";
import { CICSPlexTree } from "./CICSPlexTree";
import { CICSSessionTree } from "./CICSSessionTree";
import { CICSResourceContainerNode } from "./CICSResourceContainerNode";
import {
  IResource,
  IResourceMeta,
  LibraryMeta,
  LocalFileMeta,
  PipelineMeta,
  ProgramMeta,
  TaskMeta,
  TCPIPMeta,
  TransactionMeta,
  URIMapMeta,
  WebServiceMeta
} from "../doc";
import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { ResourceContainer } from "../resources";
import { CICSTreeNode } from "./CICSTreeNode";

export class CICSRegionTree extends CICSTreeNode {
  region: any;
  parentSession: CICSSessionTree;
  parentPlex: CICSPlexTree | undefined;
  directParent: any;
  isActive: true | false;

  constructor(regionName: string, region: any, parentSession: CICSSessionTree, parentPlex: CICSPlexTree | undefined, directParent: any) {
    super(regionName, TreeItemCollapsibleState.Collapsed, directParent, parentSession.session, parentSession.profile);
    this.region = region;
    this.contextValue = `${CicsCmciConstants.CICS_CMCI_REGION}.${regionName}`;
    this.parentSession = parentSession;
    this.directParent = directParent;
    if (parentPlex) {
      this.parentPlex = parentPlex;
    }

    if (region.cicsstate) {
      this.isActive = region.cicsstate === "ACTIVE" ? true : false;
    } else {
      this.isActive = region.cicsstatus === "ACTIVE" ? true : false;
    }
    this.iconPath = getIconByStatus("REGION", this);
    if (!this.isActive) {
      this.children = null;
      this.collapsibleState = TreeItemCollapsibleState.None;
      this.iconPath = getIconByStatus("REGION", this);
      this.contextValue += ".INACTIVE";
    } else {
      this.contextValue += ".ACTIVE";
      this.children = [

        this.buildResourceContainerNode(ProgramMeta),
        this.buildResourceContainerNode(TransactionMeta),
        this.buildResourceContainerNode(LocalFileMeta),
        this.buildResourceContainerNode(TaskMeta),
        this.buildResourceContainerNode(LibraryMeta),

        this.buildResourceContainerNode(TCPIPMeta),
        this.buildResourceContainerNode(WebServiceMeta),
        this.buildResourceContainerNode(URIMapMeta),
        this.buildResourceContainerNode(PipelineMeta),
      ];
    }
  }

  private buildResourceContainerNode(meta: IResourceMeta<IResource>) {
    return new CICSResourceContainerNode(
      meta.humanReadableName,
      {
        parentNode: this,
        profile: this.parentSession.profile,
        session: this.parentSession.session,
        cicsplexName: this.parentPlex?.plexName,
        regionName: this.getRegionName()
      },
      null,
      {
        resources: new ResourceContainer(meta),
        meta,
      }
    );
  }

  public getRegionName() {
    return this.region.applid || this.region.cicsname;
  }

  public getIsActive() {
    return this.isActive;
  }

  public getChildren() {
    return this.children;
  }

  public getParent() {
    return this.directParent;
  }
}

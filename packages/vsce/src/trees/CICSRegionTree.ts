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
import { TreeItemCollapsibleState, workspace } from "vscode";
import {
  BundleMeta,
  ICICSTreeNode,
  IResource,
  IResourceMeta,
  JVMServerMeta,
  LibraryMeta,
  LocalFileMeta,
  PipelineMeta,
  ProgramMeta,
  TaskMeta,
  TCPIPMeta,
  TransactionMeta,
  URIMapMeta,
  WebServiceMeta,
} from "../doc";
import { ResourceContainer } from "../resources";
import { getIconByStatus } from "../utils/iconUtils";
import { CICSPlexTree } from "./CICSPlexTree";
import { CICSResourceContainerNode } from "./CICSResourceContainerNode";
import { CICSSessionTree } from "./CICSSessionTree";
import { CICSTreeNode } from "./CICSTreeNode";

export class CICSRegionTree extends CICSTreeNode implements ICICSTreeNode {
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
    this.refreshIcon();
    if (!this.isActive) {
      this.children = null;
      this.collapsibleState = TreeItemCollapsibleState.None;
      this.refreshIcon();
      this.contextValue += ".inactive";
    } else {
      this.contextValue += ".active";

      const config = workspace.getConfiguration("zowe.cics.resources");

      this.children = [
        config.get<boolean>("Program", true) && this.buildResourceContainerNode(ProgramMeta),
        config.get<boolean>("Transaction", true) && this.buildResourceContainerNode(TransactionMeta),
        config.get<boolean>("LocalFile", true) && this.buildResourceContainerNode(LocalFileMeta),
        config.get<boolean>("Task", true) && this.buildResourceContainerNode(TaskMeta),
        config.get<boolean>("Library", true) && this.buildResourceContainerNode(LibraryMeta),
        config.get<boolean>("Pipeline", true) && this.buildResourceContainerNode(PipelineMeta),
        config.get<boolean>("TCP/IPService", true) && this.buildResourceContainerNode(TCPIPMeta),
        config.get<boolean>("URIMap", true) && this.buildResourceContainerNode(URIMapMeta),
        config.get<boolean>("WebService", true) && this.buildResourceContainerNode(WebServiceMeta),
        config.get<boolean>("JVMServer", true) && this.buildResourceContainerNode(JVMServerMeta),
        config.get<boolean>("Bundle", true) && this.buildResourceContainerNode(BundleMeta),
      ].filter((child) => child !== null);
    }
  }

  refreshIcon(): void {
    this.iconPath = getIconByStatus("REGION", this);
  }

  private buildResourceContainerNode(meta: IResourceMeta<IResource>) {
    return new CICSResourceContainerNode(
      meta.humanReadableName,
      {
        parentNode: this,
        profile: this.parentSession.profile,
        session: this.parentSession.session,
        cicsplexName: this.parentPlex?.plexName,
        regionName: this.getRegionName(),
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
    return Promise.resolve(this.children);
  }

  public getParent() {
    return this.directParent;
  }

  getSessionNode() {
    return this.parentSession;
  }
}

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
  LibraryMeta,
  LocalFileMeta,
  PipelineMeta,
  ProgramMeta,
  TaskMeta,
  TCPIPMeta,
  TransactionMeta,
  URIMapMeta,
  WebServiceMeta,
  JVMServerMeta
} from "../doc";
import { ResourceContainer } from "../resources";
import { getIconByStatus } from "../utils/iconUtils";
import { CICSPlexTree } from "./CICSPlexTree";
import { CICSResourceContainerNode } from "./CICSResourceContainerNode";
import { CICSSessionTree } from "./CICSSessionTree";
import { CICSTreeNode } from "./CICSTreeNode";
import { RemoteFileMeta } from "../doc/meta/remoteFile.meta";

export class CICSRegionTree extends CICSTreeNode implements ICICSTreeNode {
  region: any;
  parentSession: CICSSessionTree;
  parentPlex: CICSPlexTree | undefined;
  directParent: any;
  isActive: boolean;

  constructor(regionName: string, region: any, parentSession: CICSSessionTree, parentPlex: CICSPlexTree | undefined, directParent: any) {
    super(regionName, TreeItemCollapsibleState.Collapsed, directParent, parentSession.session, parentSession.profile);
    this.region = region;
    this.contextValue = `${CicsCmciConstants.CICS_CMCI_REGION}.${regionName}`;
    this.parentSession = parentSession;
    this.directParent = directParent;
    if (parentPlex) {
      this.parentPlex = parentPlex;
    }

    this.isActive = region.cicsstate! === "ACTIVE" || region.cicsstatus! === "ACTIVE";
    this.contextValue += this.isActive ? ".active" : ".inactive";
    this.refreshIcon();

    if (this.isActive) {
      this.constructChildNodes();
    } else {
      this.children = null;
      this.collapsibleState = TreeItemCollapsibleState.None;
      this.refreshIcon();
    }
  }

  private constructChildNodes() {
    const config = workspace.getConfiguration("zowe.cics.resources");

    this.children = [];
    if (config.get<boolean>("Program", true)) {
      this.children.push(this.buildResourceContainerNode(ProgramMeta));
    }
    if (config.get<boolean>("Transaction", true)) {
      this.children.push(this.buildResourceContainerNode(TransactionMeta));
    }
    if (config.get<boolean>("LocalFile", true)) {
      this.children.push(this.buildResourceContainerNode(LocalFileMeta, [RemoteFileMeta]));
    }
    if (config.get<boolean>("Task", true)) {
      this.children.push(this.buildResourceContainerNode(TaskMeta));
    }
    if (config.get<boolean>("Library", true)) {
      this.children.push(this.buildResourceContainerNode(LibraryMeta));
    }
    if (config.get<boolean>("Pipeline", true)) {
      this.children.push(this.buildResourceContainerNode(PipelineMeta));
    }
    if (config.get<boolean>("TCP/IPService", true)) {
      this.children.push(this.buildResourceContainerNode(TCPIPMeta));
    }
    if (config.get<boolean>("URIMap", true)) {
      this.children.push(this.buildResourceContainerNode(URIMapMeta));
    }
    if (config.get<boolean>("WebService", true)) {
      this.children.push(this.buildResourceContainerNode(WebServiceMeta));
    }
    if (config.get<boolean>("JVMServer", true)) {
      this.children.push(this.buildResourceContainerNode(JVMServerMeta));
    }
    if (config.get<boolean>("Bundle", true)) {
      this.children.push(this.buildResourceContainerNode(BundleMeta));
    }
  }

  refreshIcon(): void {
    this.iconPath = getIconByStatus("REGION", this);
  }

  private buildResourceContainerNode(meta: IResourceMeta<IResource>, additionalMetas: IResourceMeta<IResource>[] = []) {
    return new CICSResourceContainerNode(
      meta.humanReadableNamePlural,
      {
        parentNode: this,
        profile: this.parentSession.profile,
        session: this.parentSession.session,
        cicsplexName: this.parentPlex?.plexName,
        regionName: this.getRegionName(),
      },
      null,
      {
        resources: new ResourceContainer(meta, undefined, additionalMetas.length + 1),
        meta,
      },
      undefined,
      additionalMetas.map((additionalMeta) => {
        return {
          meta: additionalMeta,
          resources: new ResourceContainer(additionalMeta, undefined, additionalMetas.length + 1),
        };
      }),
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

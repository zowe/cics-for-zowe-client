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

import { imperative } from "@zowe/zowe-explorer-api";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { getIconFilePathFromName } from "../utils/iconUtils";
import { CICSPlexTree } from "./CICSPlexTree";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSSession } from "../resources";

export class CICSSessionTree extends TreeItem {
  children: (CICSPlexTree | CICSRegionTree)[];
  session: CICSSession;
  profile: any;
  isUnauthorized: boolean | undefined;
  iconPath = getIconFilePathFromName("profile-unverified");

  constructor(profile: any) {
    super(profile.name, TreeItemCollapsibleState.Collapsed);
    this.children = [];
    this.contextValue = `cicssession.${profile.name}`;

    this.session = new CICSSession({
      type: imperative.SessConstants.AUTH_TYPE_TOKEN,
      storeCookie: true,
      tokenType: imperative.SessConstants.TOKEN_TYPE_LTPA,
      hostname: profile.profile!.host,
      port: Number(profile.profile!.port),
      user: profile.profile!.user || "",
      password: profile.profile!.password || "",
      rejectUnauthorized: profile.profile!.rejectUnauthorized,
      protocol: profile.profile!.protocol,
    });

    this.profile = profile;
    this.isUnauthorized = undefined;
  }

  public addRegion(region: CICSRegionTree) {
    this.children.push(region);
  }

  public clearChildren() {
    this.children = [];
  }

  public addPlex(plex: CICSPlexTree) {
    this.children.push(plex);
  }

  public getSession() {
    return this.session;
  }

  public getChildren() {
    return this.children;
  }

  public setUnauthorized() {
    this.isUnauthorized = true;
    this.iconPath = getIconFilePathFromName("profile-disconnected");
  }

  public setAuthorized() {
    this.isUnauthorized = false;
    this.iconPath = getIconFilePathFromName("profile");
  }

  public getIsUnauthorized() {
    return this.isUnauthorized;
  }

  public getParent(): null {
    return null;
  }

  public setIsExpanded(isExpanded: boolean) {
    this.collapsibleState = isExpanded ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed;
  }
}

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

import { IProfileLoaded } from "@zowe/imperative";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { SessionHandler } from "../resources/SessionHandler";
import { getIconFilePathFromName } from "../utils/iconUtils";
import { CICSPlexTree } from "./CICSPlexTree";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSTree } from "./CICSTree";

export class CICSSessionTree extends TreeItem {
  children: (CICSPlexTree | CICSRegionTree)[];
  isUnauthorized: boolean | undefined;
  iconPath = getIconFilePathFromName("profile-unverified");

  constructor(
    private profile: IProfileLoaded,
    private parent: CICSTree
  ) {
    super(profile.name, TreeItemCollapsibleState.Collapsed);
    this.children = [];
    this.contextValue = `cicssession.${profile.name}`;

    this.profile = profile;
    this.createSessionFromProfile();

    this.isUnauthorized = undefined;
  }

  public createSessionFromProfile() {
    SessionHandler.getInstance().removeSession(this.profile.name);
    SessionHandler.getInstance().getSession(this.profile);
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
    return SessionHandler.getInstance().getSession(this.profile);
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

  public getParent(): CICSTree {
    return this.parent;
  }

  public setProfile(profile: IProfileLoaded) {
    this.profile = profile;
  }

  public getProfile(): IProfileLoaded {
    return this.profile;
  }

  public setIsExpanded(isExpanded: boolean) {
    this.collapsibleState = isExpanded ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed;
  }
}

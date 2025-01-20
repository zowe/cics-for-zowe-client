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

import { TreeItemCollapsibleState, TreeItem } from "vscode";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSPlexTree } from "./CICSPlexTree";
import { imperative } from "@zowe/zowe-explorer-api";
import { getIconFilePathFromName } from "../utils/iconUtils";

export class CICSSessionTree extends TreeItem {
  children: (CICSPlexTree | CICSRegionTree)[];
  session: imperative.Session;
  profile: any;
  isUnauthorized: boolean | undefined;

  constructor(
    profile: any,
    public readonly iconPath = getIconFilePathFromName("profile-unverified"),
  ) {
    super(profile.name, TreeItemCollapsibleState.Collapsed);
    this.children = [];
    this.contextValue = `cicssession.${profile.name}`;
    this.session = new imperative.Session({
      type: "basic",
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
  }

  public setAuthorized() {
    this.isUnauthorized = false;
  }

  public getIsUnauthorized() {
    return this.isUnauthorized;
  }

  public getParent(): null {
    return null;
  }
}

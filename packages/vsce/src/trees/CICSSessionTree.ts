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
import { IProfileLoaded } from "@zowe/imperative";
import { l10n, TreeItem, TreeItemCollapsibleState } from "vscode";
import constants from "../constants/CICS.defaults";
import errorConstants from "../constants/CICS.errorMessages";
import { CICSErrorHandler } from "../errors/CICSErrorHandler";
import { CICSExtensionError } from "../errors/CICSExtensionError";
import { SessionHandler } from "../resources/SessionHandler";
import { getIconFilePathFromName } from "../utils/iconUtils";
import { InfoLoaded, ProfileManagement } from "../utils/profileManagement";
import { updateProfile } from "../utils/profileUtils";
import { runGetResource } from "../utils/resourceUtils";
import { CICSPlexTree } from "./CICSPlexTree";
import { CICSRegionTree } from "./CICSRegionTree";
import { CICSTree } from "./CICSTree";

export class CICSSessionTree extends TreeItem {
  children: (CICSPlexTree | CICSRegionTree)[];
  isUnauthorized: boolean | undefined;
  requiresIconUpdate: boolean = false;

  constructor(
    private profile: IProfileLoaded,
    private parent: CICSTree
  ) {
    super(profile.name, TreeItemCollapsibleState.Collapsed);
    this.profile = profile;
    this.createSessionFromProfile();
    this.reset();
  }

  public reset() {
    this.setIsExpanded(false);
    this.isUnauthorized = undefined;
    this.contextValue = `cicssession.${this.profile.name}`;
    this.refreshIcon();
    this.clearChildren();
  }

  public refreshIcon() {
    let iconName = "profile-unverified";
    if (this.isUnauthorized === true) {
      iconName = "profile-disconnected";
    } else if (this.isUnauthorized === false) {
      iconName = "profile";
    }
    this.iconPath = getIconFilePathFromName(iconName);
  }

  public createSessionFromProfile() {
    SessionHandler.getInstance().removeSession(this.profile.name);
    SessionHandler.getInstance().getSession(this.profile);
  }

  public clearChildren() {
    this.children = [];
  }

  public getSession() {
    return SessionHandler.getInstance().getSession(this.profile);
  }

  public async getChildren(): Promise<(CICSRegionTree | CICSPlexTree)[]> {
    if (this.requiresIconUpdate) {
      this.requiresIconUpdate = false;
      return this.children;
    }

    const configInstance = await ProfileManagement.getConfigInstance();
    if (!configInstance.getTeamConfig().exists) {
      return;
    }

    let plexInfo: InfoLoaded[] = [];

    try {
      plexInfo = await ProfileManagement.getPlexInfo(this.profile);
      this.setAuthorized();
    } catch (error) {
      if (error instanceof CICSExtensionError) {
        if (error.cicsExtensionError.statusCode === constants.HTTP_ERROR_UNAUTHORIZED) {
          error.cicsExtensionError.errorMessage = l10n.t(errorConstants.INVALID_USER_OR_SESSION_EXPIRED, this.profile.name);

          CICSErrorHandler.handleCMCIRestError(error);
          this.setUnauthorized();
          this.profile = await updateProfile(this.profile, this);

          if (!this.profile) {
            throw error;
          }

          this.createSessionFromProfile();
          plexInfo = await ProfileManagement.getPlexInfo(this.profile);
          this.setAuthorized();
        } else {
          CICSErrorHandler.handleCMCIRestError(error);
        }
      }
    }

    this.clearChildren();

    try {
      for (const item of plexInfo) {
        if (item.plexname === null) {
          const regionsObtained = await runGetResource({
            profileName: this.getProfile().name,
            resourceName: CicsCmciConstants.CICS_CMCI_REGION,
            regionName: item.regions[0].applid,
          });

          const newRegionTree = new CICSRegionTree(item.regions[0].applid, regionsObtained.response.records.cicsregion, this, undefined, this);
          this.children.push(newRegionTree);
        } else {
          const newPlexTree = new CICSPlexTree(item.plexname, this.profile, this, item.group ? this.profile.profile.regionName : undefined);
          if (item.group) {
            newPlexTree.setLabel(l10n.t("{cicsplex} - {region}", { cicsplex: item.plexname, region: this.profile.profile.regionName }));
          }
          this.children.push(newPlexTree);
        }
      }
    } catch (error) {
      this.setUnauthorized();
      this.setIsExpanded(false);
    } finally {
      this.refreshIcon();
      if (this.requiresIconUpdate) {
        this.getParent().refresh(this);
      }
    }

    return this.children;
  }

  public setUnauthorized() {
    this.isUnauthorized = true;
    const currIcon = this.iconPath;
    this.iconPath = getIconFilePathFromName("profile-disconnected");
    this.requiresIconUpdate = JSON.stringify(currIcon) !== JSON.stringify(this.iconPath);
  }

  public setAuthorized() {
    this.isUnauthorized = false;
    const currIcon = this.iconPath;
    this.iconPath = getIconFilePathFromName("profile");
    this.requiresIconUpdate = JSON.stringify(currIcon) !== JSON.stringify(this.iconPath);
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

  public getRegionNodeFromName(regionName: string, cicsplexName?: string): CICSRegionTree | undefined {
    if (cicsplexName) {
      const plexNode = this.children.find((plex) => plex instanceof CICSPlexTree && plex.plexName === cicsplexName) as CICSPlexTree;
      if (plexNode?.children?.length > 0) {
        return plexNode.getRegionNodeFromName(regionName);
      }
    } else {
      return this.children.find((reg) => reg instanceof CICSRegionTree && reg.getRegionName() === regionName) as CICSRegionTree;
    }
  }
}

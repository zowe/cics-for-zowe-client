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
import type { IProfileLoaded } from "@zowe/imperative";
import type { ISessionHandler } from "../doc/resources/ISessionHandler";
import { ProfileManagement } from "../utils/profileManagement";

export class SessionHandler implements ISessionHandler {
  private sessions: Map<String, CICSSession>;
  private profiles: Map<String, IProfileLoaded>;

  private static instance: SessionHandler;

  private constructor() {
    this.sessions = new Map<String, CICSSession>();
    this.profiles = new Map<String, IProfileLoaded>();
  }

  // Creating a singleton instance of SessionHandler
  public static getInstance(): SessionHandler {
    if (!SessionHandler.instance) {
      SessionHandler.instance = new SessionHandler();
    }
    return SessionHandler.instance;
  }

  private createSession(profile: IProfileLoaded): void {
    this.profiles.set(profile.name, profile);
    const session = new CICSSession(profile.profile);
    this.sessions.set(profile.name, session);
  }

  public getSession(profile: IProfileLoaded): CICSSession {
    if (!this.sessions.has(profile.name)) {
      this.createSession(profile);
    }
    return this.sessions.get(profile.name);
  }

  public removeSession(profileName: string): void {
    if (this.sessions.has(profileName)) {
      this.sessions.delete(profileName);
    }
  }

  public removeProfile(profileName: string): void {
    if (this.profiles.has(profileName)) {
      this.profiles.delete(profileName);
    }
  }

  public clearSessions(): void {
    this.sessions.clear();
    this.profiles.clear();
  }

  public getProfile(profName: string): IProfileLoaded {
    if (this.profiles.has(profName)) {
      return this.profiles.get(profName);
    }

    this.profiles.set(profName, ProfileManagement.getProfilesCache().loadNamedProfile(profName, "cics"));
    return this.profiles.get(profName);
  }
}

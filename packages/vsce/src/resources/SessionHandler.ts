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
import { IProfileLoaded, Session } from "@zowe/imperative";
import { ISessionHandler } from "../doc/resources/ISessionHandler";

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

  private createSession(profile: IProfileLoaded, profileName: string): void {
    this.profiles.set(profileName, profile);
    const session = new CICSSession(profile.profile);
    this.sessions.set(profileName, session);
  }

  public getSession(profile: IProfileLoaded): CICSSession | undefined {
    if (!this.sessions.has(profile.name)) {
      this.createSession(profile, profile.name);
    }
    return this.sessions.get(profile.name);
  }

  public removeSession(profileName: string): void {
    if (this.sessions.has(profileName)) {
      this.sessions.delete(profileName);
      this.profiles.delete(profileName);
    }
  }

  public clearSessions(): void {
    this.sessions.clear();
    this.profiles.clear();
  }

  public getProfileNameFromSession(session: Session): string | undefined {
    let profileName;
    this.sessions.forEach((sess: CICSSession, profName: string) => {
      console.log(sess.ISession == session.ISession);
      if (sess.ISession == session.ISession) profileName = profName;
    });
    return profileName;
  }

  public getProfile(profName: string): IProfileLoaded {
    return this.profiles.get(profName);
  }
}

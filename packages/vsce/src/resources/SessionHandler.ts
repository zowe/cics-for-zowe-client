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

import { IProfile, IProfileLoaded } from "@zowe/imperative";
import { CICSSession } from "./CICSSession";
import { ISessionHandler } from "../doc/resources/ISessionHandler";

export class SessionHandler implements ISessionHandler {
  private sessions: Map<String, CICSSession>;
  private static instance: SessionHandler;

  private constructor() {
    this.sessions = new Map<String, CICSSession>();
  }

  // Creating a singleton instance of SessionHandler
  public static getInstance(): SessionHandler {
    if (!SessionHandler.instance) {
      SessionHandler.instance = new SessionHandler();
    }
    return SessionHandler.instance;
  }

  private createSession(profile: IProfile, profileName: string): void {
    const session = new CICSSession(profile);
    this.sessions.set(profileName, session);
  }

  public getSession(profile: IProfileLoaded): CICSSession | undefined {
    if (!this.sessions.has(profile.name)) {
      this.createSession(profile.profile, profile.name);
    }
    return this.sessions.get(profile.name);
  }

  public removeSession(profileName: string): void {
    if (this.sessions.has(profileName)) {
      this.sessions.delete(profileName);
    }
  }

  public clearSessions(): void {
    this.sessions.clear();
  }
}

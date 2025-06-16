import { IProfile, IProfileLoaded } from "@zowe/imperative";
import { imperative } from "@zowe/zowe-explorer-api";
import { CICSSession } from "./CICSSession";

interface ISessionHandler {
  sessions: Map<String, CICSSession>;
  createSession(profile: IProfile, profileName: string): void;
  getSession(profile: IProfile): CICSSession | undefined;
  removeSession(profileName: string): void;
  clearSessions(): void;
}

export class SessionHandler implements ISessionHandler {
  public sessions: Map<String, CICSSession>;
  session: CICSSession | undefined;
  profile: imperative.IProfile;
  private static instance: SessionHandler;

  private constructor() {}
  // Creating a singleton instance of SessionHandler
  public static getInstance(): SessionHandler {
    if (!SessionHandler.instance) {
      SessionHandler.instance = new SessionHandler();
      SessionHandler.instance.sessions = new Map<String, CICSSession>();
    }
    return SessionHandler.instance;
  }

  createSession(profile: IProfile, profileName: string): void {
    this.session = new CICSSession(profile);
    this.sessions.set(profileName, this.session);
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

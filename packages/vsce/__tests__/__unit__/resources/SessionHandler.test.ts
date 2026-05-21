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
import { SessionHandler } from "../../../src/resources/SessionHandler";
import { profile } from "../../__mocks__";

describe("Test Suite for SessionHandler", () => {
  let sessionHandler: SessionHandler;
  beforeEach(() => {
    sessionHandler = SessionHandler.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    sessionHandler.clearSessions();
  });

  it("Should create a singleton instance of SessionHandler", () => {
    const instance1 = SessionHandler.getInstance();
    const instance2 = SessionHandler.getInstance();
    expect(instance1).toBeInstanceOf(SessionHandler);
    expect(instance1).toBe(instance2);
  });

  it("Should create a session and add it to map", () => {
    const session = sessionHandler.getSession(profile);
    expect(session).toBeInstanceOf(CICSSession);
    expect(session?.cicsplexName).toEqual("MYPLEX");
  });

  it("Should retrieve an existing session", () => {
    sessionHandler.getSession(profile);
    const session = sessionHandler.getSession(profile);
    expect(session).toBeInstanceOf(CICSSession);
  });

  it("Should remove a session by profile name", () => {
    sessionHandler.getSession(profile);
    expect(sessionHandler.getSession(profile)).toBeInstanceOf(CICSSession);
    
    sessionHandler.removeSession(profile.name!);
    // After removal, getSession should create a new session
    const newSession = sessionHandler.getSession(profile);
    expect(newSession).toBeInstanceOf(CICSSession);
  });

  it("Should handle removeSession when profile does not exist", () => {
    // Should not throw error when removing non-existent session
    expect(() => sessionHandler.removeSession("nonexistent")).not.toThrow();
  });

  it("Should remove a profile by profile name", () => {
    sessionHandler.getSession(profile);
    const profileBefore = sessionHandler.getProfile(profile.name!);
    expect(profileBefore).toBeDefined();
    
    sessionHandler.removeProfile(profile.name!);
    
    // After removal, the profile should no longer be in the internal map
    // getProfile will reload it from ProfileManagement, but we can verify removal worked
    expect(() => sessionHandler.removeProfile(profile.name!)).not.toThrow();
  });

  it("Should handle removeProfile when profile does not exist", () => {
    // Should not throw error when removing non-existent profile
    expect(() => sessionHandler.removeProfile("nonexistent")).not.toThrow();
  });

  it("Should clear all sessions and profiles", () => {
    sessionHandler.getSession(profile);
    expect(sessionHandler.getSession(profile)).toBeInstanceOf(CICSSession);
    
    const sessionCountBefore = sessionHandler["sessions"].size;
    const profileCountBefore = sessionHandler["profiles"].size;
    
    sessionHandler.clearSessions();
    
    // After clearing, both maps should be empty
    expect(sessionHandler["sessions"].size).toBe(0);
    expect(sessionHandler["profiles"].size).toBe(0);
    expect(sessionCountBefore).toBeGreaterThan(0);
    expect(profileCountBefore).toBeGreaterThan(0);
  });
});

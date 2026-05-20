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
import type { IProfile } from "@zowe/imperative";
import type { ISessionHandler } from "../../../../src/doc/resources/ISessionHandler";

interface ISessionHandlerLike {
  getSession?: ((profile: IProfile) => CICSSession | undefined) | string | (() => void);
  removeSession?: ((profileName: string) => void) | string | (() => void);
  clearSessions?: (() => void) | string;
}

describe("ISessionHandler Interface Tests", () => {
  describe("Interface Structure", () => {
    it("should accept an implementation with all required methods", () => {
      const sessionHandler: ISessionHandler = {
        getSession: (profile: IProfile) => {
          return new CICSSession(profile);
        },
        removeSession: (profileName: string) => {
          // Implementation
        },
        clearSessions: () => {
          // Implementation
        },
      };

      expect(sessionHandler).toHaveProperty("getSession");
      expect(sessionHandler).toHaveProperty("removeSession");
      expect(sessionHandler).toHaveProperty("clearSessions");
      expect(typeof sessionHandler.getSession).toBe("function");
      expect(typeof sessionHandler.removeSession).toBe("function");
      expect(typeof sessionHandler.clearSessions).toBe("function");
    });
  });

  describe("getSession method", () => {
    it("should accept a method that returns CICSSession", () => {
      const mockProfile: IProfile = {
        host: "example.com",
        port: 1234,
        user: "testuser",
        password: "testpass",
        rejectUnauthorized: true,
      };

      const sessionHandler: ISessionHandler = {
        getSession: (profile: IProfile) => {
          return new CICSSession(profile);
        },
        removeSession: () => {},
        clearSessions: () => {},
      };

      const session = sessionHandler.getSession(mockProfile);
      expect(session).toBeInstanceOf(CICSSession);
    });

    it("should accept a method that returns undefined", () => {
      const mockProfile: IProfile = {
        host: "example.com",
        port: 1234,
      };

      const sessionHandler: ISessionHandler = {
        getSession: (profile: IProfile) => {
          return undefined;
        },
        removeSession: () => {},
        clearSessions: () => {},
      };

      const session = sessionHandler.getSession(mockProfile);
      expect(session).toBeUndefined();
    });
  });

  describe("removeSession method", () => {
    it("should accept a method that removes a session by profile name", () => {
      const sessions = new Map<string, CICSSession>();
      
      const sessionHandler: ISessionHandler = {
        getSession: (profile: IProfile) => {
          return sessions.get(profile.name || "");
        },
        removeSession: (profileName: string) => {
          sessions.delete(profileName);
        },
        clearSessions: () => {
          sessions.clear();
        },
      };

      // Add a session
      const profile: IProfile = { name: "testProfile", host: "example.com", port: 1234 };
      sessions.set("testProfile", new CICSSession(profile));

      expect(sessions.has("testProfile")).toBe(true);
      
      sessionHandler.removeSession("testProfile");
      expect(sessions.has("testProfile")).toBe(false);
    });
  });

  describe("clearSessions method", () => {
    it("should accept a method that clears all sessions", () => {
      const sessions = new Map<string, CICSSession>();
      
      const sessionHandler: ISessionHandler = {
        getSession: (profile: IProfile) => {
          return sessions.get(profile.name || "");
        },
        removeSession: (profileName: string) => {
          sessions.delete(profileName);
        },
        clearSessions: () => {
          sessions.clear();
        },
      };

      // Add multiple sessions
      const profile1: IProfile = { name: "profile1", host: "host1.com", port: 1234 };
      const profile2: IProfile = { name: "profile2", host: "host2.com", port: 5678 };
      sessions.set("profile1", new CICSSession(profile1));
      sessions.set("profile2", new CICSSession(profile2));

      expect(sessions.size).toBe(2);
      
      sessionHandler.clearSessions();
      expect(sessions.size).toBe(0);
    });
  });

  describe("Complete Implementation Scenarios", () => {
    it("should implement a complete session handler with state management", () => {
      const sessions = new Map<string, CICSSession>();

      const sessionHandler: ISessionHandler = {
        getSession: (profile: IProfile) => {
          const profileName = profile.name || `${profile.host}:${profile.port}`;
          let session = sessions.get(profileName);
          
          if (!session) {
            session = new CICSSession(profile);
            sessions.set(profileName, session);
          }
          
          return session;
        },
        removeSession: (profileName: string) => {
          sessions.delete(profileName);
        },
        clearSessions: () => {
          sessions.clear();
        },
      };

      // Test getSession creates and caches session
      const profile: IProfile = { name: "testProfile", host: "example.com", port: 1234 };
      const session1 = sessionHandler.getSession(profile);
      const session2 = sessionHandler.getSession(profile);
      
      expect(session1).toBe(session2); // Same instance
      expect(sessions.size).toBe(1);

      // Test removeSession
      sessionHandler.removeSession("testProfile");
      expect(sessions.size).toBe(0);

      // Test clearSessions
      sessionHandler.getSession({ name: "profile1", host: "host1.com", port: 1234 });
      sessionHandler.getSession({ name: "profile2", host: "host2.com", port: 5678 });
      expect(sessions.size).toBe(2);
      
      sessionHandler.clearSessions();
      expect(sessions.size).toBe(0);
    });
  });

  describe("Type Guard Function", () => {
    function isISessionHandler(obj: ISessionHandlerLike | null | undefined): obj is ISessionHandler {
      return (
        obj !== null &&
        obj !== undefined &&
        typeof obj === "object" &&
        typeof obj.getSession === "function" &&
        typeof obj.removeSession === "function" &&
        typeof obj.clearSessions === "function"
      );
    }

    it("should validate valid ISessionHandler implementations", () => {
      const validHandler: ISessionHandler = {
        getSession: () => undefined,
        removeSession: () => {},
        clearSessions: () => {},
      };

      expect(isISessionHandler(validHandler)).toBe(true);
    });

    it("should reject invalid objects", () => {
      expect(isISessionHandler(null)).toBe(false);
      expect(isISessionHandler(undefined)).toBe(false);
      expect(isISessionHandler({})).toBe(false);
      expect(isISessionHandler({ getSession: () => {} })).toBe(false);
      expect(isISessionHandler({ getSession: () => {}, removeSession: () => {} })).toBe(false);
    });
  });
});



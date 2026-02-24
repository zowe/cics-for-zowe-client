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

import { ICommandArguments, IHandlerParameters, IProfile, Session } from "@zowe/imperative";
import { CicsSession } from "../../src/CicsSession";

describe("CicsSession", () => {
  describe("createBasicCicsSession", () => {
    it("should create a session from a profile with all properties", () => {
      const profile: IProfile = {
        name: "testProfile",
        type: "cics",
        host: "example.com",
        port: 1490,
        user: "testuser",
        pass: "testpass",
        basePath: "/CICSSystemManagement",
        protocol: "https",
      };

      const session = CicsSession.createBasicCicsSession(profile);

      expect(session).toBeInstanceOf(Session);
      expect(session.ISession.hostname).toBe("example.com");
      expect(session.ISession.port).toBe(1490);
      expect(session.ISession.user).toBe("testuser");
      expect(session.ISession.password).toBe("testpass");
      expect(session.ISession.basePath).toBe("/CICSSystemManagement");
      expect(session.ISession.protocol).toBe("https");
      expect(session.ISession.type).toBe("basic");
    });

    it("should create a session from a profile with default protocol", () => {
      const profile: IProfile = {
        name: "testProfile",
        type: "cics",
        host: "example.com",
        port: 1490,
        user: "testuser",
        pass: "testpass",
      };

      const session = CicsSession.createBasicCicsSession(profile);

      expect(session).toBeInstanceOf(Session);
      expect(session.ISession.protocol).toBe("https");
    });

    it("should create a session from a profile with http protocol", () => {
      const profile: IProfile = {
        name: "testProfile",
        type: "cics",
        host: "example.com",
        port: 1490,
        user: "testuser",
        pass: "testpass",
        protocol: "http",
      };

      const session = CicsSession.createBasicCicsSession(profile);

      expect(session).toBeInstanceOf(Session);
      expect(session.ISession.protocol).toBe("http");
    });
  });

  describe("createBasicCicsSessionFromArguments", () => {
    it("should create a session from arguments with all properties", () => {
      const args: ICommandArguments = {
        $0: "zowe",
        _: ["cics"],
        host: "example.com",
        port: 1490,
        user: "testuser",
        password: "testpass",
        basePath: "/CICSSystemManagement",
        rejectUnauthorized: true,
        protocol: "https",
      };

      const session = CicsSession.createBasicCicsSessionFromArguments(args);

      expect(session).toBeInstanceOf(Session);
      expect(session.ISession.hostname).toBe("example.com");
      expect(session.ISession.port).toBe(1490);
      expect(session.ISession.user).toBe("testuser");
      expect(session.ISession.password).toBe("testpass");
      expect(session.ISession.basePath).toBe("/CICSSystemManagement");
      expect(session.ISession.rejectUnauthorized).toBe(true);
      expect(session.ISession.protocol).toBe("https");
      expect(session.ISession.type).toBe("basic");
    });

    it("should create a session from arguments with default protocol", () => {
      const args: ICommandArguments = {
        $0: "zowe",
        _: ["cics"],
        host: "example.com",
        port: 1490,
        user: "testuser",
        password: "testpass",
      };

      const session = CicsSession.createBasicCicsSessionFromArguments(args);

      expect(session).toBeInstanceOf(Session);
      expect(session.ISession.protocol).toBe("https");
    });

    it("should create a session from arguments with http protocol", () => {
      const args: ICommandArguments = {
        $0: "zowe",
        _: ["cics"],
        host: "example.com",
        port: 1490,
        user: "testuser",
        password: "testpass",
        protocol: "http",
      };

      const session = CicsSession.createBasicCicsSessionFromArguments(args);

      expect(session).toBeInstanceOf(Session);
      expect(session.ISession.protocol).toBe("http");
    });
  });

  describe("createSessCfgFromArgs", () => {
    it("should create a session from arguments without prompting", async () => {
      const args: ICommandArguments = {
        $0: "zowe",
        _: ["cics"],
        host: "example.com",
        port: 1490,
        user: "testuser",
        password: "testpass",
        basePath: "/CICSSystemManagement",
        rejectUnauthorized: true,
        protocol: "https",
      };

      const session = await CicsSession.createSessCfgFromArgs(args, false);

      expect(session).toBeInstanceOf(Session);
      expect(session.ISession.hostname).toBe("example.com");
      expect(session.ISession.port).toBe(1490);
      expect(session.ISession.user).toBe("testuser");
      expect(session.ISession.password).toBe("testpass");
      expect(session.ISession.protocol).toBe("https");
    });

    it("should create a session from arguments with default protocol", async () => {
      const args: ICommandArguments = {
        $0: "zowe",
        _: ["cics"],
        host: "example.com",
        port: 1490,
        user: "testuser",
        password: "testpass",
      };

      const session = await CicsSession.createSessCfgFromArgs(args, false);

      expect(session).toBeInstanceOf(Session);
      expect(session.ISession.protocol).toBe("https");
    });

    it("should create a session from arguments with handler parameters", async () => {
      const args: ICommandArguments = {
        $0: "zowe",
        _: ["cics"],
        host: "example.com",
        port: 1490,
        user: "testuser",
        password: "testpass",
      };

      const handlerParams = {} as IHandlerParameters;

      const session = await CicsSession.createSessCfgFromArgs(args, true, handlerParams);

      expect(session).toBeInstanceOf(Session);
    });
  });

  describe("CICS_CONNECTION_OPTIONS", () => {
    it("should contain all connection options", () => {
      expect(CicsSession.CICS_CONNECTION_OPTIONS).toContain(CicsSession.CICS_OPTION_HOST);
      expect(CicsSession.CICS_CONNECTION_OPTIONS).toContain(CicsSession.CICS_OPTION_PORT);
      expect(CicsSession.CICS_CONNECTION_OPTIONS).toContain(CicsSession.CICS_OPTION_USER);
      expect(CicsSession.CICS_CONNECTION_OPTIONS).toContain(CicsSession.CICS_OPTION_PASSWORD);
      expect(CicsSession.CICS_CONNECTION_OPTIONS).toContain(CicsSession.CICS_OPTION_REJECT_UNAUTHORIZED);
      expect(CicsSession.CICS_CONNECTION_OPTIONS).toContain(CicsSession.CICS_OPTION_PROTOCOL);
    });
  });
});

// Made with Bob

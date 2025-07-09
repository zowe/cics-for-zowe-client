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

import { IProfile } from "@zowe/imperative";
import { CICSSession } from "../../../src/core/CICSSession";


describe("CICSSession tests", () => {
  const profile: IProfile = {
    protocol: "http",
    host: "a.hostname",
    port: "123",
    user: "a",
    password: "b",
    rejectUnauthorized: false,
    regionName: "MYREG",
    cicsPlex: "MYPLEX",
  };

  it("should create a cicssession", () => {
    const session = new CICSSession(profile);
    expect(session.regionName).toEqual("MYREG");
    expect(session.cicsplexName).toEqual("MYPLEX");
  });

  it("should get unverified", () => {
    const session = new CICSSession(profile);
    expect(session.isVerified()).toBeUndefined();
  });

  it("should get verified", () => {
    const session = new CICSSession(profile);
    session.setVerified(true);
    expect(session.isVerified()).toBeDefined();
    expect(session.isVerified()).toBeTruthy();
  });

  it("should get not verified", () => {
    const session = new CICSSession(profile);
    session.setVerified(false);
    expect(session.isVerified()).toBeDefined();
    expect(session.isVerified()).toBeFalsy();
  });

  it("should create session with no credentials", () => {
    const session = new CICSSession({ ...profile, user: undefined, password: undefined });
    expect(session.isVerified()).toBeUndefined();
    expect(session.ISession.user).toEqual("");
    expect(session.ISession.password).toEqual("");
  });

  it("should set verified status", () => {
    const session = new CICSSession(profile);
    expect(session.isVerified()).toBeUndefined();
    session.setVerified();
    expect(session.isVerified()).toBeDefined();
    expect(session.isVerified()).toBeTruthy();
  });
  it("should set verified status", () => {
    const session = new CICSSession(profile);
    expect(session.isVerified()).toBeUndefined();
    session.setVerified(false);
    expect(session.isVerified()).toBeDefined();
    expect(session.isVerified()).toBeFalsy();
  });
});

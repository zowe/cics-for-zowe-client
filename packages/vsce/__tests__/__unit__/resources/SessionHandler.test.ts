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

import { imperative } from "@zowe/zowe-explorer-api";
import { CICSSession } from "../../../src/resources/CICSSession";
import { SessionHandler } from "../../../src/resources/SessionHandler";
import { CICSProfileMock } from "../../__utils__/globalMocks";

jest.mock("../../../src/resources/CICSSession");

const profile: imperative.IProfileLoaded = {
  name: "testProfile",
  message: "",
  type: "cics",
  failNotFound: false,
  profile: CICSProfileMock,
};

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
    expect(session?.cicsplexName).toBeUndefined();
  });

  it("Should retrieve an existing session", () => {
    sessionHandler.getSession(profile);
    const session = sessionHandler.getSession(profile);
    expect(session).toBeInstanceOf(CICSSession);
  });
});

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

import type { ISessionHandler } from "../../../../src/doc/resources/ISessionHandler";
import type { CICSSession } from "@zowe/cics-for-zowe-sdk";
import type { IProfile } from "@zowe/imperative";

describe("ISessionHandler Interface", () => {
  it("should define the interface structure", () => {
    const mockProfile: IProfile = {
      name: "testProfile",
      type: "cics",
    };

    const mockSession: CICSSession = {} as any;

    const mockSessionHandler: ISessionHandler = {
      getSession: (profile: IProfile) => mockSession,
      removeSession: (profileName: string) => {},
      clearSessions: () => {},
    };

    expect(mockSessionHandler.getSession(mockProfile)).toBe(mockSession);
    expect(() => mockSessionHandler.removeSession("testProfile")).not.toThrow();
    expect(() => mockSessionHandler.clearSessions()).not.toThrow();
  });

  it("should allow getSession to return undefined", () => {
    const mockProfile: IProfile = {
      name: "testProfile",
      type: "cics",
    };

    const mockSessionHandler: ISessionHandler = {
      getSession: (profile: IProfile) => undefined,
      removeSession: (profileName: string) => {},
      clearSessions: () => {},
    };

    expect(mockSessionHandler.getSession(mockProfile)).toBeUndefined();
  });
});
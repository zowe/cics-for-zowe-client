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

const getIconFilePathFromNameMock = jest.fn();

import { imperative } from "@zowe/zowe-explorer-api";
import { CICSTree } from "../../../src/trees";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";

jest.mock("../../../src/utils/iconUtils", () => {
  return { getIconFilePathFromName: getIconFilePathFromNameMock };
});

describe("Test suite for CICSSessionTree", () => {
  let sut: CICSSessionTree;
  let ses: imperative.Session;

  const cicsProfileMock = {
    failNotFound: false,
    message: "",
    name: "A NAME",
    profile: {
      host: "a.b.c.d",
      port: 12345,
      rejectUnauthorized: false,
      protocol: "http",
      user: "A USER",
      password: "A PASSWORD",
    },
    type: "cics",
  };

  describe("cookies", () => {
    beforeEach(() => {
      sut = new CICSSessionTree(cicsProfileMock, { _onDidChangeTreeData: { fire: () => jest.fn() } } as unknown as CICSTree);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it("Should not store invalid cookie", () => {
      const cookie = {
        Cookie: "blah=hello",
      };

      ses = sut.getSession();
      ses.storeCookie(cookie);

      expect(ses.ISession.tokenType).toEqual("LtpaToken2");
      expect(ses.ISession.tokenValue).toBeUndefined();
    });

    it("Should store valid cookie", () => {
      const cookies = {
        Cookie: "LtpaToken2=testValue",
      };

      sut = new CICSSessionTree(cicsProfileMock, { _onDidChangeTreeData: { fire: () => jest.fn() } } as unknown as CICSTree);
      ses = sut.getSession();

      ses.storeCookie(cookies);

      expect(ses.ISession.tokenType).toEqual("LtpaToken2");
      expect(ses.ISession.tokenValue).toEqual("testValue");
    });

    it("Should store valid cookie if more the one returned", () => {
      const cookies = {
        Cookie: "blah=hello;LtpaToken2=testValue",
      };

      sut = new CICSSessionTree(cicsProfileMock, { _onDidChangeTreeData: { fire: () => jest.fn() } } as unknown as CICSTree);
      ses = sut.getSession();

      ses.storeCookie(cookies);

      expect(ses.ISession.tokenType).toEqual("LtpaToken2");
      expect(ses.ISession.tokenValue).toEqual("testValue");
    });
  });
});

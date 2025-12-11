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
import { CICSTree } from "../../../src/trees";
import { CICSSessionTree } from "../../../src/trees/CICSSessionTree";
import { profile } from "../../__mocks__";

describe("Test suite for CICSSessionTree", () => {
  let cicsTree: CICSTree;
  let sessionTree: CICSSessionTree;
  let session: imperative.Session;

  describe("cookies", () => {
    beforeEach(() => {
      cicsTree = new CICSTree();
      sessionTree = new CICSSessionTree(profile, cicsTree);
    });

    it("Should not store invalid cookie", () => {
      const cookie = {
        Cookie: "blah=hello",
      };

      session = sessionTree.getSession();
      session.storeCookie(cookie);

      expect(session.ISession.tokenType).toEqual("LtpaToken2");
      expect(session.ISession.tokenValue).toBeUndefined();
    });

    it("Should store valid cookie", () => {
      const cookies = {
        Cookie: "LtpaToken2=testValue",
      };

      sessionTree = new CICSSessionTree(profile, { _onDidChangeTreeData: { fire: () => jest.fn() } } as unknown as CICSTree);
      session = sessionTree.getSession();

      session.storeCookie(cookies);

      expect(session.ISession.tokenType).toEqual("LtpaToken2");
      expect(session.ISession.tokenValue).toEqual("testValue");
    });

    it("Should store valid cookie if more the one returned", () => {
      const cookies = {
        Cookie: "blah=hello;LtpaToken2=testValue",
      };

      sessionTree = new CICSSessionTree(profile, { _onDidChangeTreeData: { fire: () => jest.fn() } } as unknown as CICSTree);
      session = sessionTree.getSession();

      session.storeCookie(cookies);

      expect(session.ISession.tokenType).toEqual("LtpaToken2");
      expect(session.ISession.tokenValue).toEqual("testValue");
    });
  });
});

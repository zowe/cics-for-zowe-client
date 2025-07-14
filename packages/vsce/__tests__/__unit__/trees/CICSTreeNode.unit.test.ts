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

jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {},
}));

import { CICSSession } from "@zowe/cics-for-zowe-sdk";
import { IProfileLoaded } from "@zowe/imperative";
import { TreeItemCollapsibleState } from "vscode";
import { CICSRegionTree, CICSSessionTree, CICSTree } from "../../../src/trees";
import { CICSTreeNode } from "../../../src/trees/CICSTreeNode";

const w = {
  port: "123",
  user: "a",
  password: "b",
  rejectUnauthorized: false,
  protocol: "http",
};

const withHost = {
  host: "MY.HOST",
  ...w,
};
const withHostname = {
  host: "MY.HOST",
  ...w,
};

const profile: IProfileLoaded = { name: "MYPROF", failNotFound: false, message: "", type: "cics" };
const profileWithHost = { ...profile, profile: withHost };

describe("CICSTreeNode tests", () => {
  let treeNode: CICSTreeNode;
  const cicsSession = new CICSSession(withHostname);
  const sessionTree = new CICSSessionTree(profileWithHost, { _onDidChangeTreeData: { fire: () => jest.fn() } } as unknown as CICSTree);
  const regionTree = new CICSRegionTree("REG", {}, sessionTree, undefined, sessionTree);

  beforeEach(() => {
    treeNode = new CICSTreeNode("LABEL", TreeItemCollapsibleState.Collapsed, regionTree, cicsSession, profileWithHost);
  });

  it("should default profile if not specified", () => {
    treeNode = new CICSTreeNode(
      "LABEL",
      TreeItemCollapsibleState.Collapsed,
      regionTree,
      cicsSession,
      // @ts-ignore - not allowed to be null
      undefined
    );
    // @ts-ignore - private property
    expect(treeNode.profile).toBeDefined();
  });

  it("should get profile name", () => {
    expect(treeNode.getProfileName()).toEqual("MYPROF");
  });

  it("should get label", () => {
    expect(treeNode.getLabel()).toEqual("LABEL");
  });

  it("should get session", () => {
    expect(treeNode.getSession()).toEqual(cicsSession);
  });

  it("should get session when not provided", () => {
    treeNode = new CICSTreeNode(
      "LABEL",
      TreeItemCollapsibleState.Collapsed,
      regionTree,
      // @ts-ignore - not allowed to be null
      undefined,
      profileWithHost
    );
    expect(treeNode.getSession()).toEqual(cicsSession);
  });

  it("should get profile", () => {
    expect(treeNode.getProfile()).toEqual(profileWithHost);
  });

  it("should get profile when not provided", () => {
    treeNode = new CICSTreeNode(
      "LABEL",
      TreeItemCollapsibleState.Collapsed,
      regionTree,
      cicsSession,
      // @ts-ignore - not allowed to be null
      undefined
    );
    expect(treeNode.getProfile()).toEqual(profileWithHost);
  });

  it("should get profile when not provided and no parent", () => {
    treeNode = new CICSTreeNode(
      "LABEL",
      TreeItemCollapsibleState.Collapsed,
      // @ts-ignore - not allowed to be null
      undefined,
      cicsSession,
      // @ts-ignore - not allowed to be null
      undefined
    );
    expect(treeNode.getProfile()).toBeUndefined();
  });
});

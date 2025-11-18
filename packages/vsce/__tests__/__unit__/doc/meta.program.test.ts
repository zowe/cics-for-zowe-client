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

import { IProgram } from "@zowe/cics-for-zowe-explorer-api";
import { ProgramMeta } from "../../../src/doc/meta/program.meta";
import { Resource } from "../../../src/resources";

jest.mock("../../../src/utils/profileManagement", () => ({
  ProfileManagement: {},
}));

describe("Program Meta", () => {
  let programMock: Resource<IProgram>;

  beforeEach(() => {
    programMock = new Resource({
      program: "MYPROG",
      status: "ENABLED",
      eyu_cicsname: "MYREG",
      newcopycnt: "0",
      progtype: "COBOL",
      enablestatus: "ENABLED",
      library: "MYLIB",
      librarydsn: "MYLIBDSN",
      usecount:"0",
      language:"COBOL"
    });
  });

  it("should build criteria", () => {
    const crit = ProgramMeta.buildCriteria(["a", "b"]);
    expect(crit).toEqual(`PROGRAM=a OR PROGRAM=b`);
  });
  it("should return label", () => {
    const label = ProgramMeta.getLabel(programMock);
    expect(label).toEqual(`MYPROG`);
  });
  it("should return label with disabled", () => {
    programMock.attributes.status = "DISABLED";
    const label = ProgramMeta.getLabel(programMock);
    expect(label).toEqual(`MYPROG (Disabled)`);
  });
  it("should return label with newcopycount", () => {
    programMock.attributes.newcopycnt = "2";
    const label = ProgramMeta.getLabel(programMock);
    expect(label).toEqual(`MYPROG (New copy count: 2)`);
  });
  it("should return label with disabled and newcopycount", () => {
    programMock.attributes.status = "DISABLED";
    programMock.attributes.newcopycnt = "2";
    const label = ProgramMeta.getLabel(programMock);
    expect(label).toEqual(`MYPROG (New copy count: 2) (Disabled)`);
  });

  it("should return context", () => {
    const context = ProgramMeta.getContext(programMock);
    expect(context).toEqual(`CICSProgram.ENABLED.MYPROG`);
  });
  it("should return context with disabled", () => {
    programMock.attributes.status = "DISABLED";
    const context = ProgramMeta.getContext(programMock);
    expect(context).toEqual(`CICSProgram.DISABLED.MYPROG`);
  });

  it("should return icon name", () => {
    const iconName = ProgramMeta.getIconName(programMock);
    expect(iconName).toEqual(`program`);
  });
  it("should return icon name with disabled", () => {
    programMock.attributes.status = "DISABLED";
    const iconName = ProgramMeta.getIconName(programMock);
    expect(iconName).toEqual(`program-disabled`);
  });
  it("should get name", () => {
    const name = ProgramMeta.getName(programMock);
    expect(name).toEqual("MYPROG");
  });

  it("should return highlights", () => {
    const highlights = ProgramMeta.getHighlights(programMock);
    expect(highlights).toEqual([
      {
        key: "Status",
        value: "ENABLED",
      },
      {
        key: "Language",
        value: "COBOL",
      },
      {
        key: "Use Count",
        value: "0",
      },
      {
        key: "Library",
        value: "MYLIB",
      }
    ]);
  });

  it("should append criteria history", async () => {
    const criteria = "PROG1";
    await ProgramMeta.appendCriteriaHistory(criteria);
    let history = ProgramMeta.getCriteriaHistory();
    expect(history).toEqual(["PROG1"]);
  });

  it("should get criteria history", async () => {
    const criteria = "PROG1";
    await ProgramMeta.appendCriteriaHistory(criteria);
    let history = ProgramMeta.getCriteriaHistory();
    expect(history).toEqual(["PROG1"]);
  });
});

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

import { IProgram } from "@zowe/cics-for-zowe-sdk";
import { ProgramMeta } from "../../../src/doc/ProgramMeta";

describe("Program Meta", () => {

  let programMock: IProgram;

  beforeEach(() => {
    programMock = {
      program: "MYPROG",
      status: "ENABLED",
      eyu_cicsname: "MYREG"
    };
  });

  it("should return label", () => {
    const label = ProgramMeta.getLabel(programMock);
    expect(label).toEqual(`MYPROG`);
  });
  it("should return label with disabled", () => {
    programMock.status = "DISABLED";
    const label = ProgramMeta.getLabel(programMock);
    expect(label).toEqual(`MYPROG (Disabled)`);
  });
  it("should return label with newcopycount", () => {
    programMock.newcopycnt = "2";
    const label = ProgramMeta.getLabel(programMock);
    expect(label).toEqual(`MYPROG (New copy count: 2)`);
  });
  it("should return label with disabled and newcopycount", () => {
    programMock.status = "DISABLED";
    programMock.newcopycnt = "2";
    const label = ProgramMeta.getLabel(programMock);
    expect(label).toEqual(`MYPROG (New copy count: 2) (Disabled)`);
  });

  it("should return context", () => {
    const context = ProgramMeta.getContext(programMock);
    expect(context).toEqual(`cicsprogram.enabled.MYPROG`);
  });
  it("should return context with disabled", () => {
    programMock.status = "DISABLED";
    const context = ProgramMeta.getContext(programMock);
    expect(context).toEqual(`cicsprogram.disabled.MYPROG`);
  });

  it("should return icon name", () => {
    const iconName = ProgramMeta.getIconName(programMock);
    expect(iconName).toEqual(`program`);
  });
  it("should return icon name with disabled", () => {
    programMock.status = "DISABLED";
    const iconName = ProgramMeta.getIconName(programMock);
    expect(iconName).toEqual(`program-disabled`);
  });
});

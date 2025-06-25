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

import { join } from "path";
import { IProgram, ProgramMeta } from "../../../src/doc";
import { CICSSession, Resource } from "../../../src/resources";
import IconBuilder from "../../../src/utils/IconBuilder";
import { CICSProfileMock } from "../../__utils__/globalMocks";

describe("IconBuilder tests", () => {
  it("should get session icon", () => {
    const icon = IconBuilder.session(new CICSSession({ ...CICSProfileMock, hostname: "MY.HOST" }));
    expect(icon.light).toContain(join("packages", "vsce", "src", "resources", "imgs", "profile-unverified-dark.svg"));
    expect(icon.dark).toContain(join("packages", "vsce", "src", "resources", "imgs", "profile-unverified-light.svg"));
  });

  it("should get verified session icon", () => {
    const session = new CICSSession({ ...CICSProfileMock, hostname: "MY.HOST" });
    session.setVerified(true);

    const icon = IconBuilder.session(session);
    expect(icon.light).toContain(join("packages", "vsce", "src", "resources", "imgs", "profile-dark.svg"));
    expect(icon.dark).toContain(join("packages", "vsce", "src", "resources", "imgs", "profile-light.svg"));
  });

  it("should get NOT verified session icon", () => {
    const session = new CICSSession({ ...CICSProfileMock, hostname: "MY.HOST" });
    session.setVerified(false);

    const icon = IconBuilder.session(session);
    expect(icon.light).toContain(join("packages", "vsce", "src", "resources", "imgs", "profile-disconnected-dark.svg"));
    expect(icon.dark).toContain(join("packages", "vsce", "src", "resources", "imgs", "profile-disconnected-light.svg"));
  });

  it("should get open folder icon", () => {
    const icon = IconBuilder.folder(true);
    expect(icon.light).toContain(join("packages", "vsce", "src", "resources", "imgs", "folder-open-dark.svg"));
    expect(icon.dark).toContain(join("packages", "vsce", "src", "resources", "imgs", "folder-open-light.svg"));
  });
  it("should get closed folder icon", () => {
    const icon = IconBuilder.folder(false);
    expect(icon.light).toContain(join("packages", "vsce", "src", "resources", "imgs", "folder-closed-dark.svg"));
    expect(icon.dark).toContain(join("packages", "vsce", "src", "resources", "imgs", "folder-closed-light.svg"));
  });
  it("should get open folder icon using default", () => {
    const icon = IconBuilder.folder();
    expect(icon.light).toContain(join("packages", "vsce", "src", "resources", "imgs", "folder-closed-dark.svg"));
    expect(icon.dark).toContain(join("packages", "vsce", "src", "resources", "imgs", "folder-closed-light.svg"));
  });

  it("should get resource icon", () => {
    const icon = IconBuilder.resource<IProgram>({
      meta: ProgramMeta,
      resource: new Resource<IProgram>({
        eyu_cicsname: "REG",
        newcopycnt: "0",
        program: "MYPROG",
        status: "ENABLED",
        progtype: "COBOL",
        enablestatus: "ENABLED",
        library: "MYLIB",
        librarydsn: "MYLIBDSN",
      }),
    });
    expect(icon.light).toContain(join("packages", "vsce", "src", "resources", "imgs", "program-dark.svg"));
    expect(icon.dark).toContain(join("packages", "vsce", "src", "resources", "imgs", "program-light.svg"));
  });
  it("should get resource icon when disabled", () => {
    const icon = IconBuilder.resource<IProgram>({
      meta: ProgramMeta,
      resource: new Resource<IProgram>({
        eyu_cicsname: "REG",
        newcopycnt: "0",
        program: "MYPROG",
        status: "DISABLED",
        progtype: "COBOL",
        enablestatus: "ENABLED",
        library: "MYLIB",
        librarydsn: "MYLIBDSN",
      }),
    });
    expect(icon.light).toContain(join("packages", "vsce", "src", "resources", "imgs", "program-disabled-dark.svg"));
    expect(icon.dark).toContain(join("packages", "vsce", "src", "resources", "imgs", "program-disabled-light.svg"));
  });
});

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

import { type ITestEnvironment, TestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { Session } from "@zowe/imperative";
import type { ITestPropertiesSchema } from "../../../__src__/ITestPropertiesSchema";

let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
let regionName: string;
let host: string;
let port: number;
let user: string;
let password: string;
let ru: boolean;

describe("CICS refresh program command", () => {
  beforeAll(async () => {
    TEST_ENVIRONMENT = await TestEnvironment.setUp({
      testName: "refresh_program",
      installPlugin: true,
      tempProfileTypes: ["cics"],
    });
    regionName = TEST_ENVIRONMENT.systemTestProperties.cmci.regionName;
    host = TEST_ENVIRONMENT.systemTestProperties.cics.host;
    port = TEST_ENVIRONMENT.systemTestProperties.cics.port;
    user = TEST_ENVIRONMENT.systemTestProperties.cics.user;
    password = TEST_ENVIRONMENT.systemTestProperties.cics.password;
    ru = TEST_ENVIRONMENT.systemTestProperties.cics.rejectUnauthorized || false;

    session = new Session({
      user,
      password,
      hostname: host,
      port,
      type: "basic",
      rejectUnauthorized: ru,
      protocol: (TEST_ENVIRONMENT.systemTestProperties.cics.protocol as any) || "https",
    });
  });

  afterAll(async () => {
    await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
  });

  it("should be able to display the help", () => {
    const output = runCliScript(__dirname + "/__scripts__/refresh_program_help.sh", TEST_ENVIRONMENT, []);
    expect(output.stderr.toString()).toEqual("");
    expect(output.status).toEqual(0);
    expect(output.stdout.toString()).toMatchSnapshot();
  });

  it("should be able to successfully refresh a program with basic options", async () => {
    // Use DFHBRCV - a standard CICS program that exists in the load library
    const programName = "DFHBRCV";

    const output = runCliScript(__dirname + "/__scripts__/refresh_program.sh", TEST_ENVIRONMENT, [programName, regionName]);
    const stderr = output.stderr.toString();
    expect(stderr).toEqual("");
    expect(output.status).toEqual(0);
    expect(output.stdout.toString()).toContain("success");
  });

  it("should get a syntax error if program name is omitted", () => {
    const output = runCliScript(__dirname + "/__scripts__/refresh_program.sh", TEST_ENVIRONMENT, ["", "FAKERGN"]);
    const stderr = output.stderr.toString();
    expect(stderr).toContain("Syntax");
    expect(stderr).toContain("Missing Positional Argument");
    expect(stderr).toContain("programName");
    expect(output.status).toEqual(1);
  });

  it("should be able to successfully refresh a program with profile options", async () => {
    // Use DFHBRCV - a standard CICS program that exists in the load library
    const programName = "DFHBRCV";

    const output = runCliScript(__dirname + "/__scripts__/refresh_program.sh", TEST_ENVIRONMENT, [
      programName,
      regionName,
      host,
      port,
      user,
      password,
    ]);
    const stderr = output.stderr.toString();
    expect(stderr).toEqual("");
    expect(output.status).toEqual(0);
    expect(output.stdout.toString()).toContain("success");
  });
});

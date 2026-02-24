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
import type { ITestPropertiesSchema } from "../../../__src__/ITestPropertiesSchema";

let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;

describe("CICS define urimap-pipeline command", () => {
  beforeAll(async () => {
    TEST_ENVIRONMENT = await TestEnvironment.setUp({
      testName: "define_urimap_pipeline",
      installPlugin: true,
      tempProfileTypes: ["cics"],
    });
  });

  afterAll(async () => {
    await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
  });

  it("should be able to display the help", () => {
    const output = runCliScript(__dirname + "/__scripts__/define_urimap_pipeline_help.sh", TEST_ENVIRONMENT, []);
    expect(output.stderr.toString()).toEqual("");
    expect(output.status).toEqual(0);
    expect(output.stdout.toString()).toMatchSnapshot();
  });

  it("should get a syntax error if urimap name is omitted", () => {
    const output = runCliScript(__dirname + "/__scripts__/define_urimap_pipeline.sh", TEST_ENVIRONMENT, [
      "",
      "FAKEGRP",
      "FAKEPATH",
      "FAKEHOST",
      "FAKEPIPE",
      "FAKERGN",
      "false",
      "TESTSVC",
    ]);
    const stderr = output.stderr.toString();
    expect(stderr).toContain("Syntax");
    expect(stderr).toContain("urimap");
    expect(stderr).toContain("name");
    expect(output.status).toEqual(1);
  });

  it("should get a syntax error if CSD group is omitted", () => {
    const output = runCliScript(__dirname + "/__scripts__/define_urimap_pipeline.sh", TEST_ENVIRONMENT, [
      "FAKESRV",
      "",
      "FAKEPATH",
      "FAKEHOST",
      "FAKEPIPE",
      "FAKERGN",
      "false",
      "TESTSVC",
    ]);
    const stderr = output.stderr.toString();
    expect(stderr).toContain("Syntax");
    expect(stderr).toContain("csdGroup");
    expect(output.status).toEqual(1);
  });

  it("should get a syntax error if urimap path is omitted", () => {
    const output = runCliScript(__dirname + "/__scripts__/define_urimap_pipeline.sh", TEST_ENVIRONMENT, [
      "FAKESRV",
      "FAKEGRP",
      "",
      "FAKEHOST",
      "FAKEPIPE",
      "FAKERGN",
      "false",
      "TESTSVC",
    ]);
    const stderr = output.stderr.toString();
    expect(stderr).toContain("Syntax");
    expect(stderr).toContain("urimap-path");
    expect(output.status).toEqual(1);
  });

  it("should get a syntax error if urimap host is omitted", () => {
    const output = runCliScript(__dirname + "/__scripts__/define_urimap_pipeline.sh", TEST_ENVIRONMENT, [
      "FAKESRV",
      "FAKEGRP",
      "FAKEPATH",
      "",
      "FAKEPIPE",
      "FAKERGN",
      "false",
      "TESTSVC",
    ]);
    const stderr = output.stderr.toString();
    expect(stderr).toContain("Syntax");
    expect(stderr).toContain("urimap-host");
    expect(output.status).toEqual(1);
  });

  it("should get a syntax error if pipeline name is omitted", () => {
    const output = runCliScript(__dirname + "/__scripts__/define_urimap_pipeline.sh", TEST_ENVIRONMENT, [
      "FAKESRV",
      "FAKEGRP",
      "FAKEPATH",
      "FAKEHOST",
      "",
      "FAKERGN",
      "false",
      "TESTSVC",
    ]);
    const stderr = output.stderr.toString();
    expect(stderr).toContain("Syntax");
    expect(stderr).toContain("pipeline-name");
    expect(output.status).toEqual(1);
  });

  it("should get a syntax error if region name is omitted", () => {
    const output = runCliScript(__dirname + "/__scripts__/define_urimap_pipeline.sh", TEST_ENVIRONMENT, [
      "FAKESRV",
      "FAKEGRP",
      "FAKEPATH",
      "FAKEHOST",
      "FAKEPIPE",
      "",
      "false",
      "TESTSVC",
    ]);
    const stderr = output.stderr.toString();
    expect(stderr).toContain("Syntax");
    expect(stderr).toContain("region-name");
    expect(output.status).toEqual(1);
  });
});

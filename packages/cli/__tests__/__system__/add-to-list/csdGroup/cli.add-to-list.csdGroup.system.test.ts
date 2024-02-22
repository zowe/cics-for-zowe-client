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

import { ITestEnvironment, TestEnvironment, runCliScript } from "@zowe/cli-test-utils";
import { ITestPropertiesSchema } from "../../../__src__/ITestPropertiesSchema";

let TEST_ENVIRONMENT: ITestEnvironment<ITestPropertiesSchema>;
describe("CICS add-to-list csdGroup command", () => {

  beforeAll(async () => {
    TEST_ENVIRONMENT = await TestEnvironment.setUp({
      testName: "add_to_list_csdGroup",
      installPlugin: true,
      tempProfileTypes: ["cics"]
    });
  });

  afterAll(async () => {
    await TestEnvironment.cleanUp(TEST_ENVIRONMENT);
  });

  it("should be able to display the help", () => {
    const output = runCliScript(__dirname + "/__scripts__/add_to_list_csdGroup_help.sh", TEST_ENVIRONMENT, []);
    expect(output.stderr.toString()).toEqual("");
    expect(output.status).toEqual(0);
    expect(output.stdout.toString()).toMatchSnapshot();
  });

  it("should get a syntax error if csdGroup name is omitted", () => {
    const output = runCliScript(__dirname + "/__scripts__/add_to_list_csdGroup.sh", TEST_ENVIRONMENT,
      ["", "FAKELIST", "FAKERGN"]);
    const stderr = output.stderr.toString();
    expect(stderr).toContain("Syntax");
    expect(stderr).toContain("Missing Positional Argument");
    expect(stderr).toContain("name of the CSD Group");
    expect(output.status).toEqual(1);
  });

  it("should get a syntax error if list name is omitted", () => {
    const output = runCliScript(__dirname + "/__scripts__/add_to_list_csdGroup.sh", TEST_ENVIRONMENT,
      ["FAKEGRP", "", "FAKERGN"]);
    const stderr = output.stderr.toString();
    expect(stderr).toContain("Syntax");
    expect(stderr).toContain("Missing Positional Argument");
    expect(stderr).toContain("name of the CSD List");
    expect(output.status).toEqual(1);
  });
});

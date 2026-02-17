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

import { type ITestEnvironment, TestEnvironment } from "@zowe/cli-test-utils";
import { Session } from "@zowe/imperative";
import { type IResourceParms, getResource } from "../../../src";
import type { ITestPropertiesSchema } from "../../__src__/ITestPropertiesSchema";

let testEnvironment: ITestEnvironment<ITestPropertiesSchema>;
let regionName: string;
let session: Session;

describe("CICS Get resource", () => {
  beforeAll(async () => {
    testEnvironment = await TestEnvironment.setUp({
      testName: "cics_cmci_get_resource",
      tempProfileTypes: ["cics"],
    });
    regionName = testEnvironment.systemTestProperties.cmci.regionName;
    const cicsProperties = testEnvironment.systemTestProperties.cics;

    session = new Session({
      user: cicsProperties.user,
      password: cicsProperties.password,
      hostname: cicsProperties.host,
      port: cicsProperties.port,
      type: "basic",
      rejectUnauthorized: cicsProperties.rejectUnauthorized || false,
      protocol: (cicsProperties.protocol as any) || "https",
    });
  });

  afterAll(async () => {
    await TestEnvironment.cleanUp(testEnvironment);
  });

  const options: IResourceParms = {} as any;

  it("should get a resource from CICS", async () => {
    let error;
    let response;

    options.name = "CICSProgram";
    options.regionName = regionName;

    try {
      response = await getResource(session, options);
    } catch (err) {
      error = err;
    }

    expect(error).toBeFalsy();
    expect(response).toBeTruthy();
    expect(response.response.resultsummary.api_response1).toBe("1024");
  });

  it("should get a resource from CICS using criteria", async () => {
    let error;
    let response;

    options.name = "CICSProgram";
    options.regionName = regionName;
    options.criteria = "program=D*";
    try {
      response = await getResource(session, options);
    } catch (err) {
      error = err;
    }

    expect(error).toBeFalsy();
    expect(response).toBeTruthy();
    expect(response.response.resultsummary.api_response1).toBe("1024");
  });

  it("should fail to define a resource to CICS with invalid CICS region", async () => {
    let error;
    let response;

    options.name = "CICSProgram";
    options.criteria = "program=D*";
    options.regionName = "FAKE";

    try {
      response = await getResource(session, options);
    } catch (err) {
      error = err;
    }

    expect(error).toBeTruthy();
    expect(response).toBeFalsy();
    expect(error.message).toContain("Did not receive the expected response from CMCI REST API");
    expect(error.message).toContain("INVALIDPARM");
  });
});

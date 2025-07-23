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

import { ResourceTypes, SupportedResourceTypes } from "../../src/resources/ResourceTypes";

describe("ResourceType tests", () => {
  it("should return list of supported resources", () => {
    expect(SupportedResourceTypes).toEqual([
      "CICSLocalFile",
      "CICSLocalTransaction",
      "CICSProgram",
      "CICSTCPIPService",
      "CICSLibrary",
      "CICSURIMap",
      "CICSTask",
      "CICSPipeline",
      "CICSWebService",
      "CICSJVMServer", // Added JVMServer to the list
    ]);
  });

  it("should have enum of resource names", () => {
    expect(ResourceTypes).toHaveProperty("CICSProgram");
    expect(ResourceTypes.CICSProgram).toEqual("CICSProgram");
  });
});

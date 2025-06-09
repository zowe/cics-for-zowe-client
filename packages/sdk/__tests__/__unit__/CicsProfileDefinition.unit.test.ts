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

import { getCICSProfileDefinition } from "../../src";

describe("CICS Profile definition", () => {
  it("Should return accurage cics profile definition", () => {
    expect(getCICSProfileDefinition()).toHaveProperty("type");
    expect(getCICSProfileDefinition()).toHaveProperty("schema");

    expect(getCICSProfileDefinition().schema).toHaveProperty("required");
    expect(getCICSProfileDefinition().type).toEqual("cics");
  });
});

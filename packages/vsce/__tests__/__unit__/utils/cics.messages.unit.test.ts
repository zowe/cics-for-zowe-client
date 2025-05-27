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

import { CICSMessages } from "../../../src/constants/CICS.messages";

describe("CICS Messages constants", () => {

  it("should import constants correctly", () => {

    expect(CICSMessages.zoweExplorerNotFound).toHaveProperty("message");
    expect(CICSMessages.zoweExplorerNotFound.message).toBe("Zowe Explorer was not found: Please ensure Zowe Explorer v2.0.0 or higher is installed");

    expect(CICSMessages.zoweExplorerModified).toHaveProperty("message");
    expect(CICSMessages.zoweExplorerModified.message).toBe("Zowe Explorer was modified for the CICS Extension.");

    expect(CICSMessages.notInitializedCorrectly).toHaveProperty("message");
    expect(CICSMessages.notInitializedCorrectly.message).toBe("IBM CICS for Zowe Explorer was not initialized correctly.");

    expect(CICSMessages.incorrectZoweExplorerVersion).toHaveProperty("message");
    expect(CICSMessages.incorrectZoweExplorerVersion.message).toBe("Zowe Explorer was not found: either it is not installed or you are using an older version without extensibility API. Please ensure Zowe Explorer v2.0.0-next.202202221200 or higher is installed");

    expect(CICSMessages.loadingResources).toHaveProperty("message");
    expect(CICSMessages.loadingResources.message).toBe("Loading resources...");

  });
});

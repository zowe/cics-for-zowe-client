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

import { Gui } from "@zowe/zowe-explorer-api";
import { buildQuickPick, getPatternFromFilter } from "../../../src/utils/filterUtils";

describe("Filter Utils tests", () => {

  it("should return qucikpick object to use", () => {

    const quickpick = buildQuickPick("MYRES", ["prev1", "prev2"]);

    expect(quickpick.items).toHaveLength(3);
    expect(quickpick.items[0].label).toContain("Create New MYRES Filter");
    expect(quickpick.items[1]).toEqual({ label: "prev1" });
    expect(quickpick.items[2]).toEqual({ label: "prev2" });

  });

  it("should get pattern", async () => {
    jest.spyOn(Gui, "resolveQuickPick").mockResolvedValueOnce({ label: "NEWPATTERN" });
    const pattern = await getPatternFromFilter("MYRES", ["prev1"], false);
    expect(pattern).toEqual("NEWPATTERN");
  });
});
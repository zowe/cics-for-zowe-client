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

import * as commandUtils from "../../../src/utils/commandUtils";

describe("Command Utils tests", () => {
  describe("findSelectedNodes", () => {
    it("should return no selected nodes", () => {
      const response = commandUtils.findSelectedNodes({ selection: [] } as any, new (class Test {})());
      expect(response).toEqual([]);
    });

    it("should return selected nodes matching the test class", () => {
      const c = class Test {
        constructor() {}
      };
      const response = commandUtils.findSelectedNodes({ selection: [new c(), {}] } as any, c);
      expect(response).toEqual([new c()]);
    });

    it("should return cicked node from the selected nodes matching the test class", () => {
      const c = class MyTest {
        constructor() {}
      };
      const t = new Error("test");
      const response = commandUtils.findSelectedNodes({ selection: [t, new c(), {}] } as any, Error, t);
      expect(response).toEqual([t]);
    });
  });
});

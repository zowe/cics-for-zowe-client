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

import * as iconUtils from "../../../src/utils/iconUtils";
import { join } from "path";
//import fs from "fs";

describe("Icon Utils tests", () => {
  describe("testLightDark", () => {
    it("should give light and dark", () => {
      expect(iconUtils.getIconPathInResources("hello").light).toMatch(join("resources", "imgs", "hello-light.svg"));
      expect(iconUtils.getIconPathInResources("hello").dark).toMatch(join("resources", "imgs", "hello-dark.svg"));
    });
  });

  /* mock a set of tree items and verify getIconNameRoot
  describe("testIconsByStatus", () => {
    it("blah", () => {
      expect;
    });
  });*/
});

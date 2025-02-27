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

import { ICommandDefinition } from "@zowe/imperative";

describe("cics remove-from-list", () => {
  const REMOVE_FROM_LIST_RESOURCES = 1;

  it("should not have changed", () => {
    const definition: ICommandDefinition = require("../../../src/remove-from-list/RemoveFromList.definition");
    expect(definition).toBeDefined();
    expect(definition.children.length).toBe(REMOVE_FROM_LIST_RESOURCES);
    delete definition.children;
    expect(definition).toMatchSnapshot();
  });
});

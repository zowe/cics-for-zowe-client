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

import { ResourceAction, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { getPipelineActions } from "../../../../src/resources/actions/PipelineActions";

describe("Pipeline Actions", () => {
  describe("getPipelineActions", () => {
    it("should return exactly 2 pipeline actions", () => {
      const actions = getPipelineActions();
      expect(actions).toHaveLength(2);
    });

    it("should return ResourceAction instances with CICSPipeline resource type", () => {
      const actions = getPipelineActions();
      actions.forEach((action) => {
        expect(action).toBeInstanceOf(ResourceAction);
        expect(action.resourceType).toBe(ResourceTypes.CICSPipeline);
      });
    });

    it("should have unique action IDs", () => {
      const actions = getPipelineActions();
      const ids = actions.map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("should return actions in expected order", () => {
      const actions = getPipelineActions();
      expect(actions[0].id).toBe("CICS.CICSPipeline.COPY_NAME");
      expect(actions[1].id).toBe("CICS.CICSPipeline.COMPARE_TO");
    });
  });

  describe("Action: COPY_NAME", () => {
    it("should have correct id and command", () => {
      const actions = getPipelineActions();
      const copyAction = actions.find((a) => a.id === "CICS.CICSPipeline.COPY_NAME")!;

      expect(copyAction).toBeDefined();
      expect(copyAction.action).toBe("cics-extension-for-zowe.copyResourceName");
      expect(copyAction.refreshResourceInspector).toBe(false);
      expect(copyAction.visibleWhen).toBeUndefined();
    });
  });

  describe("Action: COMPARE_TO", () => {
    it("should have correct id and command", () => {
      const actions = getPipelineActions();
      const compareAction = actions.find((a) => a.id === "CICS.CICSPipeline.COMPARE_TO")!;

      expect(compareAction).toBeDefined();
      expect(compareAction.action).toBe("cics-extension-for-zowe.compareTreeResourceTo");
      expect(compareAction.refreshResourceInspector).toBe(false);
      expect(compareAction.visibleWhen).toBeUndefined();
    });
  });
});

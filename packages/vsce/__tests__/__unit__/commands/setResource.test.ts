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

import type { IResource, IResourceProfileNameInfo } from "@zowe/cics-for-zowe-explorer-api";
import { buildPayload, setResource, resourceActionVerbMap } from "../../../src/commands/setResource";
import * as resourceUtils from "../../../src/utils/resourceUtils";
import type { IResourceMeta } from "../../../src/doc/meta/IResourceMeta";

jest.mock("../../../src/utils/resourceUtils");

describe("setResource", () => {
  let mockMeta: IResourceMeta<IResource>;
  let mockCtx: IResourceProfileNameInfo;
  let mockParentResource: IResource;

  beforeEach(() => {
    jest.clearAllMocks();

    mockMeta = {
      resourceName: "CICSProgram",
      buildCriteria: jest.fn().mockReturnValue("name=TEST"),
    } as Partial<IResourceMeta<IResource>> as IResourceMeta<IResource>;

    mockCtx = {
      profileName: "testProfile",
      cicsplexName: "PLEX1",
      regionName: "REGION1",
    };

    mockParentResource = {
      attributes: {
        name: "PARENT",
      },
    } as Partial<IResource> as IResource;

    (resourceUtils.runPutResource as jest.Mock) = jest.fn().mockResolvedValue({ success: true });
  });

  describe("resourceActionVerbMap", () => {
    it("should contain all action verbs", () => {
      expect(resourceActionVerbMap).toHaveProperty("DISABLE");
      expect(resourceActionVerbMap).toHaveProperty("ENABLE");
      expect(resourceActionVerbMap).toHaveProperty("CLOSE");
      expect(resourceActionVerbMap).toHaveProperty("OPEN");
      expect(resourceActionVerbMap).toHaveProperty("PHASEIN");
      expect(resourceActionVerbMap).toHaveProperty("NEWCOPY");
      expect(resourceActionVerbMap).toHaveProperty("DELETE");
    });
  });

  describe("buildPayload", () => {
    it("should build payload without parameter", () => {
      const payload = buildPayload("DISABLE");

      expect(payload).toEqual({
        request: {
          action: {
            $: {
              name: "DISABLE",
            },
          },
        },
      });
    });

    it("should build payload with parameter", () => {
      const parameter = { name: "testParam", value: "testValue" };
      const payload = buildPayload("ENABLE", parameter);

      expect(payload).toEqual({
        request: {
          action: {
            $: {
              name: "ENABLE",
            },
            parameter: {
              $: parameter,
            },
          },
        },
      });
    });

    it("should handle different action names", () => {
      const actions = ["DISABLE", "ENABLE", "CLOSE", "OPEN", "PHASEIN", "NEWCOPY", "DELETE"];

      actions.forEach((action) => {
        const payload = buildPayload(action);
        expect(payload.request.action.$.name).toBe(action);
      });
    });
  });

  describe("setResource", () => {
    it("should call runPutResource with correct parameters", async () => {
      await setResource({
        ctx: mockCtx,
        meta: mockMeta,
        resourceName: "TEST",
        action: "DISABLE",
      });

      expect(resourceUtils.runPutResource).toHaveBeenCalledWith(
        {
          profileName: "testProfile",
          resourceName: "CICSProgram",
          cicsPlex: "PLEX1",
          regionName: "REGION1",
          params: { criteria: "name=TEST" },
        },
        {
          request: {
            action: {
              $: {
                name: "DISABLE",
              },
            },
          },
        }
      );
    });

    it("should include parent resource in criteria", async () => {
      await setResource({
        ctx: mockCtx,
        meta: mockMeta,
        resourceName: "TEST",
        action: "ENABLE",
        parentResource: mockParentResource,
      });

      expect(mockMeta.buildCriteria).toHaveBeenCalledWith(["TEST"], mockParentResource);
    });

    it("should include parameter in payload", async () => {
      const parameter = { name: "testParam", value: "testValue" };

      await setResource({
        ctx: mockCtx,
        meta: mockMeta,
        resourceName: "TEST",
        action: "PHASEIN",
        parameter,
      });

      expect(resourceUtils.runPutResource).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          request: {
            action: expect.objectContaining({
              parameter: {
                $: parameter,
              },
            }),
          },
        })
      );
    });

    it("should handle all action types", async () => {
      const actions: Array<keyof typeof resourceActionVerbMap> = [
        "DISABLE",
        "ENABLE",
        "CLOSE",
        "OPEN",
        "PHASEIN",
        "NEWCOPY",
        "DELETE",
      ];

      for (const action of actions) {
        await setResource({
          ctx: mockCtx,
          meta: mockMeta,
          resourceName: "TEST",
          action,
        });

        expect(resourceUtils.runPutResource).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            request: {
              action: expect.objectContaining({
                $: {
                  name: action,
                },
              }),
            },
          })
        );
      }
    });

    it("should return result from runPutResource", async () => {
      const mockResult = { success: true, data: "test" };
      (resourceUtils.runPutResource as jest.Mock) = jest.fn().mockResolvedValue(mockResult);

      const result = await setResource({
        ctx: mockCtx,
        meta: mockMeta,
        resourceName: "TEST",
        action: "DISABLE",
      });

      expect(result).toEqual(mockResult);
    });

    it("should handle context without cicsPlex", async () => {
      const ctxWithoutPlex: IResourceProfileNameInfo = {
        ...mockCtx,
        cicsplexName: undefined,
      };

      await setResource({
        ctx: ctxWithoutPlex,
        meta: mockMeta,
        resourceName: "TEST",
        action: "ENABLE",
      });

      expect(resourceUtils.runPutResource).toHaveBeenCalledWith(
        expect.objectContaining({
          cicsPlex: undefined,
        }),
        expect.any(Object)
      );
    });
  });
});



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
import { l10n } from "vscode";
import type { IResourceMeta } from "../doc";
import { runPutResource } from "../utils/resourceUtils";

export const resourceActionVerbMap = {
  DISABLE: l10n.t("Disabling"),
  ENABLE: l10n.t("Enabling"),
  CLOSE: l10n.t("Closing"),
  OPEN: l10n.t("Opening"),
  PHASEIN: l10n.t("Phase In"),
  NEWCOPY: l10n.t("New Copy"),
  DELETE: l10n.t("Deleting"),
};

interface ISetResourcePayloadParameter {
  name: string;
  value: string;
}

interface ISetResourceArgs {
  ctx: IResourceProfileNameInfo;
  meta: IResourceMeta<IResource>;
  resourceName: string;
  action: keyof typeof resourceActionVerbMap;
  parentResource?: IResource;
  parameter?: ISetResourcePayloadParameter;
}

interface ISetResourcePayload {
  request: {
    action: {
      $: {
        name: string;
      };
      parameter?: {
        $: ISetResourcePayloadParameter;
      };
    };
  };
}

export const buildPayload = (actionName: string, parameter?: ISetResourcePayloadParameter) => {
  const payload: ISetResourcePayload = {
    request: {
      action: {
        $: {
          name: actionName,
        },
      },
    },
  };

  if (parameter) {
    payload.request.action.parameter = {
      $: parameter,
    };
  }

  return payload;
};

export const setResource = async ({ ctx, meta, resourceName, parameter, parentResource, action }: ISetResourceArgs) => {
  return runPutResource(
    {
      profileName: ctx.profileName,
      resourceName: meta.resourceName,
      cicsPlex: ctx.cicsplexName,
      regionName: ctx.regionName,
      params: { criteria: meta.buildCriteria([resourceName], parentResource) },
    },
    buildPayload(action, parameter)
  );
};

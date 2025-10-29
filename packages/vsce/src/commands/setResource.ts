import { IResource, IResourceProfileNameInfo } from "@zowe/cics-for-zowe-explorer-api";
import { IResourceMeta } from "../doc";
import { runPutResource } from "../utils/resourceUtils";

export const resourceActionVerbMap = {
  "DISABLE": "Disabling",
  "ENABLE": "Enabling",
  "CLOSE": "Closing",
  "OPEN": "Opening",
  "PHASEIN": "Phase In",
  "NEWCOPY": "New Copy",
};

interface ISetResourcePayloadParameter {
  name: string;
  value: string;
}

interface ISetResourceArgs {
  cxt: IResourceProfileNameInfo;
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

export const setResource = async ({ cxt, meta, resourceName, parameter, parentResource, action }: ISetResourceArgs) => {
  return runPutResource(
    {
      profileName: cxt.profileName,
      resourceName: meta.resourceName,
      cicsPlex: cxt.cicsplexName,
      regionName: cxt.regionName,
      params: { criteria: meta.buildCriteria([resourceName], parentResource) },
    },
    buildPayload(action, parameter)
  );
};

import { IWebService } from "@zowe/cics-for-zowe-sdk";
import constants from "../utils/constants";
import { getDefaultFilter } from "../utils/filterUtils";
import { ResourceMeta } from "./IResourceMeta";


export const WebServiceMeta: ResourceMeta<IWebService> = {

  resourceName: "CICSWebService",
  humanReadableName: "Web Services",
  contextPrefix: "cicstreewebservice",
  combinedContextPrefix: "cicscombinedwebservicetree",
  filterAttribute: "NAME",
  primaryKeyAttribute: "name",

  persistentStorageKey: "webservices",
  persistentStorageAllKey: "allWebServices",

  getDefaultFilter: async function (): Promise<string> {
    return getDefaultFilter(constants.PERSISTENT_STORAGE.WEBSERVICE_FILTER);
  },

  getLabel: function (webservice: IWebService): string {
    const label = `${webservice.name}`;
    return label;
  },

  getContext: function (webservice: IWebService): string {
    return `cicswebservice.${webservice.name}`;
  },

  getIconName: function (_webservice: IWebService): string {
    return `program`;
  }

};


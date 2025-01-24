import { ILocalFile } from "@zowe/cics-for-zowe-sdk";
import constants from "../utils/constants";
import { getDefaultFilter } from "../utils/filterUtils";
import { ResourceMeta } from "./IResourceMeta";


export const LocalFileMeta: ResourceMeta<ILocalFile> = {

  resourceName: "CICSLocalFile",
  humanReadableName: "Local Files",
  contextPrefix: "cicstreelocalfile",
  combinedContextPrefix: "cicscombinedlocalfiletree",
  filterAttribute: "file",
  primaryKeyAttribute: "file",

  getDefaultFilter: async function (): Promise<string> {
    return getDefaultFilter(constants.PERSISTENT_STORAGE.LOCAL_FILE_FILTER);
  },

  getLabel: function (localFile: ILocalFile): string {
    let label = `${localFile.file}`;

    if (localFile.enablestatus.trim().toLowerCase() === "disabled") {
      label += ` (Disabled)`;
    } else if (localFile.enablestatus.trim().toLowerCase() === "unenabled") {
      label += ` (Unenabled)`;
    }

    if (localFile.openstatus.trim().toLowerCase() === "closed") {
      label += ` (Closed)`;
    }

    return label;
  },

  getContext: function (localFile: ILocalFile): string {
    return `cicslocalfile.${localFile.enablestatus.trim().toLowerCase()}.${localFile.openstatus.trim().toLowerCase()}.${localFile.file}`;
  },

  getIconName: function (_localFile: ILocalFile): string {
    return `local-file`;
  }

};


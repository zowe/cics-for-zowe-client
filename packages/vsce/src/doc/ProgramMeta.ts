import { IProgram } from "@zowe/cics-for-zowe-sdk";
import constants from "../utils/constants";
import { getDefaultFilter } from "../utils/filterUtils";
import { ResourceMeta } from "./IResourceMeta";


export const ProgramMeta: ResourceMeta<IProgram> = {

  resourceName: "CICSProgram",
  humanReadableName: "Programs",
  contextPrefix: "cicstreeprogram",
  combinedContextPrefix: "cicscombinedprogramtree",
  filterAttribute: "PROGRAM",
  primaryKeyAttribute: "program",

  persistentStorageKey: "program",
  persistentStorageAllKey: "allPrograms",

  getDefaultFilter: async function (): Promise<string> {
    return getDefaultFilter(constants.PERSISTENT_STORAGE.PROGRAM_FILTER);
  },

  getLabel: function (program: IProgram): string {
    let label = `${program.program}`;
    if (program.newcopycnt && parseInt(program.newcopycnt) > 0) {
      label += ` (New copy count: ${program.newcopycnt})`;
    }
    if (program.status.trim().toLowerCase() === "disabled") {
      label += " (Disabled)";
    }

    return label;
  },

  getContext: function (program: IProgram): string {
    return `cicsprogram.${program.status.trim().toLowerCase()}.${program.program}`;
  },

  getIconName: function (_program: IProgram): string {
    return `program`;
  }

};


import { ITask } from "@zowe/cics-for-zowe-sdk";
import constants from "../utils/constants";
import { getDefaultFilter } from "../utils/filterUtils";
import { ResourceMeta } from "./IResourceMeta";


export const TaskMeta: ResourceMeta<ITask> = {

  resourceName: "CICSTask",
  humanReadableName: "Tasks",
  contextPrefix: "cicstreetask",
  combinedContextPrefix: "cicscombinedtasktree",
  filterAttribute: "tranid",
  primaryKeyAttribute: "task",

  getDefaultFilter: async function (): Promise<string> {
    return getDefaultFilter(constants.PERSISTENT_STORAGE.PROGRAM_FILTER);
  },

  getLabel: function (task: ITask): string {
    let label = `${task.task} - ${task.tranid}`;

    if (task.runstatus !== "SUSPENDED") {
      label += ` (${task.runstatus})`;
    }

    return label;
  },

  getContext: function (task: ITask): string {
    return `cicstask.${task.task}`;
  },

  getIconName: function (task: ITask): string {
    if (task.runstatus.trim().toUpperCase() === "RUNNING") {
      return `task-running`;
    } else if (task.runstatus.trim().toUpperCase() === "SUSPENDED") {
      return `task-suspended`;
    }
    return `task-dispatched`;
  }

};


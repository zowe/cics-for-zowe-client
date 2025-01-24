import { IResource } from "./IResourceTypes";


export interface ITask extends IResource {
  task: string;
  runstatus: string;
  tranid: string;
}

export const buildTaskLabel = (task: ITask) => {

  let label = `${task.task} - ${task.tranid}`;

  if (task.runstatus !== "SUSPENDED") {
    label += ` (${task.runstatus})`;
  }

  return label;
};

export const buildTaskContext = (task: ITask) => {
  return `cicstask.${task.task}`;
};

export const buildTaskIconName = (task: ITask) => {
  if (task.runstatus.trim().toUpperCase() === "RUNNING") {
    return `task-running`;
  } else if (task.runstatus.trim().toUpperCase() === "SUSPENDED") {
    return `task-suspended`;
  }
  return `task-dispatched`;
}


import { IResource } from "./IResource";

export interface ITask extends IResource {
  task: string;
  runstatus: string;
  tranid: string;
}

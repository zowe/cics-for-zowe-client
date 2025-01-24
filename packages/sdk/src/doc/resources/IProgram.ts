import { IResource } from "./IResource";

export interface IProgram extends IResource {
  program: string;
  status: string;
  newcopycnt?: string;
}

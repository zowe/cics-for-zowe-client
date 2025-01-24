import { IResource } from "./IResource";

export interface ITransaction extends IResource {
  tranid: string;
  program: string;
  status: string;
}

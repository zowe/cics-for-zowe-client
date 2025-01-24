import { IResource } from "./IResource";

export interface ILocalFile extends IResource {
  file: string;
  enablestatus: string;
  openstatus: string;
}


import { IResource } from "./IResource";

export interface IRegion extends IResource {
  applid: string;
  cicsstate: string;
  cicsstatus: string;
  cicsname: string;
}


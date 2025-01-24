import { IResource } from "./IResourceTypes";


export interface IRegion extends IResource {
  applid: string;
  cicsstate: string;
  cicsstatus: string;
  cicsname: string;
}


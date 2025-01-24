import { IResource } from "./IResource";

export interface IUriMap extends IResource {
  name: string;
  scheme: string;
  path: string;
}

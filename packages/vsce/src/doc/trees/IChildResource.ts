import { ResourceContainer } from "../../resources";
import { IResourceMeta } from "../meta";
import { IResource } from "../resources";

export interface IChildResource<T extends IResource> {
  resources: ResourceContainer<T>;
  meta: IResourceMeta<T>;
}

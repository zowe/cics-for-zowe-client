import { Resource } from "../../resources";
import { IResourceMeta } from "../meta";
import { IResource } from "../resources";

export interface IContainedResource<T extends IResource> {
  resource: Resource<T>;
  meta: IResourceMeta<T>;
}

import { Resource } from "../../resources";
import { IResourceMeta } from "../meta";

export interface IContainedResource<T> {
  resource: Resource<T>;
  meta: IResourceMeta<T>;
}

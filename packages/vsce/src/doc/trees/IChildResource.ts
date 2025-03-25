import { ResourceContainer } from "../../resources";
import { IResourceMeta } from "../meta";

export interface IChildResource<T> {
  resources: ResourceContainer<T>;
  meta: IResourceMeta<T>;
}

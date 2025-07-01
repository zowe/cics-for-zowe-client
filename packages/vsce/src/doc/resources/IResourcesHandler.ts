import { Resource, ResourceContainer } from "../../resources";
import { IResource } from "./IResource";

export interface IResourcesHandler {
  resources: [Resource<IResource>[], boolean];
  resourceContainer: ResourceContainer<IResource>;
}

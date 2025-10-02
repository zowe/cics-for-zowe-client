import { IResource, IResourceWithEnableStatus } from "./IResource";

export interface IJVMServer extends IResourceWithEnableStatus {
    name: string;
}
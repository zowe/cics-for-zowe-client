import { IResource } from "./IResource";

export interface IJVMServer extends IResource {
    name: string;
    enableStatus: string;
}
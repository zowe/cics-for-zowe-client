import { Event } from "vscode";

export declare interface IResourceEvent<T> {

  getEvent():  Event<T>;

  fire(event: T): void;
}

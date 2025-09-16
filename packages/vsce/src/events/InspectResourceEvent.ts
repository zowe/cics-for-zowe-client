/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 */

import { EventEmitter, Event } from "vscode";

import { IResourceInspectEvent } from "@zowe/cics-for-zowe-explorer-api";
import { IResourceEvent } from "./IResourceEvent";

export class InspectResourceEvent implements IResourceEvent<IResourceInspectEvent> {
  private static instance: InspectResourceEvent;

  private eventEmitter: EventEmitter<IResourceInspectEvent>;
  private onEvent: Event<IResourceInspectEvent>;

  private constructor() {
    this.eventEmitter = new EventEmitter<IResourceInspectEvent>();
    this.onEvent = this.eventEmitter.event;
  }

  // Creating a singleton instance
  public static getInstance(): InspectResourceEvent {
    if (!InspectResourceEvent.instance) {
      InspectResourceEvent.instance = new InspectResourceEvent();
    }
    return InspectResourceEvent.instance;
  }

  getEvent(): Event<IResourceInspectEvent> {
    return this.onEvent;
  }

  public fire(event: IResourceInspectEvent) {
    this.eventEmitter.fire(event);
  }
}

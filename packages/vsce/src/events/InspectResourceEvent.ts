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

import { EventSourceTypes, IResourceInspectEvent, ResourceTypes } from "@zowe/cics-for-zowe-explorer-api";
import { CICSResourceContainerNode } from "../trees/CICSResourceContainerNode";
import { IResource } from "../doc/resources/IResource";

export class InspectResourceEvent {
  private inspectResourceEventEmitter:  EventEmitter<IResourceInspectEvent>;
  private onDidInspectResourceEvent: Event<IResourceInspectEvent>;

  private static instance: InspectResourceEvent;

  private constructor() {
    this.inspectResourceEventEmitter = new EventEmitter<IResourceInspectEvent>();
    this.onDidInspectResourceEvent = this.inspectResourceEventEmitter.event;
  }

  // Creating a singleton instance
  public static getInstance(): InspectResourceEvent {
    if (!InspectResourceEvent.instance) {
      InspectResourceEvent.instance = new InspectResourceEvent();
    }
    return InspectResourceEvent.instance;
  }

  public getOnDidInspectResourceEvent(): Event<IResourceInspectEvent> {
    return this.onDidInspectResourceEvent;
  }

  public fire(event: IResourceInspectEvent) {
    this.inspectResourceEventEmitter.fire(event);
  }

  public fireByNode(node: CICSResourceContainerNode<IResource>) {
    const targetNodeMeta = node.getContainedResource().meta;
    this.fire({ resourceType:  targetNodeMeta.resourceName as keyof typeof ResourceTypes,
    source: EventSourceTypes.TREE} as IResourceInspectEvent);
  }
}

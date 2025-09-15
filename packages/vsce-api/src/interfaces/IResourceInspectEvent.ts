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

import { EventSourceTypes } from "../enums/EventSourceTypes";
import { ResourceTypes } from "../resources/ResourceTypes";

export interface IResourceInspectEvent {

  resourceType: ResourceTypes;

  source: EventSourceTypes;
}

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

import { CICSSession } from "@zowe/cics-for-zowe-sdk";
import { join } from "path";
import { IContainedResource, IResource } from "../doc";

class SIconBuilder {
  private static _instance: SIconBuilder;
  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  private constructor() {}

  public getIconFilePathFromName(iconFileName: string): { light: string; dark: string } {
    return {
      light: join(__dirname, "..", "resources", "imgs", iconFileName + "-dark.svg"),
      dark: join(__dirname, "..", "resources", "imgs", iconFileName + "-light.svg"),
    };
  }

  session(session: CICSSession) {
    if (session.isVerified() === undefined) {
      return this.getIconFilePathFromName(`profile-unverified`);
    }
    return this.getIconFilePathFromName(`profile${session.isVerified() ? "" : "-disconnected"}`);
  }

  resource<T extends IResource>(resource: IContainedResource<T>) {
    return this.getIconFilePathFromName(resource.meta.getIconName(resource.resource));
  }

  folder(open: boolean = false) {
    return this.getIconFilePathFromName(`folder-${open ? "open" : "closed"}`);
  }
}

const IconBuilder = SIconBuilder.Instance;
export default IconBuilder;

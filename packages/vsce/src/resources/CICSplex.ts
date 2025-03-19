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

import { CicsCmciConstants } from "@zowe/cics-for-zowe-sdk";
import { ICICSplex, IRegion } from "../doc";
import { Region } from "./Region";
import { toArray } from "../utils/commandUtils";
import { CICSSession } from ".";
import CICSRequester from "../utils/CICSRequester";

export class CICSplex {
  regions: Region[];
  attributes: ICICSplex;

  constructor(plexResource: ICICSplex) {
    this.attributes = plexResource;
  }

  async getRegions(cicsSession: CICSSession) {

    const { response } = await CICSRequester.get(cicsSession, {
      resourceName: CicsCmciConstants.CICS_CMCI_MANAGED_REGION,
      cicsplexName: this.getName()
    });

    this.regions = toArray(
      response.records.cicsmanagedregion
    ).map((record: IRegion) => new Region(
      record, { belongsToPlex: true, plexName: this.getName() }
    ));

    return this.regions;
  }

  getName() {
    return this.attributes.plexname;
  }
}

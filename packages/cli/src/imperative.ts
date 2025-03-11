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

// Imperative version of Zowe CLI
import { IImperativeConfig } from "@zowe/imperative";
import { PluginConstants } from "./PluginConstants";
import { getCICSProfileDefinition } from "@zowe/cics-for-zowe-sdk";

const config: IImperativeConfig = {
  commandModuleGlobs: ["*/*.definition!(.d).*s"],
  rootCommandDescription: PluginConstants.PLUGIN_DESCRIPTION,
  productDisplayName: PluginConstants.PLUGIN_NAME,
  name: PluginConstants.PLUGIN_GROUP_NAME,
  // apimlConnLookup: [
  //     {
  //         apiId: "place_the_cics_apiId_here",
  //         gatewayUrl: "api/v1",
  //         connProfType: "cics"
  //     }
  // ],
  profiles: [
    getCICSProfileDefinition(),
  ],
};

export = config;

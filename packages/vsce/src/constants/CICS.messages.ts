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

import { IMessageDefinition } from "@zowe/imperative";

export const CICSMessages: { [key: string]: IMessageDefinition; } = {
  zoweExplorerNotFound: {
    message: "Zowe Explorer was not found: Please ensure Zowe Explorer v2.0.0 or higher is installed",
  },

  zoweExplorerModified: {
    message: "Zowe Explorer was modified for the CICS Extension.",
  },

  notInitializedCorrectly: {
    message: "IBM CICS for Zowe Explorer was not initialized correctly.",
  },

  incorrectZoweExplorerVersion: {
    message: `Zowe Explorer was not found: either it is not installed or you are using an older version without extensibility API. ` +
      `Please ensure Zowe Explorer v2.0.0-next.202202221200 or higher is installed`,
  },

  loadingResources: {
    message: "Loading resources...",
  },

  CICSResourceTypeNotFound: {
    message: "CICS resource type %resource-type% not found or unsupported.",
  },

  CICSResourceNotFound: {
    message: "%resource-type% %resource-name% not found in region %region-name%.",
  },

  CICSEnterResourceName: {
    message: "Enter the name of a CICS %resource-human-readable% resource.",
  },

  CICSInvalidResourceNameLength: {
    message: "Invalid CICS Resource name. Maximum length is %length% characters.",
  },

  CICSSelectResourceType: {
    message: "Select CICS Resource Type...",
  },

  CICSLoadingResourceName: {
    message: "Loading CICS resource '%name%'...",
  },
};

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
import { l10n } from "vscode";

export const CICSMessages: { [key: string]: IMessageDefinition } = {
  zoweExplorerNotFound: {
    message: l10n.t("Zowe Explorer was not found: Please ensure Zowe Explorer v2.0.0 or higher is installed"),
  },

  zoweExplorerModified: {
    message: l10n.t("Zowe Explorer was modified for the CICS Extension."),
  },

  notInitializedCorrectly: {
    message: l10n.t("Zowe Explorer for IBM CICS Transaction Server was not initialized correctly."),
  },

  incorrectZoweExplorerVersion: {
    message:
      l10n.t(`Zowe Explorer was not found: either it is not installed or you are using an older version without extensibility API. `) +
      l10n.t(`Please ensure Zowe Explorer v2.0.0-next.202202221200 or higher is installed`),
  },

  loadingResources: {
    message: l10n.t("Loading resources..."),
  },

  CICSResourceTypeNotFound: {
    message: l10n.t("CICS resource type %resource-type% not found or unsupported."),
  },

  CICSResourceNotFound: {
    message: l10n.t("%resource-type% %resource-name% not found in region %region-name%."),
  },

  CICSRegionNotFound: {
    message: l10n.t("CICS Region %region-name% not found."),
  },

  CICSEnterResourceName: {
    message: l10n.t("Enter the name of a CICS %resource-human-readable% resource."),
  },

  CICSInvalidResourceNameLength: {
    message: l10n.t("Invalid CICS Resource name. Maximum length is %length% characters."),
  },

  CICSSelectResourceType: {
    message: l10n.t("Select CICS Resource Type..."),
  },

  CICSLoadingResourceName: {
    message: l10n.t("Loading CICS resource '%name%'..."),
  },
};

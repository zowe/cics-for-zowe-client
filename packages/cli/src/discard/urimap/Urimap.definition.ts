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

import { ICommandDefinition } from "@zowe/imperative";

import i18nTypings from "../../-strings-/en";

// Does not use the import in anticipation of some internationalization work to be done later.
const strings = (require("../../-strings-/en").default as typeof i18nTypings).DISCARD.RESOURCES.URIMAP;

export const UrimapDefinition: ICommandDefinition = {
  name: "urimap",
  aliases: [],
  description: strings.DESCRIPTION,
  handler: __dirname + "/Urimap.handler",
  type: "command",
  positionals: [
    {
      name: "urimapName",
      description: strings.POSITIONALS.URIMAPNAME,
      type: "string",
      required: true,
    },
  ],
  options: [
    {
      name: "region-name",
      description: strings.OPTIONS.REGIONNAME,
      type: "string",
    },
  ],
  profile: { optional: ["cics"] },
  examples: [
    {
      description: strings.EXAMPLES.EX1,
      options: "URIMAPA --region-name MYREGION",
    },
  ],
};

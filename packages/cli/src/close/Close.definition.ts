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

import type { ICommandDefinition } from "@zowe/imperative";
import { LocalFileDefinition } from "./localFile/LocalFile.definition";

import type i18nTypings from "../-strings-/en";

const strings = (require("../-strings-/en").default as typeof i18nTypings).CLOSE;

export const CloseDefinition: ICommandDefinition = {
  name: "close",
  aliases: ["cls"],
  summary: strings.SUMMARY,
  description: strings.DESCRIPTION,
  type: "group",
  children: [LocalFileDefinition],
};

// Made with Bob

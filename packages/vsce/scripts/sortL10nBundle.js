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

/**
 * Deterministically sorts l10n/bundle.l10n.json by key.
 *
 * Usage:
 *   node ./scripts/sortL10nBundle.js            # sort in-place
 *   node ./scripts/sortL10nBundle.js --strip     # sort and strip comment objects
 *                                                 (IBM Globalization Pipeline CLI requires
 *                                                  plain string values only)
 */

"use strict";

const fs = require("fs");
const path = require("path");

const BUNDLE_PATH = path.resolve(__dirname, "..", "l10n", "bundle.l10n.json");
const strip = process.argv.includes("--strip");

try {
  const raw = fs.readFileSync(BUNDLE_PATH, "utf8");
  const bundle = JSON.parse(raw);

  // Sort keys deterministically using ordinal comparison (avoids platform-specific localeCompare diffs)
  const sorted = Object.fromEntries(
    Object.keys(bundle)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .map((key) => {
        const value = bundle[key];
        // --strip: replace comment objects { message, comment } with their plain message string
        if (strip && typeof value === "object" && value !== null && typeof value.message === "string") {
          return [key, value.message];
        }
        return [key, value];
      })
  );

  fs.writeFileSync(BUNDLE_PATH, JSON.stringify(sorted, null, 2) + "\n", "utf8");
  console.log(`Sorted ${Object.keys(sorted).length} entries in bundle.l10n.json${strip ? " (comments stripped)" : ""}`);
} catch (err) {
  if (err.code === "ENOENT") {
    console.error(`bundle.l10n.json not found at ${BUNDLE_PATH}`);
    process.exit(1);
  }
  throw err;
}
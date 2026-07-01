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

import * as fs from "fs";
import * as path from "path";

/**
 * Regression guard: none of the extension's source files should mutate the process-wide
 * https.globalAgent (e.g. `https.globalAgent.options.rejectUnauthorized = ...`). TLS
 * verification is already carried per-session via imperative.Session.ISession.rejectUnauthorized
 * (see ProfileManagement.getSessionFromProfile) and honoured per-request by @zowe/imperative's
 * RestClient. Mutating globalAgent's options changes shared, process-wide state for the
 * lifetime of an await, which can flip TLS verification off for unrelated concurrent HTTPS
 * requests made by other profiles or extensions in the same VS Code extension host.
 */
describe("https.globalAgent mutation", () => {
  const srcDir = path.join(__dirname, "..", "..", "..", "src");

  function collectTsFiles(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectTsFiles(entryPath);
      }
      return entry.name.endsWith(".ts") ? [entryPath] : [];
    });
  }

  // Matches an assignment into globalAgent's options (e.g. `https.globalAgent.options.rejectUnauthorized = ...`)
  // or a reassignment of globalAgent itself, while allowing safe reads (e.g. `globalAgent.maxSockets`).
  const mutationPattern = /\bglobalAgent(\.options)?(\.\w+)?\s*=(?!=)/;

  it("should not mutate https.globalAgent or its options", () => {
    const offendingFiles = collectTsFiles(srcDir)
      .filter((filePath) => mutationPattern.test(fs.readFileSync(filePath, "utf8")))
      .map((filePath) => path.relative(srcDir, filePath));

    expect(offendingFiles).toEqual([]);
  });
});

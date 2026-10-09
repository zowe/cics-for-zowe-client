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
 * Downloads and unpacks translated l10n bundles from Zowe Artifactory.
 *
 * Artifacts are stored at:
 *   https://zowe.jfrog.io/artifactory/libs-snapshot-local/
 *       org/zowe/vscode/zowe-explorer-cics-g11n/<version>/<artifact>.zip
 *
 * Each zip contains one or more `bundle.l10n.<locale>.json` files that are
 * extracted directly into packages/vsce/l10n/.
 *
 * Environment variables:
 *   ARTIFACTORY_TOKEN   – Bearer token for authenticated downloads (optional
 *                          for public snapshots; required for private repos).
 *   CICS_G11N_VERSION   – Artifact version to fetch (defaults to the version
 *                          in packages/vsce/package.json).
 *
 * Usage:
 *   node ./scripts/downloadLocalizations.js
 */

"use strict";

const https = require("https");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PKG_PATH = path.resolve(__dirname, "..", "package.json");
const L10N_DIR = path.resolve(__dirname, "..", "l10n");

const pkg = JSON.parse(fs.readFileSync(PKG_PATH, "utf8"));
const version = process.env.CICS_G11N_VERSION || pkg.version;

const ARTIFACTORY_BASE = "https://zowe.jfrog.io/artifactory";
const ARTIFACT_PATH = `libs-snapshot-local/org/zowe/vscode/zowe-explorer-cics-g11n/${version}/zowe-explorer-cics-g11n-${version}.zip`;
const DOWNLOAD_URL = `${ARTIFACTORY_BASE}/${ARTIFACT_PATH}`;

const ARTIFACTORY_TOKEN = process.env.ARTIFACTORY_TOKEN || "";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Performs an HTTPS GET, following up to `maxRedirects` redirects.
 * Resolves with a Buffer containing the full response body, or rejects on
 * non-2xx status.
 */
function httpsGet(url, headers = {}, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const options = new URL(url);
    const reqHeaders = { "User-Agent": "cics-for-zowe-client/l10n-downloader", ...headers };

    const req = https.get({ hostname: options.hostname, path: options.pathname + options.search, headers: reqHeaders }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        if (maxRedirects === 0) return reject(new Error("Too many redirects"));
        return resolve(httpsGet(res.headers.location, headers, maxRedirects - 1));
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });

    req.on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

(async () => {
  console.log(`Downloading localizations for version ${version}...`);
  console.log(`  URL: ${DOWNLOAD_URL}`);

  const reqHeaders = {};
  if (ARTIFACTORY_TOKEN) {
    reqHeaders["Authorization"] = `Bearer ${ARTIFACTORY_TOKEN}`;
  }

  let zipBuffer;
  try {
    zipBuffer = await httpsGet(DOWNLOAD_URL, reqHeaders);
  } catch (err) {
    console.error(`Failed to download localizations: ${err.message}`);
    console.error("Set CICS_G11N_VERSION or ARTIFACTORY_TOKEN if needed.");
    process.exit(1);
  }

  // Ensure output directory exists
  fs.mkdirSync(L10N_DIR, { recursive: true });

  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  let extracted = 0;
  for (const entry of entries) {
    const name = entry.entryName;
    // Only extract bundle.l10n.<locale>.json files
    if (!/bundle\.l10n\.[a-z]{2,}(-[A-Z]{2,})?(\.json)$/.test(name)) {
      continue;
    }
    const outFile = path.join(L10N_DIR, path.basename(name));
    fs.writeFileSync(outFile, entry.getData());
    console.log(`  Extracted: ${path.basename(name)}`);
    extracted++;
  }

  if (extracted === 0) {
    console.warn("No bundle.l10n.<locale>.json files found in the archive.");
  } else {
    console.log(`Done. ${extracted} locale file(s) written to ${L10N_DIR}`);
  }
})();

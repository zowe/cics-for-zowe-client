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

const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const packages = ["packages/vsce", "packages/cli", "packages/sdk"];

function collectProdDependencies(pkgDir) {
  const output = childProcess.execSync("pnpm list --json --prod --depth Infinity", {
    cwd: pkgDir,
    maxBuffer: 100 * 1024 * 1024,
  }).toString();

  const data = JSON.parse(output)[0];
  const pkgMap = new Map();

  function walk(deps) {
    for (const [name, info] of Object.entries(deps || {})) {
      // Exclude workspace packages
      if (name.startsWith("@zowe/cics-for-zowe") || name === "cics-extension-for-zowe") {
        if (info.dependencies) walk(info.dependencies);
        continue;
      }
      if (info && info.version) {
        pkgMap.set(name, info.version);
      }
      if (info.dependencies) {
        walk(info.dependencies);
      }
    }
  }

  walk(data.dependencies);

  return Array.from(pkgMap.entries())
    .map(([name, version]) => ({ name, version }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function updateNotices() {
  for (const pkgRelPath of packages) {
    const pkgDir = path.join(rootDir, pkgRelPath);
    console.log(`Collecting dependencies for ${pkgRelPath}...`);
    const prodDeps = collectProdDependencies(pkgDir);
    const includedJsonPath = path.join(pkgDir, ".noticeme-included.json");

    try {
      fs.writeFileSync(includedJsonPath, JSON.stringify({ packages: prodDeps }, null, 2));
      console.log(`Generating NOTICE for ${pkgRelPath} (${prodDeps.length} packages)...`);
      childProcess.execSync(
        `pnpm --package=@houdiniproject/noticeme dlx noticeme -u --included=.noticeme-included.json`,
        { cwd: pkgDir, stdio: "inherit" }
      );
    } finally {
      if (fs.existsSync(includedJsonPath)) {
        fs.unlinkSync(includedJsonPath);
      }
    }
  }

  console.log("Adding NOTICE headers...");
  require("./updateNoticeHeaders");
}

updateNotices().catch((err) => {
  console.error(err);
  process.exit(1);
});

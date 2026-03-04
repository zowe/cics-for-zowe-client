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

const fs = require("fs");
const cp = require("child_process");
const chalk = require("chalk");

const rootDir = __dirname + "/../";
const cliDir = rootDir + "packages/cli/";
const rootPackageLockFile = rootDir + "package-lock.json";
const rootShrinkwrapFile = rootDir + "npm-shrinkwrap.json";
const cliShrinkwrapFile = cliDir + "npm-shrinkwrap.json";

if (!fs.existsSync(rootShrinkwrapFile)) {
  if (fs.existsSync(rootPackageLockFile)) {
    fs.writeFileSync(rootShrinkwrapFile, JSON.stringify(JSON.parse(fs.readFileSync(rootPackageLockFile, "utf-8")), null, 2));
  } else {
    throw "No package-lock.json or npm-shinkwrap.json found.";
  }
}

// Remove "file:" links from shrinkwrap
const shrinkwrap = JSON.parse(fs.readFileSync(rootShrinkwrapFile, "utf-8"));
for (const [k, v] of Object.entries(shrinkwrap.packages)) {
  if (v.link) {
    delete shrinkwrap.packages[k];
  }
}
fs.writeFileSync(cliShrinkwrapFile, JSON.stringify(shrinkwrap, null, 2));

// Build deduped shrinkwrap for @zowe/cics-for-zowe-cli
const zoweRegistry = require(cliDir + "package.json").publishConfig.registry;

// Create temporary .npmrc with custom registry for @zowe scope
const npmrcPath = cliDir + ".npmrc";
const npmrcContent = `@zowe:registry=${zoweRegistry}`;
const hadNpmrc = fs.existsSync(npmrcPath);
const originalNpmrc = hadNpmrc ? fs.readFileSync(npmrcPath, "utf-8") : null;

try {
  // Write temporary .npmrc
  fs.writeFileSync(npmrcPath, npmrcContent);
  
  // Run npm install with package-lock-only to resolve dependencies
  cp.execSync("npm install --package-lock-only", { cwd: cliDir, stdio: "inherit" });
  
  // Convert package-lock.json to npm-shrinkwrap.json if it exists
  const packageLockPath = cliDir + "package-lock.json";
  if (fs.existsSync(packageLockPath)) {
    const lockfile = JSON.parse(fs.readFileSync(packageLockPath, "utf-8"));
    fs.writeFileSync(cliShrinkwrapFile, JSON.stringify(lockfile, null, 2));
    // Clean up package-lock.json as we're using shrinkwrap
    fs.unlinkSync(packageLockPath);
  }
  
  console.log(chalk.green("Lockfile contents written!"));
  monorepoShrinkwrap();
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  // Restore or remove .npmrc
  if (hadNpmrc) {
    fs.writeFileSync(npmrcPath, originalNpmrc);
  } else if (fs.existsSync(npmrcPath)) {
    fs.unlinkSync(npmrcPath);
  }
}

function monorepoShrinkwrap() {
  const pkgA = rootDir + "package.json";
  const pkgB = rootDir + "package.json_";
  try {
    // Mimic non-workspaces monorepo
    fs.renameSync(pkgA, pkgB);

    cp.execSync("npm shrinkwrap", { cwd: cliDir });

    const shrinkwrap = JSON.parse(fs.readFileSync(cliShrinkwrapFile, "utf-8"));
    shrinkwrap.lockfileVersion = 2;
    for (const [k, v] of Object.entries(shrinkwrap.packages)) {
      if (v.link || v.extraneous || k === "../sdk") {
        delete shrinkwrap.packages[k];
      }
    }
    for (const [k, v] of Object.entries(shrinkwrap?.dependencies ?? [])) {
      if (v.link || v.extraneous || k === "../sdk") {
        delete shrinkwrap.dependencies[k];
      }
    }
    fs.writeFileSync(cliShrinkwrapFile, JSON.stringify(shrinkwrap, null, 2));
    console.log(chalk.green("Shrinkwrap contents written!"));

    // cp.execSync(`sed -i 's#file:../sdk#${require(cliDir + "package.json").version}#g' npm-shrinkwrap.json`, {cwd: cliDir});
    // cp.execSync("npm i ../sdk --install-links --package-lock-only", {cwd: cliDir});
  } finally {
    // revert back to workspaces monorepo
    fs.renameSync(pkgB, pkgA);
  }
}
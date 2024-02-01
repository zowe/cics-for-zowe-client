/*
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
const getLockfile = require("npm-lockfile/getLockfile");

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
const zoweRegistry = require("../lerna.json").command.publish.registry;
getLockfile(cliShrinkwrapFile, undefined, { "@zowe:registry": zoweRegistry })
.then((lockfile) => fs.writeFileSync(cliShrinkwrapFile, lockfile))
.then(() => console.log(chalk.green("Lockfile contents written!")))
.catch((err) => {
  if (err.statusCode !== 404) {
    console.error(err);
    process.exit(1);
  } else {
    console.log(chalk.green("Lockfile contents written!"));
  }
});

const pkgA = rootDir + "package.json";
const pkgB = rootDir + "package.json_";
try {
  // Mimic non-workspaces monorepo
  fs.renameSync(pkgA, pkgB);

  cp.execSync("npm shrinkwrap", {cwd: cliDir});

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

  // cp.execSync(`sed -i 's#file:../sdk#${require("../lerna.json").version}#g' npm-shrinkwrap.json`, {cwd: cliDir});
  // cp.execSync("npm i ../sdk --install-links --package-lock-only", {cwd: cliDir});
} finally {
  // revert back to workspaces monorepo
  fs.renameSync(pkgB, pkgA);
}
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
 * Updates Zowe dependencies to the latest version of the dist-tag configured for the current branch in
 * `.github/release.config.js` (`devDependencies`). This is a pnpm replacement for the octorelease `npmUpdate` script.
 *
 * Usage: node scripts/updateZoweDeps.js [--commit]
 *
 * Environment variables:
 *   GITHUB_BASE_REF / GITHUB_REF_NAME  Used to find the branch config (base branch of a PR, otherwise current branch)
 *   NPM_RESOLUTIONS                    JSON map of package name to version, so every job uses the same versions
 *   GITHUB_OUTPUT                      If set and NPM_RESOLUTIONS is not, resolved versions are written to `result`
 *   GIT_COMMITTER_NAME / _EMAIL        Identity used for the commit when `--commit` is passed
 */

const childProcess = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const DEP_FIELDS = ["dependencies", "devDependencies"];

function run(cmd, args, options = {}) {
  const output = childProcess.execFileSync(cmd, args, {
    cwd: rootDir,
    encoding: "utf-8",
    maxBuffer: 100 * 1024 * 1024,
    // pnpm and npm are .cmd shims on Windows
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "inherit"],
    ...options,
  });
  // Output is null when stdio is inherited
  return output?.trim() ?? "";
}

const pnpm = (args, options) => run("pnpm", args, options);

function git(args) {
  return childProcess.execFileSync("git", args, { cwd: rootDir, encoding: "utf-8", stdio: ["ignore", "pipe", "inherit"] }).trim();
}

/** Tag config is either "tag" or ["tag", "@scope:registry=url"] */
function parseTagConfig(config) {
  const [tag, ...registries] = Array.isArray(config) ? config : [config];
  const env = {};
  for (const registry of registries) {
    const [key, value] = registry.split("=");
    env[`NPM_CONFIG_${key.toUpperCase()}`] = value;
  }
  return { tag, env };
}

function getWorkspacePackageJsonPaths() {
  const projects = JSON.parse(pnpm(["list", "-r", "--depth", "-1", "--json"]));
  return projects.map((project) => path.join(project.path, "package.json"));
}

function updateSpecifier(oldSpec, version) {
  const prefix = /^[\^~]/.exec(oldSpec)?.[0] ?? "";
  return `${prefix}${version}`;
}

function main() {
  const commit = process.argv.includes("--commit");
  const branchName = process.env.GITHUB_BASE_REF || process.env.GITHUB_REF_NAME;
  const branchConfig = require(path.join(rootDir, ".github", "release.config.js")).branches.find((b) => b.name === branchName);
  const depConfigs = Object.entries(branchConfig?.devDependencies ?? {});
  if (depConfigs.length === 0) {
    console.log(`No dependencies to update for branch "${branchName}", exiting now`);
    return;
  }

  let resolutions = {};
  if (process.env.NPM_RESOLUTIONS) {
    resolutions = JSON.parse(process.env.NPM_RESOLUTIONS);
    if (Object.keys(resolutions).length === 0) {
      console.log("No resolutions found, exiting now");
      return;
    }
  }

  const packageJsonPaths = getWorkspacePackageJsonPaths();
  const updates = [];
  for (const [name, tagConfig] of depConfigs) {
    const { tag, env } = parseTagConfig(tagConfig);
    if (resolutions[name] == null) {
      console.log(`Gathering version information for: ${name}@${tag}`);
      // Use npm here since pnpm view ignores scoped registry overrides from the environment
      resolutions[name] = run("npm", ["view", `${name}@${tag}`, "version"], { env: { ...process.env, ...env } });
    }
    const latestVersion = resolutions[name];

    for (const pkgJsonPath of packageJsonPaths) {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
      let changed = false;
      for (const field of DEP_FIELDS) {
        const oldSpec = pkgJson[field]?.[name];
        if (oldSpec == null) continue;
        const newSpec = updateSpecifier(oldSpec, latestVersion);
        if (newSpec !== oldSpec) {
          pkgJson[field][name] = newSpec;
          updates.push(`${name}: ${oldSpec} -> ${newSpec} (${path.relative(rootDir, pkgJsonPath) || "package.json"})`);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n");
      }
    }
  }

  if (!process.env.NPM_RESOLUTIONS && process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `result=${JSON.stringify(resolutions)}\n`);
  }

  if (updates.length === 0) {
    console.log("All dependencies are up to date");
    return;
  }

  console.log(`Updating ${updates.length} dependency specifiers:\n  ${updates.join("\n  ")}`);
  pnpm(["install", "--no-frozen-lockfile"], { stdio: "inherit" });
  // Peer dependency ranges in subpackages (e.g. @zowe/imperative ^8.0.0) are not bumped by the install above, which
  // would leave older copies of the package in the lockfile and cause type and runtime mismatches
  pnpm(["dedupe"], { stdio: "inherit" });

  if (commit) {
    git(["config", "user.name", process.env.GIT_COMMITTER_NAME]);
    git(["config", "user.email", process.env.GIT_COMMITTER_EMAIL]);
    git(["add", "-u"]);
    git(["commit", "-s", "-m", "Update dependencies [ci skip]\n\n" + updates.join("\n")]);
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}

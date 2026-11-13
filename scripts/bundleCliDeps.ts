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

/* eslint-disable no-console */
import * as childProcess from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
const npmPacklist = require("npm-packlist");

const cmdName = process.argv[2];
const pkgDir = process.cwd();
const rootDir = path.resolve(__dirname, "..");
const pkgNodeModules = path.join(pkgDir, "node_modules");
const nodeModulesBackup = path.join(pkgDir, "node_modules_old");
const pkgJsonPath = path.join(pkgDir, "package.json");

function die(message: string): never {
    console.error(message);
    process.exit(1);
}

function restoreNodeModules() {
    fs.rmSync(pkgNodeModules, { recursive: true, force: true });
    if (fs.existsSync(nodeModulesBackup)) {
        fs.renameSync(nodeModulesBackup, pkgNodeModules);
    }
}

function updatePkgJson(update: (_: Record<string, any>) => void) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    update(pkgJson);
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n");
}

interface PnpmDepTree {
    version: string;
    from?: string;
    path: string;
    resolved?: string;
    dependencies?: { [pkgName: string]: PnpmDepTree };
    scripts?: { install?: string };
    [key: string]: any;
}
interface BundleDepInfo {
    id: string;
    srcPath: string;
    link: boolean;
    hasInstallScript: boolean;
}
interface QueueItem {
    name: string;
    tree: PnpmDepTree;
    parentArchivePath: string;
}

function walkDepTree(rootDeps: { [pkgName: string]: PnpmDepTree }): Record<string, BundleDepInfo> {
    // Do a breadth-first search of node_modules to hoist dependencies without conflicts
    const bundleDeps: Record<string, BundleDepInfo> = {};
    const visited = new Set<string>();
    let queue: QueueItem[] = Object.entries(rootDeps ?? {}).map(([name, tree]) => ({
        name,
        tree,
        parentArchivePath: "node_modules",
    }));

    while (queue.length > 0) {
        const nextQueue: QueueItem[] = [];
        for (const { name, tree, parentArchivePath } of queue) {
            if (!tree || !tree.path) continue;
            // Skip peer dependency @zowe/imperative
            if (name === "@zowe/imperative") continue;
            if (visited.has(tree.path)) continue;
            visited.add(tree.path);

            const pkgId = `${name}@${tree.version}`;
            const flatPath = path.posix.join("node_modules", name);
            const archivePath = flatPath in bundleDeps && bundleDeps[flatPath].id !== pkgId ?
                path.posix.join(parentArchivePath, "node_modules", name) : flatPath;

            if (archivePath in bundleDeps) {
                if (bundleDeps[archivePath].id !== pkgId) {
                    throw new Error(`Found conflicting versions of the same package: ${bundleDeps[archivePath].id} and ${pkgId}`);
                }
            } else {
                const isWorkspaceLink = !tree.path.includes(".pnpm");
                bundleDeps[archivePath] = {
                    id: pkgId,
                    srcPath: tree.path,
                    link: isWorkspaceLink,
                    hasInstallScript: tree.scripts?.install != null,
                };
            }

            for (const [subName, subtree] of Object.entries(tree.dependencies ?? {})) {
                if (subName != null) nextQueue.push({ name: subName, tree: subtree, parentArchivePath: archivePath });
            }
        }
        queue = nextQueue;
    }

    return bundleDeps;
}

async function prepack(pkgName: string) {
    if (fs.existsSync(nodeModulesBackup)) {
        restoreNodeModules();
    }
    const start = Date.now();
    const output = childProcess.execSync(`pnpm list --json --prod --depth Infinity`, {
        cwd: pkgDir,
        maxBuffer: 1024 * 1024 * 100, // 100MB
    });
    const parsed = JSON.parse(output.toString());
    const rootData = Array.isArray(parsed) ? parsed[0] : parsed;
    const prodDepMap = walkDepTree(rootData.dependencies ?? {});

    try {
        if (fs.existsSync(pkgNodeModules)) fs.renameSync(pkgNodeModules, nodeModulesBackup);
        fs.mkdirSync(pkgNodeModules);

        for (const [destPath, bundleDep] of Object.entries(prodDepMap)) {
            const srcPath = bundleDep.srcPath.replace(pkgNodeModules + path.sep, nodeModulesBackup + path.sep);
            if (bundleDep.link) {
                const packlist = await npmPacklist({
                    path: srcPath,
                    package: bundleDep.id.slice(0, bundleDep.id.lastIndexOf("@")),
                    edgesOut: new Map(),
                });
                for (const relFilePath of packlist) {
                    const absFilePath = path.join(pkgDir, destPath, relFilePath);
                    fs.mkdirSync(path.dirname(absFilePath), { recursive: true });
                    fs.copyFileSync(path.join(bundleDep.srcPath, relFilePath), absFilePath);
                }
            } else {
                const absPkgPath = path.join(pkgDir, destPath);
                const excludeNodeModules = (source: string) => path.basename(source) !== "node_modules" &&
                    (!bundleDep.hasInstallScript || path.basename(source) !== "build");
                fs.cpSync(srcPath, absPkgPath, { recursive: true, filter: excludeNodeModules });
            }
        }

        console.log(`[prepack] staged ${Object.keys(prodDepMap).length} dependencies in ${(Date.now() - start) / 1000}s`);
        updatePkgJson((pkgJson) => {
            const depList = [...Object.keys(pkgJson.dependencies ?? {}), ...Object.keys(pkgJson.optionalDependencies ?? {})];
            pkgJson.bundleDependencies = depList.filter((name) => fs.existsSync(path.join(pkgNodeModules, name))).sort();
        });
    } catch (err) {
        restoreNodeModules();
        throw err;
    }
}

async function postpack() {
    restoreNodeModules();
    updatePkgJson((pkgJson) => delete pkgJson.bundleDependencies);
}

const run = { prepack, postpack }[cmdName];
if (run == null) {
    die(`Usage: cd <package> && node ${path.relative(pkgDir, __filename)} <prepack|postpack>`);
}
const { name: pkgName, private: isPrivate } = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
if (isPrivate) {
    die(`[${cmdName}] "${pkgName}" is private, so cannot bundle dependencies`);
}
run(pkgName).catch(die);

module.exports = {
    branches: [
        {
            // This will be moved down once Zowe V3 is announced
            // Remember to also update aliasTags below
            name: "zowe-v2-lts",
            level: "patch",
            devDependencies: {
                "@zowe/imperative": "zowe-v2-lts",
                "@zowe/zowe-explorer-api": ["zowe-v2-lts", "@zowe:registry=https://registry.npmjs.org/"],
            }
        },
        {
            name: "main",
            channel: "zowe-v3-lts",
            level: "none",
            devDependencies: {
                "@zowe/imperative": "zowe-v3-lts",
                "@zowe/zowe-explorer-api": ["next", "@zowe:registry=https://registry.npmjs.org/"],
            }
        }
    ],
    plugins: [
        [
            "@octorelease/changelog",
            {
                displayNames: {
                    "cli": "IBM CICS Plug-in for Zowe CLI",
                    "sdk": "IBM CICS for Zowe SDK",
                    "vsce": "IBM CICS Extension for Zowe Explorer",
                },
                headerLine: "## Recent Changes",
            },
        ],
        [
            "@octorelease/lerna",
            {
                // The shrinkwrap pruning should happen after only as part of the prepack of the CLI Plug-in
                // pruneShrinkwrap: ["@zowe/cics-for-zowe-cli"],

                // Use Lerna only for versioning and publish packages independently
                npmPublish: false,
                versionIndependent: ["cics-extension-for-zowe"],
            },
        ],
        [
            "@octorelease/npm",
            {
                $cwd: "packages/sdk",
                aliasTags: {
                    "latest": ["zowe-v2-lts"]
                },
                npmPublish: true,
                tarballDir: "dist",
            },
            {
                $cwd: "packages/cli",
                aliasTags: {
                    "latest": ["zowe-v2-lts"]
                },
                npmPublish: true,
                tarballDir: "dist",
            },
        ],
        [
            "@octorelease/vsce",
            {
                $cwd: "packages/vsce",
                ovsxPublish: false,
                vscePublish: false,
                vsixDir: "dist",
            },
        ],
        [
            "@octorelease/github",
            {
                assets: ["dist/*.tgz"],//, "dist/*.vsix"],
                checkPrLabels: true,
                publishRelease: true
            },
        ],
        "@octorelease/git",
    ]
};

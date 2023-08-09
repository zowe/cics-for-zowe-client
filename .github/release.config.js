module.exports = {
    branches: [
        {
            name: "main",
            channel: "latest",
            level: "minor",
            devDependencies: {
                "@zowe/imperative": "zowe-v2-lts",
                "@zowe/zowe-explorer-api": "zowe-v2-lts",
            }
        },
        {
            name: "zowe-v1-lts",
            channel: "zowe-v1-lts",
            level: "patch",
            devDependencies: {
                "@zowe/imperative": "zowe-v1-lts",
                "@zowe/zowe-explorer-api": "zowe-v1-lts",
            }
        },
        {
            name: "next",
            channel: "next",
            level: "major",
            prerelease: true,
            devDependencies: {
                "@zowe/imperative": "next",
                "@zowe/zowe-explorer-api": "next",
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
                    "vsce": "IBM CICS Plug-in for Zowe Explorer",
                },
                headerLine: "## Recent Changes",
            },
        ],
        [
            "@octorelease/lerna",
            {
                // Use Lerna only for versioning and publish packages independently
                npmPublish: false,
            },
        ],
        [
            "@octorelease/npm",
            {
                $cwd: "packages/sdk",
                aliasTags: {
                    "latest": ["zowe-v2-lts"],
                },
                npmPublish: true,
                tarballDir: "dist",
            },
            {
                $cwd: "packages/cli",
                aliasTags: {
                    "latest": ["zowe-v2-lts"],
                },
                npmPublish: true,
                tarballDir: "dist",
            },
        ],
        [
            "@octorelease/vsce",
            {
                $cwd: "packages/vsce",
                ovsxPublish: true,
                vscePublish: true,
                vsixDir: "dist",
            },
        ],
        [
            "@octorelease/github",
            {
                assets: ["dist/*.tgz", "dist/*.vsix"],
                draftRelease: true,
            },
        ],
        "@octorelease/git",
    ]
};

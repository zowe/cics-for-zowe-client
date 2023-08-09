module.exports = {
    branches: [
        {
            name: "main",
            level: "minor",
            devDependencies: {
                "@zowe/imperative": "zowe-v2-lts",
                "@zowe/zowe-explorer-api": "zowe-v2-lts",
            }
        },
        {
            name: "zowe-v1-lts",
            level: "patch",
            devDependencies: {
                "@zowe/imperative": "zowe-v1-lts",
                "@zowe/zowe-explorer-api": "zowe-v1-lts",
            }
        }
    ],
    plugins: [
        "@octorelease/changelog",
        ["@octorelease/npm", {
            aliasTags: {
                latest: ["zowe-v2-lts"]
            },
            pruneShrinkwrap: false
        }],
        ["@octorelease/github", {
            checkPrLabels: true
        }],
        "@octorelease/git"
    ]
};

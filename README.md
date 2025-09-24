# Zowe Explorer for IBM CICS Transaction Server

[![version](https://img.shields.io/visual-studio-marketplace/v/Zowe.cics-extension-for-zowe.svg)](https://img.shields.io/visual-studio-marketplace/v/Zowe.cics-extension-for-zowe.svg)
[![codecov](https://codecov.io/gh/zowe/cics-for-zowe-client/branch/main/graph/badge.svg)](https://codecov.io/gh/zowe/cics-for-zowe-client/branch/main/graph/badge.svg)
[![slack](https://img.shields.io/badge/chat-on%20Slack-blue)](https://slack.openmainframeproject.org/)

This repo contains Zowe&reg; Explorer for IBM&reg; CICS&reg; TS and the Zowe CLI Plug-in for CICS TS, as well as supporting components.

[Zowe Explorer](https://github.com/zowe/zowe-explorer-vscode) is a key upstream dependency for the project.

## Requirements

- Install Node 20

## Directory structure

The repository is organized as a monorepo with multiple packages in the `packages` directory:

### [packages/cli](packages/cli/README.md)

- **Name**: @zowe/cics-for-zowe-cli
- **Description**: Zowe CLI Plug-in for IBM CICS Transaction Server
- **Purpose**: Provides command-line interface for interacting with CICS resources
- **Dependencies**: Uses the SDK package for core functionality

### [packages/sdk](packages/sdk/README.md)

- **Name**: @zowe/cics-for-zowe-sdk
- **Description**: Zowe SDK for IBM CICS Transaction Server
- **Purpose**: Core functionality for programmatic interaction with CICS through CMCI REST API

### [packages/vsce](packages/vsce/README.md)

- **Name**: cics-extension-for-zowe
- **Description**: Zowe Explorer for IBM CICS Transaction Server
- **Purpose**: VS Code extension that adds IBM CICS support to Zowe Explorer
- **Dependencies**: Uses both the SDK package and vsce-api package

### [packages/vsce-api](packages/vsce-api/README.md)

- **Name**: @zowe/cics-for-zowe-explorer-api
- **Description**: Zowe Explorer for IBM CICS Transaction Server API
- **Purpose**: API layer for the VS Code extension
- **Dependencies**: Uses the SDK package for core functionality

## Build Locally

To build the project locally, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/zowe/cics-for-zowe-client.git
   cd cics-for-zowe-client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build all packages:

   ```bash
   npm run build
   ```

4. Run tests (optional):

   ```bash
   npm run test:unit
   ```

5. Run e2e tests (optional):

   ```bash
   npm run test:e2e
   ```

6. Create distributable packages (optional):
   ```bash
   npm run package
   ```

The built packages will be placed in the [`dist` directory](dist):

- **SDK, CLI package, and vsce-api packages**: npm tarballs
- **VSCE package**: .vsix file for VS Code extension installation

## How to Contribute

We encourage you to contribute!

Check the current [open issues](https://github.com/zowe/cics-for-zowe-client/issues) to choose where you can contribute. You can look for the `help wanted`-labeled issues to find issues that require additional input. If you are new to the project, you might want to check the issues with the `good first issue` label.

To report a bug or request a specific feature, please open a GitHub issue using the [appropriate template](https://github.com/zowe/cics-for-zowe-client/issues/new/choose). Feature requests will be added to our backlog after it receives 10 upvotes from the community.

For more information on how to contribute, see [Contributor Guidance](CONTRIBUTING.md).

## Project Structure and Governance

The Zowe Explorer for IBM CICS TS project is an incubator within the Zowe Explorer project.

Zowe Explorer is a component of the Zowe Open Mainframe Project, part of the Linux Foundation.

To learn more about how Zowe is structured and governed, see the [Technical Steering Committee Structure and Governance documentation](https://github.com/zowe/community/blob/master/Technical-Steering-Committee/tsc-governance.md).

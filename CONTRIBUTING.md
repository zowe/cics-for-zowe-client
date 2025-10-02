# Contribution Guidelines

This document is intended to be a living summary of conventions & best practices for development within Zowe&reg; Explorer for IBM&reg; CICS&reg; Transaction Server and Zowe CLI Plug-in for IBM CICS Transaction Server.

## Developing this code base

### Requirements

- Install Node 20

### Project structure

The repository is organized as a monorepo with multiple packages in the `packages` directory:

#### [packages/cli](packages/cli/README.md)

- **Name**: @zowe/cics-for-zowe-cli
- **Description**: Zowe CLI Plug-in for IBM CICS Transaction Server
- **Purpose**: Provides command-line interface for interacting with CICS resources
- **Dependencies**: Uses the SDK package for core functionality

#### [packages/sdk](packages/sdk/README.md)

- **Name**: @zowe/cics-for-zowe-sdk
- **Description**: Zowe SDK for IBM CICS Transaction Server
- **Purpose**: Core functionality for programmatic interaction with CICS through CMCI REST API

#### [packages/vsce](packages/vsce/README.md)

- **Name**: cics-extension-for-zowe
- **Description**: Zowe Explorer for IBM CICS Transaction Server
- **Purpose**: VS Code extension that adds IBM CICS support to Zowe Explorer
- **Dependencies**: Uses both the SDK package and vsce-api package

#### [packages/vsce-api](packages/vsce-api/README.md)

- **Name**: @zowe/cics-for-zowe-explorer-api
- **Description**: Zowe Explorer for IBM CICS Transaction Server API
- **Purpose**: API layer for the VS Code extension
- **Dependencies**: Uses the SDK package for core functionality

### Build Locally

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

4. Run tests:

   ```bash
   npm run test:unit
   ```

5. Run e2e tests (or check results in the CI build if you don't have a suitable Docker environment):

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

### Changelog Update Guidelines

The changelog should be updated for any PR that updates code that will be distributed to the end user. Changes to certain files, such as the Jenkinsfile, do not require an update to the changelog.

The following code block should be inserted into the Changelog above the last released version:

```
## Recent Changes

- <Your changes should>
- <be documented here>
```

### CLI Contribution Guidelines

The following information is critical to working with the code, running/writing/maintaining automated tests, developing consistent syntax in your plug-in, and ensuring that your plug-in integrates with Zowe CLI properly:

| For more information about ...                                                 | See:                                                                                                               |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| General guidelines that apply to contributing to Zowe CLI and Plug-ins         | [Contribution Guidelines](https://github.com/zowe/zowe-cli/blob/master/CONTRIBUTING.md)                            |
| Conventions and best practices for creating packages and plug-ins for Zowe CLI | [Package and Plug-in Guidelines](https://github.com/zowe/zowe-cli/blob/master/docs/PackagesAndPluginGuidelines.md) |
| Guidelines for running tests on Zowe CLI                                       | [Testing Guidelines](https://github.com/zowe/zowe-cli/blob/master/docs/TESTING.md)                                 |
| Guidelines for running tests on the plug-ins that you build for Zowe CLI       | [Plug-in Testing Guidelines](https://github.com/zowe/zowe-cli/blob/master/docs/PluginTESTINGGuidelines.md)         |
| Documentation that describes the features of the Imperative CLI Framework      | [About Imperative CLI Framework](https://github.com/zowe/zowe-cli/wiki)                                            |
| Versioning conventions for Zowe CLI and Plug-ins                               | [Versioning Guidelines](https://github.com/zowe/zowe-cli/blob/master/docs/MaintainerVersioning.md)                 |

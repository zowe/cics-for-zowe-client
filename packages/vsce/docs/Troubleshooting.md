# Zowe Explorer for IBM CICS Transaction Server extension Troubleshooting

Check that the [source of the error](https://github.com/zowe/vscode-extension-for-cics#checking-the-source-of-an-error) is from the Zowe&reg; Explorer for IBM&reg; CICS&reg; Transaction Server extension before refering to the troubleshooting documentation.

## Contents

- ['Socket is closed' error](#socket-is-closed-error)
- ['Failed to load schema for profile type cics' error](#failed-to-load-schema-for-profile-type-cics-error)

## `Socket is closed` error

If a socket closed error occurs when trying to connect to a profile with an IP address for the hostname, try switching to the DNS name for the CICS CMCI connection instead.

## `Failed to load schema for profile type cics` error

This Zowe V2 error appears when a CICS profile entry is missing from the `zowe.schema.json` file.

There are 2 ways of adding the cics entry to the schema file and getting around this error message:

1. ### Update schema from within VS Code

   Run the command `Zowe Explorer: Update Profile Configuration Schema` from the VS Code command palette. If the CICS extension is installed, the schema will be updated with the CICS entry.

2. ### Update schema from the CLI

   From a terminal, run the command `zowe config update-schemas`. If the Zowe CLI Plug-in for CICS TS is installed, the schema will be updated with the CICS entry.

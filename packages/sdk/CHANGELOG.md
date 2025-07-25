# Changelog

All notable changes to the IBM® CICS® Plug-in for Zowe CLI will be documented in this file.

## `6.9.4`

- Added JVM Server REST interface URI.
- Added CICSSession class

## `6.9.0`

- Add missing CICS resource constants. [#249](https://github.com/zowe/cics-for-zowe-client/pull/249)
- Enhancement: Add a version number to the profile schema [#291](https://github.com/zowe/cics-for-zowe-client/issues/291)
- Add ability to define bundles [#72](https://github.com/zowe/cics-for-zowe-client/issues/72)

## `6.8.0`

- Enhancement: Added extender API interface and resource constants for pipeline and webservice resource. [#299](https://github.com/zowe/cics-for-zowe-client/pull/299)

## `6.6.1`

- Add notices file into package [#267](https://github.com/zowe/cics-for-zowe-client/issues/267)

## `6.4.0`

- Enhancement: Added CICS resource names to available constants. [#217](https://github.com/zowe/cics-for-zowe-client/issues/217)

## `6.3.3`

- Enhancement: Add requestOptions to getResource and getCache method. [#220](https://github.com/zowe/cics-for-zowe-client/issues/220)

## `6.2.4`

- BugFix: URI encoding the region and cicsplex names. [#178](https://github.com/zowe/cics-for-zowe-client/issues/178)

## `6.2.1`

- BugFix: Change getResource criteria bracketing behaviour. [#180](https://github.com/zowe/cics-for-zowe-client/issues/180)

## `6.2.0`

- Enhancement: Add optional query parameters on getResource SDK method. [#168](https://github.com/zowe/cics-for-zowe-client/issues/168)
- Enhancement: Add getCache method to SDK. [#169](https://github.com/zowe/cics-for-zowe-client/issues/169)

## `6.1.0`

- Enhancement: Made the region name optional on the getResource SDK method. [#162](https://github.com/zowe/cics-for-zowe-client/issues/162)

## `6.0.0`

- MAJOR: v6.0.0 release

## `6.0.0-next.202409201904`

- Update: Final prerelease

## `6.0.0-next.202409111220`

- BugFix: Updated dependencies for technical currency. [#142](https://github.com/zowe/cics-for-zowe-client/pull/142)

## `6.0.0-next.202403042201`

- V3 Breaking: Increased Node Engine to 18.12.0

## `6.0.0-next.202402261537`

- BugFix: Updated deprecated methods for technical currency purposes

## `6.0.0-next.202402072252`

- Major: Release v3.0.0-next pre-release

## `5.0.3`

- BugFix: Updated dependencies for technical currency
- BugFix: Migrated the package the CICS for Zowe Client Monorepo

## `5.0.1`

- BugFix: Updated `xml2js` dependency to resolve security vulnerability.

## `5.0.0`

- Major: Updated for V2 compatibility. See the prerelease items below for more details.

## `5.0.0-next.202204141925`

- BugFix: Remove APIML Conn Lookup until the CICS definition for APIML is known.

## `5.0.0-next.202204111400`

- BugFix: Fixed daemon mode prompting

## `5.0.0-next.202202071745`

- BugFix: Pruned dev dependencies from npm-shrinkwrap file.

## `5.0.0-next.202201261655`

- BugFix: Updated dependencies to resolve security vulnerabilities.

## `5.0.0-next.202201241457`

- BugFix: Included an npm-shrinkwrap file to lock-down all transitive dependencies.

## `5.0.0-next.202107021819`

- Enhancement: Add apimlConnLookup properties to enable auto-config through APIML. A valid apiId must still be identified.

## `5.0.0-next.202104261510`

- Remove @zowe/cli peer dependency to better support NPM v7

## `5.0.0-next.202104141723`

- Publish `@next` tag that is compatible with team config profiles.

## `4.0.7`

- BugFix: Updated `moment` dependency.

## `4.0.6`

- BugFix: Pruned dev dependencies from npm-shrinkwrap file.

## `4.0.5`

- BugFix: Included an npm-shrinkwrap file to lock-down all transitive dependencies.

## `4.0.3`

- BugFix: Update Readme links

## `4.0.2`

- Tag version 4.X.X as @zowe-v1-lts

## `4.0.1`

- Update Imperative dev dependency to fix deployment and remove vulnerability

## `4.0.0`

- Default CMCI protocol to HTTPS
- Default URIMaps created to HTTPS
- Add options to specify TCPIPSERVICE to Server and Pipeline URIMaps
- Add options to specify Certificates and Authentication to Client URIMaps
- Add system test property to specify Certificate to use

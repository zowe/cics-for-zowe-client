# IBM CICS for Zowe Explorer

[![version](https://img.shields.io/visual-studio-marketplace/v/zowe.cics-extension-for-zowe.svg)](https://img.shields.io/visual-studio-marketplace/v/zowe.cics-extension-for-zowe.svg)
[![downloads](https://img.shields.io/visual-studio-marketplace/v/zowe.cics-extension-for-zowe.svg)](https://img.shields.io/visual-studio-marketplace/v/zowe.cics-extension-for-zowe.svg)
[![slack](https://img.shields.io/badge/chat-on%20Slack-blue)](https://openmainframeproject.slack.com/archives/CUVE37Z5F)
[![open issues](https://img.shields.io/github/issues/zowe/vscode-extension-for-cics)](https://github.com/zowe/vscode-extension-for-cics/issues)

This CICS Extension for Zowe Explorer adds additional functionality to the popular VS Code extension, [Zowe Explorer](https://github.com/zowe/vscode-extension-for-zowe). This extension allows interactions with CICS regions and resources, and the ability to run commands against them.

## Contents

- [IBM CICS for Zowe Explorer](#ibm-cics-for-zowe-explorer)
  - [Contents](#contents)
  - [Software requirements](#software-requirements)
  - [Features](#features)
  - [Getting started](#getting-started)
    - [Connecting using a CICS profile](#connecting-using-a-cics-profile)
      - [Creating or updating a CICS profile](#creating-or-updating-a-cics-profile)
      - [Additional details for making the connection](#additional-details-for-making-the-connection)
    - [Hiding CICS profiles](#hiding-cics-profiles)
    - [Deleting CICS profiles](#deleting-cics-profiles)
  - [CICS resources](#cics-resources)
    - [Show logs for a region](#show-logs-for-a-region)
    - [Show and filter resources in a region](#show-and-filter-resources-in-a-region)
    - [Show and filter resources in a plex](#show-and-filter-resources-in-a-plex)
    - [Show and filter resources in an 'All' resource tree](#show-and-filter-resources-in-an-all-resource-tree)
    - [Show attributes](#show-attributes)
    - [Enable and disable](#enable-and-disable)
    - [New Copy and Phase In](#new-copy-and-phase-in)
    - [Open and Close Local Files](#open-and-close-local-files)
    - [Purge Task](#purge-task)
    - [Inquire functionality](#inquire-functionality)
    - [View data sets under libraries](#view-data-sets-under-libraries)
    - [View four CICS web resources under the web folder](#view-four-cics-web-resources-under-the-web-folder)
  - [Untrusted TLS certificates](#untrusted-tls-certificates)
  - [Usage tips](#usage-tips)
  - [Providing feedback or help contributing](#providing-feedback-or-help-contributing)
    - [Checking the source of an error](#checking-the-source-of-an-error)
    - [Filing an issue](#filing-an-issue)

## Software requirements

Ensure that you meet the following prerequisites before you use the extension:

- Install VS Code
- Install Zowe Explorer v3

**Tip**: See [Troubleshooting guide](/packages/vsce/docs/Troubleshooting.md) for solutions to common problems.

## Features

- Load profiles directly from a locally installed Zowe instance.
- Create new CICS profiles and connect to them.
- Work with a tree structure of resources including programs, local transactions, and local files within CICSplexes and CICS regions.
- Perform actions such as `Enable`, `Disable`, `New Copy`, and `Phase In` directly from the UI.
- Perform additional actions on local files including `Open` and `Close` directly from the UI.
- Perform a `Purge` on tasks with the option to select from a `Purge` or `Force Purge`.
- View and search attributes of resources and regions by right-clicking and using the dynamic filtering feature.
- Apply multiple filters to regions, programs, local transactions local files, and/or tasks.

To install CICS Extension for Zowe Explorer see [Installation](/packages/vsce/docs/installation-guide.md).

## Getting started

### Connecting using a CICS profile

CICS profiles are stored with other Zowe profiles in team configuration JSON files. These are used for both Zowe CLI and VS Code extension connections and [documented as part of Zowe CLI](https://docs.zowe.org/stable/user-guide/cli-using-using-team-profiles).

CICS profiles inherit properties from base profiles in the same way as Zowe profiles. Secure storage for credentials also uses the Zowe profile mechanism with `secure` arrays and `autoStore`.

The profile defines a connection which must point to a CICS region's CICS Management Client Interface (CMCI) TCP/IP host name and port number. CMCI could be hosted by a WUI in a CICSplex or by a stand-alone System Management Single Server (SMSS) region.

#### Creating or updating a CICS profile

1. In Zowe Explorer, select the **+** button in the **CICS** tree.

2. Pick an existing CICS profile to add to your tree or select **Create a New Team Configuration File** or **Edit Team Configuration File** to create a new CICS profile.

3. Within the profile section in a team configuration file (`zowe.config.json`), add a new `cics` profile type.

4. Select the **+** button in the **CICS** tree and click the newly created profile to load it into view.

The following example shows a CICS profile stored in a configuration file. The host, port, and protocol in a CICS profile must point to a valid CMCI connection:

```
"profiles": {
   ...
   "cics_example": {
      "type": "cics",
      "properties": {
            "host": "replace-with-host-name",
            "port": replace-with-port-number,
            "rejectUnauthorized": true,
            "protocol": "http",
            "cicsPlex": "optionally-replace-with-plex-name",
            "regionName": "optionally-replace-with-region-name"
      }
   },
   ...
}
```

**Tip**: Create a profile without the `user` and `password` properties and expand the profile after loading it into the CICS view. The CICS extension will then prompt you for the `user` and `password` fields to be stored in the secure array.

To show more than one CICS profile in the tree, select the **+** button and choose from the list of profiles. Only profiles not already included in the CICS tree will be shown.

#### Additional details for making the connection

If you are connecting to a CICSplex, you can optionally specify the `cicsPlex` or `regionName` properties to scope the set of CICSplexes or CICS regions shown in the **CICS** tree. Instead of a region name, you can also enter a CICS System Group.

Configuring a CICS region for CMCI is a system programmer task and more details can be found in [Setting up CMCI with CICSPlex SM](https://www.ibm.com/docs/en/cics-ts/6.x?topic=cmci-setting-up-cicsplex-sm) or
[Setting up CMCI in a stand-alone CICS region](https://www.ibm.com/docs/en/cics-ts/6.x?topic=cmci-setting-up-in-single-cics-region). If your CMCI connection is configured to use a self-signed certificate that your PC's trust store does not recognize, see [Untrusted TLS certificates](#untrusted-tls-certificates).

You can also view your Zowe profiles using Zowe CLI by using the command `zowe profiles list cics` from a terminal.

### Hiding CICS profiles

Right-click a CICS profile and select `Manage Profile` to show profile options. Choose `Hide Profile` to hide it from the CICS view. To add it back, click the `+` button and select the profile from the quick pick list.

### Deleting CICS profiles

1. Right-click a CICS profile and select `Manage Profile` to show profile options.

2. Choose **Delete Profile** to open the configuration file that contains the profile you want to delete.

3. Edit the config file to remove the CICS profile entry.

## CICS resources

Expand a CICS profile to explore any CICSplexes and CICS regions that are available. CICS regions are nested within the CICSplex they are part of. CICS resources are available both within an individual CICS region and across the CICSplex. Regions that are not active - defined to a CICSplex but without a running job - are shown with a no entry sign.

### Show logs for a region

Right-click a CICS region and select the `Open Region Logs` option to reveal the CICS region's logs in the Zowe Explorer Jobs tree.

You must have a connection configured in Zowe Explorer with access to the CICS region's logs.

<p align="center">
<img src="/packages/vsce/docs/images/show-region-logs-clip.gif" alt="Show region logs" width="480px"/>
</p>

**Tip:** A good way to associate CICS and z/OSMF profiles for the same host is to nest them under the same parent profile, using [Zowe CLI nested profiles](https://docs.zowe.org/stable/user-guide/cli-using-creating-profiles/).

### Show and filter resources in a region

Expand a CICS region to show folders for the resource types `Programs`, `Transactions`, `Local Files`, and `Tasks` with the set of resources nested within each. The number of resources in a resource tree appear in square brackets next to the tree name.

The list of resources are pre-filtered to exclude many of the IBM-supplied items; these default filters are configured in the settings for the CICS extension.

Use the **Filter** icon <img src="/packages/vsce/docs/images/resource-filter.png" width="16px"/> against a resource type to apply a filter. This can be an exact resource name or can include wildcards. The filter history is saved so you can recall previous filters.

To reset the filter to its initial criteria, use the **Clear Filter** icon <img src="/packages/vsce/docs/images/resource-filter-clear.png" width="16px"/> against the resource type. If you want to see all resources in a region (including IBM supplied ones) you can use `\*` as a filter.

<p align="center">
<img src="/packages/vsce/docs/images/region-filter.gif" alt="Zowe CICS Explorer Filter" width="700px"/>
</p>

**Tip:** To apply multiple filters, separate entries with a comma. You can append any filter with an `\*`, which indicates wildcard filtering.

### Show and filter resources in a plex

In the same way as filtering resources in a region, you can apply a filter on resources in a plex. Use the **Filter** and **Clear Filter** buttons against the Regions tree element to manage filters across the whole set of regions and resources.

<p align="center">
<img src="/packages/vsce/docs/images/plex-filter.gif" alt="Zowe CICS Explorer Filter" width="700px"/>
</p>

### Show and filter resources in an 'All' resource tree

CICSplexes contain an `All Programs`, `All Local Transactions`, `All Local Files`, and `All Tasks` trees which show resources from all regions in the plex.

To view resources under these trees, use the **Filter** icon <img src="/packages/vsce/docs/images/resource-filter.png" width="16px"/> inline with the tree and apply a filter.

<p align="center">
<img src="/packages/vsce/docs/images/all-resources.gif" alt="Zowe CICS Explorer Filter" width="700px"/>
</p>

If the applied filter results in more than 500 records, either change the filter to narrow down the result set, or click the `view X more ...` item to retrieve 'X' more resources.

**Tip:** The default 500 count can be modified via the `Record Count Increment` property in the settings for the CICS extension.

<p align="center">
<img src="/packages/vsce/docs/images/record-count-increment.png" alt="Zowe CICS Explorer Record Count Increment in Setting UI" width="700px"/>
</p>

### Show attributes

Right-click and use the pop-up menu against a program to list the available actions that can be performed. For every resource, including a CICS region, `Show Attributes` opens a viewer listing all attributes and their values. The attributes page has a filter box at the top that lets you search for attributes matching the criteria.

<p align="center">
<img src="/packages/vsce/docs/images/show-attributes.gif" alt="Zowe CICS Explorer Filter" width="700px"/>
</p>

### Enable and disable

Right-click against a program, local transaction, or local file to open the pop-up menu and select `Disable [CICS resource]` to disable the resource. When a resource is already disabled the first option becomes `Enable [CICS resource]` to allow its enablement state to be toggled. A disabled resource is identified by a `(Disabled)` label next to its name.

<p align="center">
<img src="/packages/vsce/docs/images/disable-enable.gif" alt="Zowe CICS Explorer Filter" width="700px"/>
</p>

### New Copy and Phase In

Use `New Copy` <img src="/packages/vsce/docs/images/program-newcopy-action.png" width="16px"/> and `Phase In` <img src="/packages/vsce/docs/images/program-phasein-action.png" width="16px"/> actions against a CICS program to refresh the program only if it is not currently in use (New Copy), or to use the new version of the module for all future requests (Phase In). This could be after you have edited a COBOL program source and successfully compiled it into a load library so that you can test your change.

The `newcopycnt` for a program which is greater than zero is shown next to the program item in the CICS resource tree.

<p align="center">
<img src="/packages/vsce/docs/images/new-copy.gif" alt="Zowe CICS Explorer NewCopy Program" width="600px"/>
</p>

### Open and Close Local Files

Right-click against a closed local file and perform the `Open Local File` menu action to toggle the `openstatus` attribute to `OPEN`.

To close a local file, right-click against an open local file and perform the `Close Local File` menu action. This brings up a prompt on the bottom right corner requesting to choose one of `Wait`, `No Wait`, or `Force` for the file busy condition. Once an option has been selected, the local file name is appended with a `(Closed)` label upon success.

<p align="center">
<img src="/packages/vsce/docs/images/open-close.gif" alt="Zowe CICS Explorer NewCopy Program" width="600px"/>
</p>

### Purge Task

Right-click against a task and click the `Purge Task` command. This opens a prompt asking whether to perform a `Purge` or `Force Purge`.

Select the appropriate condition to perform the purge.

<p align="center">
<img src="/packages/vsce/docs/images/purge-task.gif" alt="Zowe CICS Explorer Purge Task" width="600px"/>
</p>

### Inquire functionality

Right-click against a task and perform the `Inquire Transaction` command. This inquires the associated local transaction (that is, the transaction with the name that matches the `tranid` attribute of the selected task) under the local transactions folder.

The same can be done on a local transaction to find the associated Program by executing the `Inquire Program` right-click menu action against a local transaction.

<p align="center">
<img src="/packages/vsce/docs/images/inquire.gif" alt="Zowe CICS Explorer Inquire functionality" width="600px"/>
</p>

### View data sets under libraries

Expand libraries of a region to view specific data sets belonging to a library. Right-click on libraries to `Show Attributes` to view library attributes. Similarly, right-click on data sets to `Show Attributes` to view data set attributes.

<p align="center">
<img src="/packages/vsce/docs/images/datasets.gif" alt="Zowe CICS Explorer View Datasets functionality" width="600px"/>
</p>

### View four CICS web resources under the web folder

Expand the Web folder to view TCPIP Services, URI Maps, Pipelines, and Web Services. Each of these resources can be expanded and allows for right-click functionality on the specific resource to execute the `Show Attributes` command. Use the **Filter** icon to filter down specific resources by applying a filter.

<p align="center">
<img src="/packages/vsce/docs/images/webResources.gif" alt="Zowe CICS Explorer Web resources under the Web folder" width="600px"/>
</p>

## Untrusted TLS certificates

If the CMCI connection is using a TLS certificate that your PC does not have in its trust store, then by default the connection will be rejected untrusted with the error `SELF_SIGNED_CERT_IN_CHAIN - self signed certificate in certificate chain`. To override this behavior, use the setting `rejectUnauthorized=false` on your CICS connection profile.

## Usage tips

- Most menu actions available by right-clicking a profile or resource can be applied to multiple items by multi-selecting nodes of the same type before right-clicking.

  - To multi-select, either hold `Ctrl`/`Cmd` key while selecting resources, or select the first item in a list of nodes then hold `Shift` and click both the last item to select a consecutive list of nodes.

- Click the **Refresh** icon <img src="/packages/vsce/docs/images/refresh-icon.png" width="16px"/> at the top of the CICS view to reload the resources in every region.

## Providing feedback or help contributing

### Checking the source of an error

Before filing an issue, check if an error is arising from the IBM CICS for Zowe Explorer extension and not the Zowe Explorer extension by expanding the error message and checking if the `Source` is `IBM CICS for Zowe Explorer (Extension)`.

<p align="center">
<img src="/packages/vsce/docs/images/expand-error-cics.gif" alt="Zowe CICS Explorer NewCopy Program" width="600px"/>
</p>

Error messages arising from the Zowe Explorer extension identify the `Source` as `Zowe Explorer(Extension)`.

### Filing an issue

Before filing an issue, check the [Troubleshooting guide](/packages/vsce/docs/Troubleshooting.md) first to ensure that the issue has not already been addressed.

To file issues, use the [IBM CICS for Zowe Explorer issue list](https://github.com/zowe/cics-for-zowe-client/issues), or chat with use on [Slack](https://openmainframeproject.slack.com/archives/CUVE37Z5F) by indicating the message is for the IBM CICS for Zowe Explorer extension.

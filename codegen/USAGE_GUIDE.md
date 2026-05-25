# Code Generator Usage Guide

This guide provides step-by-step instructions for using the CICS Command Code Generator.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Basic Usage](#basic-usage)
3. [Adding a New Command](#adding-a-new-command)
4. [Understanding the Output](#understanding-the-output)
5. [Integration with Main Project](#integration-with-main-project)
6. [Common Patterns](#common-patterns)

## Prerequisites

- Node.js 14 or higher
- npm or yarn
- Basic understanding of TypeScript
- Familiarity with Zowe CLI, CICS SDK, and VS Code extensions

## Basic Usage

### 1. Setup

Navigate to the codegen directory and install dependencies:

```bash
cd codegen
npm install
```

### 2. Generate Code

Run the generator:

```bash
npm run generate
```

This creates files in the `generated/` directory.

### 3. Review Output

Check the generated files:

```bash
ls -R generated/
```

You should see:
```
generated/
├── cli/
│   ├── open/
│   ├── close/
│   ├── enable/
│   └── strings/
├── sdk/
│   ├── openLocalFile.ts
│   ├── closeLocalFile.ts
│   └── enableLocalFile.ts
└── vsce/
    └── CICSLocalFileCommandHandler.ts
```

## Adding a New Command

### Example: Adding DISABLE Command

#### Step 1: Edit commandSpecification.json

Add a new command group after the existing ones:

```json
{
  "group": "disable",
  "groupAliases": ["dis"],
  "groupSummary": "Disable resources in CICS",
  "groupDescription": "Disable resources (for example, local files) in CICS through IBM CMCI.",
  "resources": [
    {
      "name": "CICSLocalFile",
      "aliases": ["lf"],
      "humanName": "Local File",
      "humanNameLower": "local file",
      "sdkResourceType": "CICS_CMCI_LOCAL_FILE",
      "parmsInterface": "ILocalFileParms",
      "criteriaField": "file",
      "maxNameLength": 8,
      "actions": [
        {
          "name": "DISABLE",
          "actionLower": "disable",
          "actionVerb": "disabling",
          "actionPastTense": "disabled",
          "sdkFunction": "disableLocalFile",
          "cliHandler": "LocalFileHandler",
          "vsceCommandId": "cics-extension-for-zowe.disableLocalFile",
          "positionals": [
            {
              "name": "fileName",
              "description": "The name of the local file to disable. The maximum length of the file name is eight characters.",
              "type": "string",
              "required": true,
              "sdkParamName": "name"
            }
          ],
          "options": [
            {
              "name": "region-name",
              "description": "The CICS region name in which to disable the local file",
              "type": "string",
              "sdkParamName": "regionName"
            },
            {
              "name": "cics-plex",
              "description": "The name of the CICSPlex in which to disable the local file",
              "type": "string",
              "sdkParamName": "cicsPlex"
            }
          ],
          "parameters": [],
          "messages": {
            "success": "The local file '%s' was disabled successfully.",
            "progress": "Disabling local file in CICS"
          },
          "examples": [
            {
              "description": "Disable a local file named TESTFILE in the region named MYREGION",
              "options": "TESTFILE --region-name MYREGION"
            }
          ]
        }
      ]
    }
  ]
}
```

#### Step 2: Generate Code

```bash
npm run generate
```

#### Step 3: Review Generated Files

Check the new files:

```bash
# CLI files
cat generated/cli/disable/Disable.definition.ts
cat generated/cli/disable/DisableCICSLocalFile.ts
cat generated/cli/strings/disable.strings.ts

# SDK file
cat generated/sdk/disableLocalFile.ts

# VSCE handler (updated)
cat generated/vsce/CICSLocalFileCommandHandler.ts
```

#### Step 4: Copy to Source Directories

```bash
# Copy CLI files
cp generated/cli/disable/*.ts ../packages/cli/src/disable/
cp generated/cli/strings/disable.strings.ts ../packages/cli/src/-strings-/

# Copy SDK file
cp generated/sdk/disableLocalFile.ts ../packages/sdk/src/methods/disable/

# VSCE handler needs manual integration (see below)
```

## Understanding the Output

### CLI Layer Output

**Group Definition** (`Disable.definition.ts`):
- Defines the command group structure
- Imports child resource commands
- Configures CICS connection options
- Sets up command hierarchy

**Resource Command** (`DisableCICSLocalFile.ts`):
- Defines the specific resource command
- Specifies positional arguments and options
- References the handler class
- Includes usage examples

**Strings** (`disable.strings.ts`):
- Internationalization strings
- Success/error messages
- Help text and descriptions

### SDK Layer Output

**Function** (`disableLocalFile.ts`):
- TypeScript function that calls CMCI API
- Parameter validation
- Error handling
- Uses generic `performAction` utility

### VSCE Layer Output

**Command Handler** (`CICSLocalFileCommandHandler.ts`):
- Class-based command handler
- Integrates with VS Code tree view
- Handles user interactions
- Manages command registration

## Integration with Main Project

### CLI Integration

1. **Add to imperative.ts**:

```typescript
import DisableDefinition = require("./disable/Disable.definition");

// In the definitions array:
{
  name: "disable",
  type: "group",
  description: DisableDefinition.description,
  children: [DisableDefinition]
}
```

2. **Update strings index**:

```typescript
// In -strings-/en.ts
import { DisableStrings } from "./disable.strings";

export default {
  // ... existing strings
  DISABLE: DisableStrings,
};
```

### SDK Integration

1. **Export from methods/index.ts**:

```typescript
export * from "./disable/Disable";
```

2. **Add to Disable.ts** (if creating new):

```typescript
export { disableLocalFile } from "./disableLocalFile";
```

3. **Update constants** (if needed):

```typescript
// In constants/CicsCmci.constants.ts
export const CICS_CMCI_LOCAL_FILE_MAX_LENGTH = 8;
export const CICS_CMCI_LOCAL_FILE = "CICSLocalFile";
export const CICS_CMCI_LOCAL_FILE_CRITERIA_FIELD = "file";
```

### VSCE Integration

1. **Update extension.ts**:

```typescript
import { CICSLocalFileCommandHandler } from "./commands/CICSLocalFileCommandHandler";

// In activate function:
const localFileHandler = new CICSLocalFileCommandHandler(tree, treeview);
context.subscriptions.push(
  localFileHandler.registerOPENCommand(),
  localFileHandler.registerCLOSECommand(),
  localFileHandler.registerENABLECommand(),
  localFileHandler.registerDISABLECommand() // Add this
);
```

2. **Update package.json commands**:

```json
{
  "command": "cics-extension-for-zowe.disableLocalFile",
  "title": "Disable Local File",
  "category": "CICS"
}
```

3. **Update menus** (if needed):

```json
{
  "command": "cics-extension-for-zowe.disableLocalFile",
  "when": "viewItem =~ /^cics.*\\.localfile$/",
  "group": "a_cics@4"
}
```

## Common Patterns

### Adding a Parameter to an Action

For actions that need additional parameters (like CLOSE with BUSY):

```json
{
  "name": "CLOSE",
  "parameters": [
    {
      "name": "busy",
      "description": "Specifies the action to take if the file is busy",
      "type": "string",
      "choices": ["WAIT", "NOWAIT", "FORCE"],
      "sdkParamName": "busy"
    }
  ]
}
```

In VSCE handler:

```typescript
public registerCLOSECommand() {
  return this.createActionCommand({
    commandId: "cics-extension-for-zowe.closeLocalFile",
    action: "CLOSE",
    parameter: {
      name: "busy",
      prompt: l10n.t("Choose one of the following for the file busy condition"),
      choices: {
        [l10n.t("Wait")]: "WAIT",
        [l10n.t("No Wait")]: "NOWAIT",
        [l10n.t("Force")]: "FORCE",
      },
    },
  });
}
```

### Adding Multiple Resources to a Group

```json
{
  "group": "enable",
  "resources": [
    {
      "name": "CICSLocalFile",
      "actions": [...]
    },
    {
      "name": "CICSProgram",
      "aliases": ["prog"],
      "humanName": "Program",
      "sdkResourceType": "CICS_CMCI_PROGRAM",
      "actions": [...]
    }
  ]
}
```

### Adding Multiple Actions to a Resource

```json
{
  "name": "CICSLocalFile",
  "actions": [
    {
      "name": "ENABLE",
      "actionLower": "enable",
      ...
    },
    {
      "name": "DISABLE",
      "actionLower": "disable",
      ...
    }
  ]
}
```

## Validation

Before generating, validate your JSON:

```bash
npm run validate
```

This checks:
- JSON syntax
- Schema compliance
- Required fields
- Type correctness

## Tips and Best Practices

1. **Start with existing examples**: Copy and modify open/close/enable commands
2. **Use consistent naming**: Follow the established patterns
3. **Test incrementally**: Generate and test one command at a time
4. **Keep backups**: Save working configurations before major changes
5. **Document custom changes**: If you modify templates, document why
6. **Version control**: Commit specification changes separately from generated code

## Troubleshooting

### Problem: JSON validation fails

**Solution**: Check for:
- Missing commas
- Unclosed brackets
- Typos in field names
- Invalid enum values

### Problem: Generated code has TypeScript errors

**Solution**: 
- Verify import paths in templates
- Check that referenced types exist
- Ensure SDK constants are defined

### Problem: Command doesn't appear in CLI

**Solution**:
- Verify command is registered in imperative.ts
- Check that strings are exported
- Ensure handler path is correct

### Problem: VS Code command not working

**Solution**:
- Check command ID matches package.json
- Verify handler is registered in extension.ts
- Ensure tree view context is correct

## Next Steps

After generating code:

1. Review all generated files
2. Run TypeScript compiler to check for errors
3. Run unit tests
4. Test commands manually
5. Update documentation
6. Create pull request

## Support

For issues or questions:
- Check the main README.md
- Review existing command implementations
- Consult the JSON schema
- Ask the team for guidance
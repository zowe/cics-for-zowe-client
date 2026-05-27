# Code Generator Usage Guide

This guide provides comprehensive instructions for using the CICS Command Code Generator, including advanced patterns and best practices.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Basic Usage](#basic-usage)
3. [Adding a New Command](#adding-a-new-command)
4. [Understanding the Output](#understanding-the-output)
5. [Integration with Main Project](#integration-with-main-project)
6. [Common Patterns](#common-patterns)
7. [Advanced Features](#advanced-features)

## Prerequisites

- Node.js 14 or higher
- npm or yarn
- Basic understanding of TypeScript
- Familiarity with Zowe CLI, CICS SDK, and VS Code extensions
- Git for version control

## Basic Usage

### 1. Setup

Navigate to the codegen directory and install dependencies:

```bash
cd codegen
npm install
```

### 2. Choose Your Generation Mode

**Direct Mode (Recommended):**
```bash
npm run generate:direct
```
- Writes directly to packages
- Automatically merges new code
- Requires clean git state

**Safe Mode (For Review):**
```bash
npm run generate
```
- Writes to `generated/` directory
- Allows manual review before integration
- Safer for learning

See [GENERATION_MODES.md](GENERATION_MODES.md) for detailed comparison.

### 3. Review Output

**For Direct Mode:**
```bash
git diff
```

**For Safe Mode:**
```bash
ls -R generated/
```

## Adding a New Command

### Example: Adding DISABLE Command

#### Step 1: Edit commandSpecification.json

Add a new command group after the existing ones:

```json
{
  "group": "disable",
  "groupAliases": ["dsb"],
  "groupSummary": "Disable resources in CICS",
  "groupDescription": "Disable resources (for example, local files) in CICS through IBM CMCI.",
  "resources": [
    {
      "name": "CICSLocalFile",
      "sdkFileName": "LocalFile",
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
npm run generate:direct
```

#### Step 3: Review Generated Files

Check the console output:
```
🚀 Starting comprehensive code generation...

📦 Generating CLI layer...
  ✓ cli/src/disable/Disable.definition.ts
  ✓ cli/src/disable/localfile/DisableLocalFile.ts
  ℹ️  cli/src/common/LocalFileHandler.ts already exists, skipping
  ✓ Updated main strings file: -strings-/en.ts
✅ CLI layer generated

📦 Generating SDK layer...
  ✓ sdk/src/resources/LocalFile.ts
✅ SDK layer generated

📦 Generating VSCE layer...
  ✓ vsce/src/commands/LocalFileCommandHandler.ts
✅ VSCE layer generated

🎉 Code generation complete!
```

#### Step 4: Complete Manual Integration

See [Integration with Main Project](#integration-with-main-project) section below.

## Understanding the Output

### CLI Layer Output

**Group Definition** (`Disable.definition.ts`):
- Defines the command group structure
- Imports child resource commands
- Configures CICS connection options
- Sets up command hierarchy

**Resource Command** (`DisableLocalFile.ts`):
- Located in `disable/localfile/` subdirectory
- Defines the specific resource command
- Specifies positional arguments and options
- References the shared handler class
- Includes usage examples

**Shared Handler** (`LocalFileHandler.ts`):
- Located in `common/` directory
- Handles multiple actions (OPEN, CLOSE, ENABLE, DISABLE)
- Routes to appropriate SDK function based on action
- Only generated if it doesn't already exist

**Strings** (in `en.ts`):
- Automatically merged into main strings file
- Includes descriptions, options, messages, examples
- Preserves existing strings

### SDK Layer Output

**Unified Resource File** (`LocalFile.ts`):
- Contains all actions for the resource
- TypeScript functions that call CMCI API
- Parameter validation
- Error handling
- Uses generic `performAction` utility
- New functions are intelligently merged

### VSCE Layer Output

**Command Handler** (`LocalFileCommandHandler.ts`):
- Class-based command handler
- Integrates with VS Code tree view
- Handles user interactions
- Manages command registration
- New methods are intelligently merged

## Integration with Main Project

### CLI Integration

#### 1. Update Imperative Configuration

Edit `packages/cli/src/imperative.ts`:

```typescript
import DisableDefinition = require("./disable/Disable.definition");

// In the definitions array:
const config: IImperativeConfig = {
  definitions: [
    // ... existing definitions
    {
      name: "disable",
      type: "group",
      description: DisableDefinition.description,
      children: [DisableDefinition]
    }
  ]
};
```

#### 2. Verify Strings

The strings are automatically merged, but verify they look correct in `packages/cli/src/-strings-/en.ts`:

```typescript
DISABLE: {
  SUMMARY: "Disable resources in CICS",
  DESCRIPTION: "Disable resources (for example, local files) in CICS through IBM CMCI.",
  RESOURCES: {
    LOCALFILE: {
      DESCRIPTION: "Disabling a local file in CICS.",
      POSITIONALS: {
        FILENAME: "The name of the local file to disable...",
      },
      OPTIONS: {
        REGIONNAME: "The CICS region name...",
        CICSPLEX: "The name of the CICSPlex...",
      },
      MESSAGES: {
        SUCCESS: "The local file '%s' was disabled successfully.",
        PROGRESS: "Disabling local file in CICS",
      },
      EXAMPLES: {
        EX1: "Disable a local file named TESTFILE...",
      },
    },
  },
},
```

### SDK Integration

#### 1. Export from Methods Index

Edit `packages/sdk/src/methods/disable/Disable.ts`:

```typescript
// Re-export disableLocalFile from LocalFile resource
export { disableLocalFile } from "../../resources/LocalFile";
```

#### 2. Verify Function in Resource File

Check `packages/sdk/src/resources/LocalFile.ts` for the new function:

```typescript
export async function disableLocalFile(
  session: AbstractSession,
  parms: ILocalFileParms
): Promise<ICMCIApiResponse> {
  // Implementation automatically generated
}
```

### VSCE Integration

#### 1. Update Extension Registration

Edit `packages/vsce/src/extension.ts`:

```typescript
import { 
  getOpenLocalFileCommand,
  getCloseLocalFileCommand,
  getEnableLocalFileCommand,
  getDisableLocalFileCommand  // Add this
} from "./commands/LocalFileCommandHandler";

// In activate function:
export function activate(context: vscode.ExtensionContext) {
  // ... existing code
  
  context.subscriptions.push(
    getOpenLocalFileCommand(tree, treeview),
    getCloseLocalFileCommand(tree, treeview),
    getEnableLocalFileCommand(tree, treeview),
    getDisableLocalFileCommand(tree, treeview)  // Add this
  );
}
```

#### 2. Update package.json Commands

Edit `packages/vsce/package.json`:

Add to `contributes.commands`:
```json
{
  "command": "cics-extension-for-zowe.disableLocalFile",
  "title": "Disable Local File",
  "category": "CICS"
}
```

Add to `contributes.menus.view/item/context`:
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
  "options": [
    {
      "name": "busy",
      "description": "The busy condition option for closing the file. Valid values: WAIT, NOWAIT, FORCE. Default is WAIT.",
      "type": "string",
      "defaultValue": "WAIT",
      "allowableValues": ["WAIT", "NOWAIT", "FORCE"],
      "caseSensitive": false,
      "sdkParamName": "busy",
      "constantReference": "CICS_LOCAL_FILE_BUSY_VALUES"
    }
  ],
  "parameters": [
    {
      "name": "BUSY",
      "sdkParamField": "busy",
      "transform": "toUpperCase",
      "defaultValue": "WAIT",
      "validation": "CICS_LOCAL_FILE_BUSY_VALUES"
    }
  ],
  "vsceParameter": {
    "name": "busy",
    "prompt": "Choose one of the following for the file busy condition",
    "choices": {
      "Wait": "WAIT",
      "No Wait": "NOWAIT",
      "Force": "FORCE"
    }
  }
}
```

This generates:
- CLI option with validation
- SDK parameter handling
- VSCE prompt with choices

### Adding Multiple Resources to a Group

```json
{
  "group": "enable",
  "resources": [
    {
      "name": "CICSLocalFile",
      "sdkFileName": "LocalFile",
      "actions": [...]
    },
    {
      "name": "CICSProgram",
      "sdkFileName": "Program",
      "aliases": ["prog"],
      "humanName": "Program",
      "humanNameLower": "program",
      "sdkResourceType": "CICS_CMCI_PROGRAM",
      "actions": [...]
    }
  ]
}
```

This generates separate handlers and SDK files for each resource.

### Adding Multiple Actions to a Resource

```json
{
  "name": "CICSLocalFile",
  "sdkFileName": "LocalFile",
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

All actions are added to the same unified SDK resource file.

### Using Shared Handlers

When multiple command groups use the same resource:

```json
// In open group
{
  "name": "CICSLocalFile",
  "actions": [{ "cliHandler": "LocalFileHandler", ... }]
}

// In close group
{
  "name": "CICSLocalFile",
  "actions": [{ "cliHandler": "LocalFileHandler", ... }]
}

// In enable group
{
  "name": "CICSLocalFile",
  "actions": [{ "cliHandler": "LocalFileHandler", ... }]
}
```

The generator creates a single shared handler in `cli/src/common/LocalFileHandler.ts`.

## Advanced Features

### Intelligent Function Merging

When adding a new action to an existing resource:

1. Generator checks if the function already exists in the SDK file
2. If it exists, skips it with a message: `ℹ️ Function disableLocalFile already exists`
3. If it doesn't exist, adds it to the file
4. Preserves all existing functions and imports

### Automatic String Management

Direct mode automatically:
1. Finds the group section in `en.ts`
2. Locates the RESOURCES object
3. Checks if the resource already exists
4. If not, adds the new resource strings
5. Updates the group description to include the new resource type
6. Preserves all existing strings and formatting

### Template Customization

You can customize templates in `templates/` directory:

**Example: Modifying CLI Handler Template**

Edit `templates/cli/handler.hbs`:
```handlebars
import { ICommandHandler, IHandlerParameters } from "@zowe/imperative";
import { {{parmsInterface}} } from "@zowe/cics-for-zowe-sdk";
{{#each actions}}
import { {{sdkFunction}} } from "@zowe/cics-for-zowe-sdk";
{{/each}}

export default class {{handlerName}} implements ICommandHandler {
  public async process(params: IHandlerParameters): Promise<void> {
    // Your custom logic here
  }
}
```

### Schema Validation

The generator validates your JSON against the schema. Common validation errors:

- Missing required fields
- Invalid enum values
- Incorrect types
- Malformed structure

Run validation manually:
```bash
# The generator validates automatically, but you can check the schema
cat commandSpecification.schema.json
```

## Validation

Before generating, the specification is automatically validated. Common issues:

### Missing Required Fields
```
Error: Missing required field 'sdkFunction' in action
```
**Solution**: Add all required fields to your action definition.

### Invalid Enum Values
```
Error: Invalid value for 'type'. Must be one of: string, number, boolean
```
**Solution**: Use only allowed values from the schema.

### Incorrect Structure
```
Error: 'commands' must be an array
```
**Solution**: Ensure your JSON structure matches the schema.

## Tips and Best Practices

1. **Start with existing examples**: Copy and modify open/close/enable commands
2. **Use consistent naming**: Follow the established patterns
3. **Test incrementally**: Generate and test one command at a time
4. **Keep backups**: Commit before generating in direct mode
5. **Document custom changes**: If you modify templates, document why
6. **Version control**: Commit specification changes separately from generated code
7. **Review console output**: The generator provides helpful messages
8. **Check git diff**: Always review what changed after generation
9. **Use sdkFileName**: Specify `sdkFileName` to control the SDK resource file name
10. **Leverage shared handlers**: Use the same handler name for related actions

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
- Run `npm install` to update dependencies

### Problem: Command doesn't appear in CLI

**Solution**:
- Verify command is registered in `imperative.ts`
- Check that strings are exported
- Ensure handler path is correct
- Rebuild the CLI package

### Problem: VS Code command not working

**Solution**:
- Check command ID matches `package.json`
- Verify handler is registered in `extension.ts`
- Ensure tree view context is correct
- Check the `when` clause in menus

### Problem: Strings not updating in Direct Mode

**Solution**:
- Ensure the group section exists in `en.ts`
- Check that RESOURCES object exists
- Verify the structure matches expected format
- The generator will skip if structure is not found

### Problem: Function already exists message

**Solution**: This is expected! The generator preserves existing functions. If you want to regenerate:
1. Delete the function from the file
2. Run the generator again

### Problem: Need to undo Direct Mode changes

**Solution**:
```bash
git reset --hard HEAD  # Revert all changes
# or
git checkout -- path/to/file  # Revert specific file
```

## Next Steps

After generating code:

1. Review all generated files
2. Complete manual integration steps
3. Run TypeScript compiler to check for errors
4. Run unit tests
5. Test commands manually
6. Update user-facing documentation
7. Create pull request

## Support

For issues or questions:
- Check the main [README.md](README.md)
- Review [GENERATION_MODES.md](GENERATION_MODES.md)
- See [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)
- Review existing command implementations
- Consult the JSON schema
- Check console output for helpful messages
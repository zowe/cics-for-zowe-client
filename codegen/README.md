# CICS Command Code Generator

A comprehensive code generation system that generates CLI, SDK, and VS Code Extension (VSCE) code from a single JSON specification. This system eliminates code duplication and ensures consistency across all three layers of the CICS for Zowe implementation.

## Overview

This code generator creates:
- **CLI Commands**: Zowe CLI command definitions and handlers
- **SDK Functions**: TypeScript functions that interact with CICS CMCI APIs
- **VSCE Commands**: VS Code extension command handlers with tree view integration

All code is generated from a single source of truth: `commandSpecification.json`

## Architecture

```
┌─────────────────────────────────┐
│  commandSpecification.json      │  ← Single source of truth
└────────────┬────────────────────┘
             │
             ├──────────────────────────────────────┐
             │                                      │
             ▼                                      ▼
    ┌────────────────┐                    ┌────────────────┐
    │   Templates    │                    │   Generator    │
    │  (Handlebars)  │◄───────────────────│  (TypeScript)  │
    └────────┬───────┘                    └────────────────┘
             │
             ├─────────────┬─────────────┬─────────────┐
             ▼             ▼             ▼             ▼
        ┌────────┐    ┌────────┐    ┌────────┐   ┌──────────┐
        │  CLI   │    │  SDK   │    │  VSCE  │   │ Strings  │
        └────────┘    └────────┘    └────────┘   └──────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
cd codegen
npm install
```

### 2. Generate Code (Recommended: Direct Mode)

```bash
npm run generate:direct
```

This will **automatically write directly** to the packages:
- `packages/cli/src/` - CLI command definitions
- `packages/sdk/src/resources/` - SDK functions
- `packages/vsce/src/commands/` - VSCE command handlers

⚠️ **Important**: Commit your changes before running to easily revert if needed!

```bash
# Before generating
git add .
git commit -m "Before code generation"

# Generate
npm run generate:direct

# Review changes
git diff

# If satisfied, commit
git add .
git commit -m "Generated new command"

# If not satisfied, revert
git reset --hard HEAD
```

#### Alternative: Safe Mode (Manual Review)

If you prefer to review generated code before applying:

```bash
npm run generate
```

This generates code in the `generated/` directory for manual review and copying.
See [GENERATION_MODES.md](GENERATION_MODES.md) for details.

### 3. Review Generated Code

Check the generated files. The generator creates:
- CLI group definitions (e.g., `Enable.definition.ts`)
- CLI resource commands (e.g., `EnableCICSLocalFile.ts`)
- SDK functions (e.g., `enableLocalFile.ts`)
- VSCE command handlers (e.g., `CICSLocalFileCommandHandler.ts`)
- Internationalization strings (e.g., `enable.strings.ts`)

## JSON Specification Format

The `commandSpecification.json` file defines all commands using this structure:

```json
{
  "$schema": "./commandSpecification.schema.json",
  "commands": [
    {
      "group": "enable",
      "groupAliases": ["enb"],
      "groupSummary": "Enable resources in CICS",
      "groupDescription": "Enable resources (for example, local files) in CICS through IBM CMCI.",
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
              "name": "ENABLE",
              "actionLower": "enable",
              "actionVerb": "enabling",
              "actionPastTense": "enabled",
              "sdkFunction": "enableLocalFile",
              "cliHandler": "LocalFileHandler",
              "vsceCommandId": "cics-extension-for-zowe.enableLocalFile",
              "positionals": [...],
              "options": [...],
              "parameters": [...],
              "messages": {...},
              "examples": [...]
            }
          ]
        }
      ]
    }
  ]
}
```

### Key Fields

#### Command Group Level
- `group`: Command group name (e.g., "enable", "disable")
- `groupAliases`: Short aliases for the group
- `groupSummary`: Brief description for help text
- `groupDescription`: Detailed description

#### Resource Level
- `name`: Resource type name (e.g., "CICSLocalFile")
- `aliases`: Short aliases for the resource
- `humanName`: Human-readable name for messages
- `sdkResourceType`: Constant name in SDK (e.g., "CICS_CMCI_LOCAL_FILE")
- `parmsInterface`: TypeScript interface for parameters
- `criteriaField`: Field name for CMCI criteria
- `maxNameLength`: Maximum length for resource names

#### Action Level
- `name`: Action name in uppercase (e.g., "ENABLE")
- `actionLower`: Lowercase version for function names
- `actionVerb`: Present continuous form (e.g., "enabling")
- `actionPastTense`: Past tense form (e.g., "enabled")
- `sdkFunction`: SDK function name
- `cliHandler`: CLI handler class name
- `vsceCommandId`: VS Code command identifier

#### Parameters
- `positionals`: Required command-line arguments
- `options`: Optional command-line flags
- `parameters`: Additional CMCI parameters (e.g., BUSY for CLOSE)

#### Messages & Examples
- `messages.success`: Success message template
- `messages.progress`: Progress message for long operations
- `examples`: Array of usage examples

## Adding a New Command

### Example: Adding a DISABLE command

1. **Edit `commandSpecification.json`**:

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

2. **Run the generator**:

```bash
npm run generate
```

3. **Review generated files**:
   - `generated/cli/disable/Disable.definition.ts`
   - `generated/cli/disable/DisableCICSLocalFile.ts`
   - `generated/cli/strings/disable.strings.ts`
   - `generated/sdk/disableLocalFile.ts`
   - `generated/vsce/CICSLocalFileCommandHandler.ts` (updated)

4. **Copy to source directories**:
   - Copy CLI files to `packages/cli/src/disable/`
   - Copy SDK files to `packages/sdk/src/methods/disable/`
   - Update VSCE command registration in `packages/vsce/src/extension.ts`

## Template System

The generator uses Handlebars templates located in `templates/`:

### CLI Templates
- `cli/group.definition.hbs` - Command group definition
- `cli/resource.definition.hbs` - Resource command definition
- `cli/strings.hbs` - Internationalization strings

### SDK Templates
- `sdk/resource.function.hbs` - SDK function implementation

### VSCE Templates
- `vsce/command.handler.hbs` - VS Code command handler

### Custom Handlebars Helpers

The generator provides these helpers:
- `toUpperCase` - Convert to uppercase
- `toLowerCase` - Convert to lowercase
- `camelCase` - Convert to camelCase
- `pascalCase` - Convert to PascalCase
- `eq` - Equality comparison
- `or` - Logical OR
- `and` - Logical AND

## Generated Code Structure

### CLI Layer

**Group Definition** (`Enable.definition.ts`):
```typescript
const definition: ICommandDefinition = {
  name: "enable",
  aliases: ["enb"],
  summary: strings.SUMMARY,
  description: strings.DESCRIPTION,
  type: "group",
  children: [CICSLocalFileDefinition],
  passOn: [...]
};
```

**Resource Command** (`EnableCICSLocalFile.ts`):
```typescript
export const CICSLocalFileDefinition: ICommandDefinition = {
  name: "CICSLocalFile",
  aliases: ["lf"],
  description: strings.DESCRIPTION,
  handler: __dirname + "/../common/LocalFileHandler",
  type: "command",
  positionals: [...],
  options: [...],
  profile: { optional: ["cics"] },
  examples: [...]
};
```

### SDK Layer

**Function** (`enableLocalFile.ts`):
```typescript
export async function enableLocalFile(
  session: AbstractSession,
  parms: ILocalFileParms
): Promise<ICMCIApiResponse> {
  // Validation
  ImperativeExpect.toBeDefinedAndNonBlank(parms.name, "CICS Local File name");
  ImperativeExpect.toBeDefinedAndNonBlank(parms.regionName, "CICS Region name");
  
  // Call generic performAction utility
  return performAction(
    session,
    CicsCmciConstants.CICS_CMCI_LOCAL_FILE,
    "ENABLE",
    { name: parms.name, regionName: parms.regionName, cicsPlex: parms.cicsPlex },
    CicsCmciConstants.CICS_CMCI_LOCAL_FILE_CRITERIA_FIELD
  );
}
```

### VSCE Layer

**Command Handler** (`CICSLocalFileCommandHandler.ts`):
```typescript
export class CICSLocalFileCommandHandler {
  private getSdkFunction(action: CICSLocalFileAction) {
    switch (action) {
      case "OPEN": return openLocalFile;
      case "CLOSE": return closeLocalFile;
      case "ENABLE": return enableLocalFile;
      default: throw new Error(`Unsupported action: ${action}`);
    }
  }
  
  public registerENABLECommand() {
    return this.createActionCommand({
      commandId: "cics-extension-for-zowe.enableLocalFile",
      action: "ENABLE"
    });
  }
}
```

## Validation

The JSON specification is validated against `commandSpecification.schema.json`. The schema ensures:
- Required fields are present
- Field types are correct
- Enum values are valid
- Structure is consistent

To validate manually:
```bash
npm run validate
```

## Best Practices

1. **Keep open/close/enable specifications**: These serve as working examples and should not be deleted
2. **Use consistent naming**: Follow the existing patterns for action names, function names, etc.
3. **Test generated code**: Always review and test generated code before committing
4. **Update schema**: If adding new fields, update `commandSpecification.schema.json`
5. **Document changes**: Update this README when adding new features

## Troubleshooting

### Issue: Generated code has syntax errors
**Solution**: Check your JSON specification for typos or missing fields. Run `npm run validate` to check schema compliance.

### Issue: Template not rendering correctly
**Solution**: Check Handlebars syntax in templates. Ensure you're using the correct helper functions.

### Issue: Missing imports in generated code
**Solution**: Verify that template imports match the actual package structure. Update templates if package structure has changed.

### Issue: Command not appearing in CLI
**Solution**: Ensure the command group is properly registered in the CLI's main definition file.

## File Structure

```
codegen/
├── README.md                          # This file
├── package.json                       # Dependencies and scripts
├── tsconfig.json                      # TypeScript configuration
├── generate.ts                        # Main generator script
├── commandSpecification.json          # Command definitions
├── commandSpecification.schema.json   # JSON Schema for validation
├── templates/                         # Handlebars templates
│   ├── cli/
│   │   ├── group.definition.hbs
│   │   ├── resource.definition.hbs
│   │   └── strings.hbs
│   ├── sdk/
│   │   └── resource.function.hbs
│   └── vsce/
│       └── command.handler.hbs
└── generated/                         # Generated code output
    ├── cli/
    ├── sdk/
    └── vsce/
```

## Contributing

When contributing to the code generator:

1. Test your changes with existing commands (open, close, enable)
2. Ensure generated code compiles without errors
3. Update templates if adding new features
4. Update this README with any new functionality
5. Add examples for new features

## License

This code generator is part of the CICS for Zowe project and follows the same license terms.
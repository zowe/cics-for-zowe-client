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
- `packages/cli/src/-strings-/en.ts` - Internationalization strings (auto-merged)

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
- CLI resource commands (e.g., `EnableLocalFile.ts` in `localfile/` subdirectory)
- SDK functions (e.g., `enableLocalFile()` in `LocalFile.ts`)
- VSCE command handlers (e.g., methods in `LocalFileCommandHandler.ts`)
- Internationalization strings (auto-merged into `en.ts`)

## Key Features

### Intelligent Merging
- **SDK Functions**: Checks if a function already exists before adding it
- **VSCE Methods**: Adds new command registration methods without duplicating
- **Strings File**: Intelligently merges new resource strings into the main `en.ts` file
- **Shared Handlers**: Generates shared handler files only if they don't exist

### Unified Resource Files
- Creates single resource files containing all actions (e.g., `LocalFile.ts` with open, close, enable, disable)
- Reduces file proliferation and improves maintainability

### Automatic String Management
- Automatically updates the main `en.ts` strings file
- Preserves existing strings
- Maintains proper formatting and structure

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
- `sdkFileName`: Name for the SDK resource file (e.g., "LocalFile" → `LocalFile.ts`)
- `aliases`: Short aliases for the resource
- `humanName`: Human-readable name for messages
- `humanNameLower`: Lowercase version for messages
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
- `vsceParameter`: VS Code-specific parameter configuration (for prompts)

#### Messages & Examples
- `messages.success`: Success message template
- `messages.progress`: Progress message for long operations
- `examples`: Array of usage examples

## Adding a New Command

### Example: Adding a DISABLE command

1. **Edit `commandSpecification.json`**:

Add the disable command group to the `commands` array (see [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md) for full example).

2. **Run the generator**:

```bash
npm run generate:direct
```

3. **Review generated files**:
   - `packages/cli/src/disable/Disable.definition.ts`
   - `packages/cli/src/disable/localfile/DisableLocalFile.ts`
   - `packages/sdk/src/resources/LocalFile.ts` (updated with `disableLocalFile()`)
   - `packages/vsce/src/commands/LocalFileCommandHandler.ts` (updated)
   - `packages/cli/src/-strings-/en.ts` (updated)

4. **Complete manual integration**:
   - Update SDK exports in `methods/disable/Disable.ts`
   - Register command in CLI's `imperative.ts`
   - Register command in VSCE's `extension.ts`
   - Update VSCE's `package.json` with command definition

See [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md) for detailed step-by-step instructions.

## Template System

The generator uses Handlebars templates located in `templates/`:

### CLI Templates
- `cli/group.definition.hbs` - Command group definition
- `cli/group.definition.localfile.hbs` - LocalFile-specific group definition
- `cli/resource.definition.hbs` - Resource command definition
- `cli/handler.hbs` - Shared handler implementation

### SDK Templates
- `sdk/resource.function.hbs` - SDK function implementation (unified resource file)

### VSCE Templates
- `vsce/command.handler.hbs` - VS Code command handler

### Custom Handlebars Helpers

The generator provides these helpers:
- `toUpperCase` - Convert to uppercase
- `toLowerCase` - Convert to lowercase
- `capitalize` - Capitalize first letter
- `camelCase` - Convert to camelCase
- `removePrefix` - Remove prefix from string
- `add` - Add two numbers
- `eq` - Equality comparison

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
  children: [LocalFileDefinition],
  passOn: [...]
};
```

**Resource Command** (`EnableLocalFile.ts`):
```typescript
export const LocalFileDefinition: ICommandDefinition = {
  name: "cics-local-file",
  aliases: ["lf"],
  description: strings.RESOURCES.LOCALFILE.DESCRIPTION,
  handler: __dirname + "/../common/LocalFileHandler",
  type: "command",
  positionals: [...],
  options: [...],
  profile: { optional: ["cics"] },
  examples: [...]
};
```

**Shared Handler** (`LocalFileHandler.ts`):
```typescript
export default class LocalFileHandler implements ICommandHandler {
  public async process(params: IHandlerParameters): Promise<void> {
    const action = params.definition.name.toUpperCase();
    // Route to appropriate SDK function based on action
  }
}
```

### SDK Layer

**Unified Resource File** (`LocalFile.ts`):
```typescript
export async function openLocalFile(
  session: AbstractSession,
  parms: ILocalFileParms
): Promise<ICMCIApiResponse> {
  // Implementation
}

export async function closeLocalFile(
  session: AbstractSession,
  parms: ILocalFileParms
): Promise<ICMCIApiResponse> {
  // Implementation
}

export async function enableLocalFile(
  session: AbstractSession,
  parms: ILocalFileParms
): Promise<ICMCIApiResponse> {
  // Implementation
}

export async function disableLocalFile(
  session: AbstractSession,
  parms: ILocalFileParms
): Promise<ICMCIApiResponse> {
  // Implementation
}
```

### VSCE Layer

**Command Handler** (`LocalFileCommandHandler.ts`):
```typescript
export class LocalFileCommandHandler {
  private getSdkFunction(action: LocalFileAction) {
    switch (action) {
      case "OPEN": return openLocalFile;
      case "CLOSE": return closeLocalFile;
      case "ENABLE": return enableLocalFile;
      case "DISABLE": return disableLocalFile;
      default: throw new Error(`Unsupported action: ${action}`);
    }
  }
  
  public registerOPENCommand() { /* ... */ }
  public registerCLOSECommand() { /* ... */ }
  public registerENABLECommand() { /* ... */ }
  public registerDISABLECommand() { /* ... */ }
}

export function getOpenLocalFileCommand(...) { /* ... */ }
export function getCloseLocalFileCommand(...) { /* ... */ }
export function getEnableLocalFileCommand(...) { /* ... */ }
export function getDisableLocalFileCommand(...) { /* ... */ }
```

## Validation

The JSON specification is validated against `commandSpecification.schema.json`. The schema ensures:
- Required fields are present
- Field types are correct
- Enum values are valid
- Structure is consistent

## Best Practices

1. **Keep open/close/enable/disable specifications**: These serve as working examples and should not be deleted
2. **Use consistent naming**: Follow the existing patterns for action names, function names, etc.
3. **Test generated code**: Always review and test generated code before committing
4. **Commit before generating**: Use direct mode with a clean git state for easy rollback
5. **Review git diff**: Always check what changed after generation
6. **Update schema**: If adding new fields, update `commandSpecification.schema.json`
7. **Document changes**: Update this README when adding new features

## Troubleshooting

### Issue: Generated code has syntax errors
**Solution**: Check your JSON specification for typos or missing fields. The schema validation should catch most issues.

### Issue: "Function already exists" message
**Solution**: This is expected! The generator detected an existing function and preserved it. This is a safety feature.

### Issue: Template not rendering correctly
**Solution**: Check Handlebars syntax in templates. Ensure you're using the correct helper functions.

### Issue: Missing imports in generated code
**Solution**: Verify that template imports match the actual package structure. Update templates if package structure has changed.

### Issue: Command not appearing in CLI
**Solution**: Ensure the command group is properly registered in the CLI's `imperative.ts` file.

### Issue: Strings not updating in Direct Mode
**Solution**: Ensure the group section exists in `en.ts` with a RESOURCES object. The generator will skip if the structure is not found.

## File Structure

```
codegen/
├── README.md                          # This file
├── GENERATION_MODES.md                # Detailed mode comparison
├── QUICK_START_GUIDE.md               # Step-by-step tutorial
├── USAGE_GUIDE.md                     # Advanced usage patterns
├── package.json                       # Dependencies and scripts
├── tsconfig.json                      # TypeScript configuration
├── generate.ts                        # Main generator script
├── commandSpecification.json          # Command definitions
├── commandSpecification.schema.json   # JSON Schema for validation
├── templates/                         # Handlebars templates
│   ├── cli/
│   │   ├── group.definition.hbs
│   │   ├── group.definition.localfile.hbs
│   │   ├── resource.definition.hbs
│   │   └── handler.hbs
│   ├── sdk/
│   │   └── resource.function.hbs
│   └── vsce/
│       └── command.handler.hbs
└── generated/                         # Generated code output (safe mode)
    ├── cli/
    ├── sdk/
    └── vsce/
```

## Available Scripts

- `npm run generate` - Generate code in safe mode (to `generated/` directory)
- `npm run generate:direct` - Generate code directly into packages (recommended)
- `npm run clean` - Remove the `generated/` directory

## Documentation

- **[GENERATION_MODES.md](GENERATION_MODES.md)** - Detailed comparison of safe vs direct mode
- **[QUICK_START_GUIDE.md](QUICK_START_GUIDE.md)** - Step-by-step tutorial for adding a new command
- **[USAGE_GUIDE.md](USAGE_GUIDE.md)** - Advanced usage patterns and examples

## Contributing

When contributing to the code generator:

1. Test your changes with existing commands (open, close, enable, disable)
2. Ensure generated code compiles without errors
3. Update templates if adding new features
4. Update this README with any new functionality
5. Add examples for new features
6. Update the JSON schema if adding new fields

## License

This code generator is part of the CICS for Zowe project and follows the same license terms.
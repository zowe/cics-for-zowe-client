# Quick Start: Generate DISABLE LocalFile Command

Follow these steps to generate a new DISABLE command for LocalFile using the code generator.

## Step 1: Commit Your Current Work

```bash
# Make sure all your changes are committed
git add .
git commit -m "Before generating disable command"
```

## Step 2: Edit the JSON Specification

Open `codegen/commandSpecification.json` and add the disable command group after the enable group:

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

**Important**: Add this as a new object in the `commands` array, at the same level as `open`, `close`, and `enable`.

## Step 3: Generate the Code

```bash
cd codegen
npm run generate:direct
```

This will automatically create/update:
- ✅ `packages/cli/src/disable/Disable.definition.ts`
- ✅ `packages/cli/src/disable/localfile/DisableLocalFile.ts`
- ✅ `packages/sdk/src/resources/LocalFile.ts` (adds `disableLocalFile()` function)
- ✅ `packages/vsce/src/commands/LocalFileCommandHandler.ts` (adds disable command)
- ✅ `packages/cli/src/-strings-/en.ts` (adds DISABLE.RESOURCES.LOCALFILE section)

## Step 4: Review the Changes

```bash
# See what was generated
git diff

# Check specific files
git diff packages/sdk/src/resources/LocalFile.ts
git diff packages/cli/src/disable/
git diff packages/vsce/src/commands/LocalFileCommandHandler.ts
```

## Step 5: Manual Updates Needed

### 5.1 Update SDK Enable/Disable Export

Edit `packages/sdk/src/methods/disable/Disable.ts` and add:

```typescript
// Re-export disableLocalFile from LocalFile resource
export { disableLocalFile } from "../../resources/LocalFile";
```

### 5.2 Update CLI Disable Group Definition

Edit `packages/cli/src/disable/Disable.definition.ts` and add LocalFileDefinition:

```typescript
import { LocalFileDefinition } from "./localfile/DisableLocalFile";

const definition: ICommandDefinition = {
  name: "disable",
  // ...
  children: [LocalFileDefinition, /* other resources */],
  // ...
};
```

### 5.3 Update VSCE Extension Registration

Edit `packages/vsce/src/extension.ts` and register the disable command:

```typescript
import { getDisableLocalFileCommand } from "./commands/LocalFileCommandHandler";

// In activate function
context.subscriptions.push(
  getDisableLocalFileCommand(tree, treeview)
);
```

### 5.4 Update package.json Commands

Edit `packages/vsce/package.json` and add:

```json
{
  "command": "cics-extension-for-zowe.disableLocalFile",
  "title": "Disable Local File",
  "category": "CICS"
}
```

## Step 6: Test the Generated Code

```bash
# Build the packages
npm run build

# Run tests
npm test

# Test CLI command
zowe cics disable cics-local-file TESTFILE --region-name MYREGION
```

## Step 7: Commit Your Changes

```bash
git add .
git commit -m "Generated disable LocalFile command"
```

## What Gets Generated Automatically

### CLI Layer
- ✅ `Disable.definition.ts` - Command group definition
- ✅ `DisableLocalFile.ts` - Resource command definition
- ✅ Strings in `en.ts` - Internationalization

### SDK Layer
- ✅ `disableLocalFile()` function in `LocalFile.ts`
- ✅ Full implementation with validation
- ✅ JSDoc documentation

### VSCE Layer
- ✅ `registerDisableCommand()` method
- ✅ `getDisableLocalFileCommand()` export function
- ✅ Integration with tree view

## Troubleshooting

### Issue: "File already exists" error
**Solution**: This is expected in direct mode. The generator overwrites files. Make sure you committed first!

### Issue: TypeScript errors after generation
**Solution**: 
1. Check if you completed the manual updates (steps 5.1-5.4)
2. Run `npm install` to ensure dependencies are up to date
3. Check the generated code for any template issues

### Issue: Want to undo the generation
**Solution**:
```bash
git reset --hard HEAD  # Reverts all changes
```

### Issue: Need to regenerate
**Solution**:
```bash
# Fix your JSON specification
# Then regenerate
npm run generate:direct
```

## Tips

1. **Always commit before generating** - Easy to revert if needed
2. **Review git diff** - Make sure changes look correct
3. **Test incrementally** - Test CLI, SDK, and VSCE separately
4. **Use the schema** - The JSON schema helps catch errors early
5. **Copy from existing** - Use enable as a template for disable

## Next Steps

After successfully generating disable:
1. Add unit tests for the new command
2. Update documentation
3. Test with a real CICS system
4. Create a pull request

## Need Help?

- See [README.md](README.md) for detailed documentation
- See [GENERATION_MODES.md](GENERATION_MODES.md) for mode comparison
- See [USAGE_GUIDE.md](USAGE_GUIDE.md) for advanced usage
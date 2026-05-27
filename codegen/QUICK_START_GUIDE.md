# Quick Start: Generate DISABLE LocalFile Command

Follow these steps to generate a new DISABLE command for LocalFile using the code generator.

## Prerequisites

- Node.js 14 or higher installed
- Git repository with committed changes
- Basic understanding of the CICS command structure

## Step 1: Commit Your Current Work

```bash
# Make sure all your changes are committed
git add .
git commit -m "Before generating disable command"
```

**Why?** Direct mode modifies files in place. Having a clean git state allows easy rollback if needed.

## Step 2: Edit the JSON Specification

Open `codegen/commandSpecification.json` and add the disable command group to the `commands` array:

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
- ✅ `packages/vsce/src/commands/LocalFileCommandHandler.ts` (adds disable command method)
- ✅ `packages/cli/src/-strings-/en.ts` (adds DISABLE.RESOURCES.LOCALFILE section)
- ✅ `packages/cli/src/common/LocalFileHandler.ts` (if not exists, creates shared handler)

## Step 4: Review the Changes

```bash
# See what was generated
git diff

# Check specific files
git diff packages/sdk/src/resources/LocalFile.ts
git diff packages/cli/src/disable/
git diff packages/vsce/src/commands/LocalFileCommandHandler.ts
git diff packages/cli/src/-strings-/en.ts
```

**Expected output:**
- New CLI definition files in `disable/` directory
- New `disableLocalFile()` function in SDK LocalFile.ts
- New command registration method in VSCE handler
- New strings in the DISABLE section of en.ts

## Step 5: Manual Updates Needed

While the generator handles most of the work, a few manual steps are still required:

### 5.1 Update SDK Disable Export

Edit `packages/sdk/src/methods/disable/Disable.ts` and add:

```typescript
// Re-export disableLocalFile from LocalFile resource
export { disableLocalFile } from "../../resources/LocalFile";
```

### 5.2 Update CLI Imperative Configuration

Edit `packages/cli/src/imperative.ts` and add the disable command group:

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

Edit `packages/vsce/package.json` and add to the `contributes.commands` array:

```json
{
  "command": "cics-extension-for-zowe.disableLocalFile",
  "title": "Disable Local File",
  "category": "CICS"
}
```

And add to the `contributes.menus` section:

```json
{
  "command": "cics-extension-for-zowe.disableLocalFile",
  "when": "viewItem =~ /^cics.*\\.localfile$/",
  "group": "a_cics@4"
}
```

## Step 6: Test the Generated Code

```bash
# Build the packages
cd ..
npm run build

# Run tests
npm test

# Test CLI command (if you have a CICS connection configured)
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
- ✅ `DisableLocalFile.ts` - Resource command definition in `localfile/` subdirectory
- ✅ Strings in `en.ts` - Internationalization (auto-merged)
- ✅ `LocalFileHandler.ts` - Shared handler (if doesn't exist)

### SDK Layer
- ✅ `disableLocalFile()` function in `LocalFile.ts` (auto-merged)
- ✅ Full implementation with validation
- ✅ JSDoc documentation
- ✅ Parameter handling

### VSCE Layer
- ✅ `registerDISABLECommand()` method in `LocalFileCommandHandler.ts`
- ✅ `getDisableLocalFileCommand()` export function
- ✅ Integration with tree view

## Troubleshooting

### Issue: "Function already exists" message
**Solution**: This is expected! The generator detected an existing function and skipped it to preserve your code. This is a safety feature.

### Issue: TypeScript errors after generation
**Solution**: 
1. Check if you completed the manual updates (steps 5.1-5.4)
2. Run `npm install` to ensure dependencies are up to date
3. Check the generated code for any template issues
4. Verify imports are correct

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

### Issue: Strings not appearing in en.ts
**Solution**:
- Ensure the DISABLE group section exists in `en.ts`
- Check that the RESOURCES object exists within the group
- The generator will skip if the structure is not found

## Tips

1. **Always commit before generating** - Easy to revert if needed
2. **Review git diff** - Make sure changes look correct
3. **Test incrementally** - Test CLI, SDK, and VSCE separately
4. **Use the schema** - The JSON schema helps catch errors early
5. **Copy from existing** - Use enable as a template for disable
6. **Check console output** - The generator provides helpful messages about what it's doing

## Understanding the Generator Output

When you run `npm run generate:direct`, you'll see output like:

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

**Legend:**
- ✓ = File created or updated successfully
- ℹ️ = File skipped (already exists or function already present)
- ⚠️ = Warning (structure not found, manual intervention may be needed)

## Next Steps

After successfully generating disable:
1. Complete the manual integration steps (5.1-5.4)
2. Add unit tests for the new command
3. Update user-facing documentation
4. Test with a real CICS system
5. Create a pull request

## Need Help?

- See [README.md](README.md) for detailed documentation
- See [GENERATION_MODES.md](GENERATION_MODES.md) for mode comparison
- See [USAGE_GUIDE.md](USAGE_GUIDE.md) for advanced usage
- Check the console output for helpful messages
- Review existing commands (open, close, enable) as examples
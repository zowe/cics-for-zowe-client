# Code Generation Modes

The CICS code generator supports two modes of operation:

## Mode 1: Safe Mode (Default) - `npm run generate`

### How it works:
- Generates files to `codegen/generated/` directory
- You review the generated code
- You manually copy files to the appropriate packages
- Safe - no risk of overwriting existing code

### When to use:
- When you want to review generated code before integrating
- When learning how the generator works
- When you need to merge changes carefully
- When working on a shared codebase
- When you're unsure about the changes

### Workflow:
```bash
# 1. Edit commandSpecification.json
# 2. Generate code
cd codegen
npm run generate

# 3. Review generated files
ls -R generated/

# 4. Copy CLI files
cp generated/cli/disable/Disable.definition.ts ../packages/cli/src/disable/
cp generated/cli/disable/localfile/DisableLocalFile.ts ../packages/cli/src/disable/localfile/

# 5. Review SDK files
# Check generated/sdk/LocalFile.ts for new functions

# 6. Review VSCE files
# Check generated/vsce/LocalFileCommandHandler.ts for new command methods

# 7. Manually integrate changes as needed
```

## Mode 2: Direct Mode (Automated) - `npm run generate:direct`

### How it works:
- Generates files **directly** into the packages directories
- Automatically creates/updates files in:
  - `packages/cli/src/{group}/`
  - `packages/sdk/src/resources/`
  - `packages/vsce/src/commands/`
- Intelligently merges new functions into existing files
- Updates the main strings file (`packages/cli/src/-strings-/en.ts`)
- Fast - minimal manual intervention needed

### When to use:
- When you trust the generator completely
- When you have committed all your changes (can revert if needed)
- When you want full automation
- When generating new commands that don't exist yet
- When adding new actions to existing resources

### Workflow:
```bash
# 1. Commit your current changes
git add .
git commit -m "Before code generation"

# 2. Edit commandSpecification.json
# 3. Generate code directly
cd codegen
npm run generate:direct

# 4. Review the changes
git diff

# 5. If satisfied, commit
git add .
git commit -m "Generated disable command"

# 6. If not satisfied, revert
git reset --hard HEAD
```

## Output Directory Structure

### Safe Mode (`generated/`):
```
codegen/generated/
├── cli/
│   ├── disable/
│   │   ├── Disable.definition.ts
│   │   └── localfile/
│   │       └── DisableLocalFile.ts
│   └── common/
│       └── LocalFileHandler.ts (if multiple actions)
├── sdk/
│   └── LocalFile.ts (unified resource file with all actions)
└── vsce/
    └── LocalFileCommandHandler.ts (updated with new commands)
```

### Direct Mode (packages):
```
packages/
├── cli/src/
│   ├── disable/
│   │   ├── Disable.definition.ts
│   │   └── localfile/
│   │       └── DisableLocalFile.ts
│   ├── common/
│   │   └── LocalFileHandler.ts (shared handler)
│   └── -strings-/
│       └── en.ts (automatically updated)
├── sdk/src/resources/
│   └── LocalFile.ts (updated with new functions)
└── vsce/src/commands/
    └── LocalFileCommandHandler.ts (updated with new methods)
```

## Comparison

| Feature | Safe Mode | Direct Mode |
|---------|-----------|-------------|
| **Output Location** | `codegen/generated/` | `packages/` |
| **Manual Steps** | Yes - copy & merge | Minimal - mostly automatic |
| **Risk** | Low - review first | Medium - overwrites/updates files |
| **Speed** | Slower | Faster |
| **Best For** | Learning, reviewing | Production, automation |
| **Undo** | Easy - just delete generated/ | Requires git revert |
| **File Merging** | Manual | Automatic (intelligent) |
| **Strings Update** | Manual | Automatic |

## Intelligent Merging in Direct Mode

Direct mode includes smart merging capabilities:

1. **SDK Functions**: Checks if a function already exists before adding it
2. **VSCE Methods**: Adds new command registration methods without duplicating
3. **Strings File**: Intelligently merges new resource strings into the main `en.ts` file
4. **Shared Handlers**: Generates shared handler files only if they don't exist

## Recommendations

### For New Commands:
Use **Direct Mode** (`npm run generate:direct`) - since there are no existing files to overwrite, it's safe and fast.

### For Adding Actions to Existing Resources:
Use **Direct Mode** - the intelligent merging will add new functions without affecting existing ones.

### For Modifying Existing Commands:
Use **Safe Mode** (`npm run generate`) - review changes carefully before merging.

### For Learning:
Use **Safe Mode** - you can explore the generated code without affecting the main codebase.

## Important Notes

1. **Always commit before using Direct Mode** - you can easily revert if something goes wrong
2. **Review git diff after Direct Mode** - make sure the changes are what you expected
3. **Direct Mode is intelligent** - it checks for existing functions/methods before adding
4. **Strings are auto-merged** - Direct Mode updates the main `en.ts` file automatically
5. **Shared handlers are preserved** - Existing handler files won't be overwritten

## Example: Adding DISABLE Command

### Using Safe Mode:
```bash
# 1. Add disable to commandSpecification.json
# 2. Generate
npm run generate

# 3. Review files
cat generated/cli/disable/Disable.definition.ts
cat generated/sdk/LocalFile.ts

# 4. Copy files manually
cp generated/cli/disable/Disable.definition.ts ../packages/cli/src/disable/
cp generated/cli/disable/localfile/DisableLocalFile.ts ../packages/cli/src/disable/localfile/

# 5. Manually merge SDK functions into LocalFile.ts
# 6. Manually merge strings into en.ts
# 7. Update VSCE handler registration
```

### Using Direct Mode:
```bash
# 1. Commit current work
git commit -am "Before disable generation"

# 2. Add disable to commandSpecification.json
# 3. Generate directly
npm run generate:direct

# 4. Review
git diff

# 5. Test and commit
npm test
git commit -am "Added disable command"
```

## Troubleshooting

### "Function already exists" message in Direct Mode:
- This is expected - Direct Mode skips existing functions
- The message confirms that your existing code is preserved
- Only new functions are added

### Generated code has errors:
- Check your commandSpecification.json for typos
- Verify the templates are correct
- Use Safe Mode to review before applying

### Need to undo Direct Mode changes:
```bash
git reset --hard HEAD  # Revert all changes
# or
git checkout -- path/to/file  # Revert specific file
```

### Strings not updating in Direct Mode:
- Ensure the group section exists in `en.ts`
- Check that the RESOURCES object exists for the group
- The generator will skip if the structure is not found

## Advanced Features

### Unified Resource Files
The generator creates unified resource files in the SDK that contain all actions for a resource:
- `LocalFile.ts` contains `openLocalFile()`, `closeLocalFile()`, `enableLocalFile()`, `disableLocalFile()`
- This reduces file proliferation and improves maintainability

### Shared Handlers
When multiple command groups use the same resource (e.g., LocalFile in open, close, enable, disable):
- A shared handler is generated in `cli/src/common/`
- The handler supports all actions for that resource
- Reduces code duplication across command groups

### Automatic String Management
Direct mode automatically:
- Adds new resource strings to the main `en.ts` file
- Preserves existing strings
- Updates group descriptions to include new resource types
- Maintains proper formatting and structure
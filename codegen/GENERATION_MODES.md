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
- When you need to merge changes carefully (e.g., VSCE handlers)
- When working on a shared codebase

### Workflow:
```bash
# 1. Edit commandSpecification.json
# 2. Generate code
cd codegen
npm run generate

# 3. Review generated files
ls -R generated/

# 4. Copy CLI files
cp generated/cli/disable/*.ts ../packages/cli/src/disable/

# 5. Merge SDK files
# Manually merge generated/sdk/disableLocalFile.ts into 
# ../packages/sdk/src/resources/LocalFile.ts

# 6. Merge VSCE files
# Manually merge generated/vsce/CICSLocalFileCommandHandler.ts into
# ../packages/vsce/src/commands/LocalFileCommandHandler.ts

# 7. Update strings
# Manually merge generated/cli/strings/disable.strings.ts into
# ../packages/cli/src/-strings-/en.ts
```

## Mode 2: Direct Mode (Automated) - `npm run generate:direct`

### How it works:
- Generates files **directly** into the packages directories
- Automatically creates/overwrites files in:
  - `packages/cli/src/{group}/`
  - `packages/sdk/src/resources/`
  - `packages/vsce/src/commands/`
- Fast - no manual copying needed

### When to use:
- When you trust the generator completely
- When you have committed all your changes (can revert if needed)
- When you want full automation
- When generating new commands that don't exist yet

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
│   │   └── DisableCICSLocalFile.ts
│   └── strings/
│       └── disable.strings.ts
├── sdk/
│   └── disableLocalFile.ts
└── vsce/
    └── CICSLocalFileCommandHandler.ts
```

### Direct Mode (packages):
```
packages/
├── cli/src/
│   ├── disable/
│   │   ├── Disable.definition.ts
│   │   └── localfile/
│   │       └── DisableLocalFile.ts
│   └── -strings-/
│       └── en.ts (updated)
├── sdk/src/resources/
│   └── LocalFile.ts (updated with disableLocalFile)
└── vsce/src/commands/
    └── LocalFileCommandHandler.ts (updated)
```

## Comparison

| Feature | Safe Mode | Direct Mode |
|---------|-----------|-------------|
| **Output Location** | `codegen/generated/` | `packages/` |
| **Manual Steps** | Yes - copy & merge | No - automatic |
| **Risk** | Low - review first | Medium - overwrites files |
| **Speed** | Slower | Faster |
| **Best For** | Learning, reviewing | Production, automation |
| **Undo** | Easy - just delete generated/ | Requires git revert |

## Recommendations

### For New Commands:
Use **Direct Mode** (`npm run generate:direct`) - since there are no existing files to overwrite, it's safe and fast.

### For Modifying Existing Commands:
Use **Safe Mode** (`npm run generate`) - review changes carefully before merging.

### For Shared Files (VSCE Handler, Strings):
Use **Safe Mode** - these files need careful merging as they contain multiple resources.

## Important Notes

1. **Always commit before using Direct Mode** - you can easily revert if something goes wrong
2. **Review git diff after Direct Mode** - make sure the changes are what you expected
3. **Safe Mode still requires manual work** - you need to merge shared files carefully
4. **Direct Mode may need manual fixes** - especially for shared files like LocalFileCommandHandler.ts

## Example: Adding DISABLE Command

### Using Safe Mode:
```bash
# 1. Add disable to commandSpecification.json
# 2. Generate
npm run generate

# 3. Copy files
cp generated/cli/disable/Disable.definition.ts ../packages/cli/src/disable/
cp generated/cli/disable/DisableCICSLocalFile.ts ../packages/cli/src/disable/localfile/

# 4. Merge disableLocalFile into LocalFile.ts
# 5. Merge strings into en.ts
# 6. Update LocalFileCommandHandler.ts
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

### "Files already exist" error in Direct Mode:
- This is expected - Direct Mode overwrites files
- Make sure you've committed your changes first
- Review the diff to ensure nothing important was lost

### Generated code has errors:
- Check your commandSpecification.json for typos
- Verify the templates are correct
- Use Safe Mode to review before applying

### Need to undo Direct Mode changes:
```bash
git reset --hard HEAD  # Revert all changes
# or
git checkout -- path/to/file  # Revert specific file
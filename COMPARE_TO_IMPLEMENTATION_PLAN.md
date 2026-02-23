# Resource Inspector "Compare to..." Feature Implementation Plan

## Overview
Add a "Compare to..." menu item to the Resource Inspector that allows users to compare the currently inspected resource with another resource from a different region.

## Current Architecture Understanding

### Existing Comparison Feature
- **Location**: `packages/vsce/src/commands/inspectTreeResourceCommand.ts`
- **Command**: `cics-extension-for-zowe.compareTreeResources`
- **How it works**: 
  - User selects 2 resources from the tree view
  - Validates both are the same resource type
  - Calls `showInspectResource()` with both resources
  - Resource Inspector displays them side-by-side

### Resource Inspector Architecture
- **View Provider**: `packages/vsce/src/trees/ResourceInspectorViewProvider.ts`
- **Actions System**: Uses `ResourceAction` class to define menu items
- **Action Registration**: Actions are registered per resource type in `packages/vsce/src/resources/actions/`
- **Action Handling**: `handleActionCommand()` in `ResourceInspectorUtils.ts` executes actions

### Region Selection Flow
- **Location**: `packages/vsce/src/commands/setCICSRegionCommand.ts`
- **Functions**: `getLastUsedRegion()` and `setCICSRegion()`
- **Flow**:
  1. Show profile picker
  2. Show CICSplex picker (if applicable)
  3. Show region picker (loads active regions dynamically)

## Implementation Plan

### 1. Create New Command File
**File**: `packages/vsce/src/commands/compareResourceCommand.ts`

**Purpose**: Handle the "Compare to..." flow from Resource Inspector

**Key Functions**:
```typescript
// Main command handler
export function getCompareResourceFromInspectorCommand(context: ExtensionContext)

// Helper to select region (reuse existing logic)
async function selectRegionForComparison(currentContext: IResourceContext)

// Helper to input resource name
async function selectResourceNameForComparison(resourceMeta: IResourceMeta, currentResourceName: string)

// Main comparison logic
async function compareResourceFromInspector(
  currentResource: IResourceInspectorResource,
  context: ExtensionContext
)
```

**Flow**:
1. Get current resource from Resource Inspector
2. Prompt user to select a region (profile → plex → region)
3. Prompt user to enter resource name
4. Fetch the second resource using `loadResources()`
5. Validate both resources are same type
6. Call `showInspectResource()` with both resources

### 2. Add Action to All Resource Types
**Files to modify**:
- `packages/vsce/src/resources/actions/ProgramActions.ts`
- `packages/vsce/src/resources/actions/TransactionActions.ts`
- `packages/vsce/src/resources/actions/LocalFileActions.ts`
- `packages/vsce/src/resources/actions/TSQueueActions.ts`
- `packages/vsce/src/resources/actions/ManagedRegionActions.ts`
- `packages/vsce/src/resources/actions/RegionActions.ts`

**Action Definition** (add to each file):
```typescript
{
  id: "CICS.Resource.COMPARE_TO",
  name: l10n.t("Compare to..."),
  resourceType: ResourceTypes.CICSProgram, // or appropriate type
  action: "cics-extension-for-zowe.compareResourceFromInspector",
  refreshResourceInspector: false, // Don't refresh, we're navigating away
}
```

### 3. Register Command
**File**: `packages/vsce/src/commands/index.ts`

Add import and registration:
```typescript
import { getCompareResourceFromInspectorCommand } from "./compareResourceCommand";

// In getCommands array:
getCompareResourceFromInspectorCommand(context),
```

### 4. Handle Action in Resource Inspector
**File**: `packages/vsce/src/trees/ResourceInspectorUtils.ts`

The existing `handleActionCommand()` already supports command strings, so no changes needed here. The action will automatically trigger our new command.

## Technical Details

### Region Selection Reuse
We can reuse the existing region selection logic from `setCICSRegionCommand.ts`:
- `getAllCICSProfiles()` - Get all profiles
- `getPlexInfoFromProfile()` - Get plexes for a profile
- `getRegionInfo()` - Get regions for a plex
- `getChoiceFromQuickPick()` - Show quick picker

### Resource Fetching
Use existing `loadResources()` function from `inspectResourceCommandUtils.ts`:
```typescript
const upToDateResource = await loadResources(
  [resourceMeta],
  resourceName,
  resourceContext
);
```

### Validation
- Ensure second resource is same type as first (use `meta.resourceName` comparison)
- Show error if resource not found
- Show error if types don't match

### Compare View
The existing `showInspectResource()` function already handles multiple resources:
```typescript
await showInspectResource(context, [
  { containedResource: resource1, ctx: context1 },
  { containedResource: resource2, ctx: context2 }
]);
```

## User Flow

1. User opens a resource in Resource Inspector (e.g., Program "PROG001" in Region "REG1")
2. User clicks "Compare to..." in the menu
3. System shows profile picker → user selects profile
4. System shows CICSplex picker (if applicable) → user selects plex
5. System shows region picker → user selects region (e.g., "REG2")
6. System shows input box → user enters resource name (e.g., "PROG001")
7. System fetches the second resource
8. System validates both are same type
9. System opens both resources in Resource Inspector side-by-side

## Error Handling

- **No resource selected**: Should not happen (action only visible when resource is open)
- **User cancels selection**: Gracefully exit at any step
- **Second resource not found**: Show error message with resource name and region
- **Different resource types**: Show error (though unlikely since user enters name)
- **Network/API errors**: Show error message with details

## Files to Create/Modify

### New Files
1. `packages/vsce/src/commands/compareResourceCommand.ts` - Main command implementation

### Modified Files
1. `packages/vsce/src/resources/actions/ProgramActions.ts` - Add compare action
2. `packages/vsce/src/resources/actions/TransactionActions.ts` - Add compare action
3. `packages/vsce/src/resources/actions/LocalFileActions.ts` - Add compare action
4. `packages/vsce/src/resources/actions/TSQueueActions.ts` - Add compare action
5. `packages/vsce/src/resources/actions/ManagedRegionActions.ts` - Add compare action
6. `packages/vsce/src/resources/actions/RegionActions.ts` - Add compare action
7. `packages/vsce/src/commands/index.ts` - Register new command

## Testing Checklist

- [ ] Action appears in Resource Inspector menu for all resource types
- [ ] Profile picker shows all available profiles
- [ ] CICSplex picker shows correctly (when applicable)
- [ ] Region picker shows active regions
- [ ] Resource name input validates length
- [ ] Second resource fetches successfully
- [ ] Error shown when resource not found
- [ ] Both resources display in compare view
- [ ] Can compare resources from same region
- [ ] Can compare resources from different regions
- [ ] Can compare resources from different plexes
- [ ] Can compare resources from different profiles
- [ ] Cancel at any step works correctly

## Future Enhancements (Out of Scope)

- Remember last compared region for quick access
- Show resource type in the input prompt
- Auto-suggest resource names based on partial input
- Compare more than 2 resources
- Diff highlighting in the compare view
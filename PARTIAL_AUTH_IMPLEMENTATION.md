# Partial Authorization Implementation

## Overview
This document describes the implementation of partial authorization handling in the CICS for Zowe Explorer VS Code extension.

## Background
When a user has partial authorization to CICS resources, the CMCI API returns:
- HTTP 200 status code
- Error code 1031 (NOTPERMIT) in the response
- Partial data containing only the resources the user is authorized to access

## Implementation Layers

### 1. SDK Layer (Already Implemented)
**File**: `packages/sdk/src/rest/CicsCmciRestClient.ts`

The SDK already detects partial authorization scenarios:
- Method `verifyResponseCodes()` checks for error code 1031
- If records exist despite the error, sets `apiResponse.partialResults = true`
- Logs debug message: "Partial results returned due to insufficient authorization"

### 2. Resource Container Layer (New Implementation)
**File**: `packages/vsce/src/resources/ResourceContainer.ts`

Added partial results tracking:
- New property: `hasPartialResults: boolean = false`
- Modified `ensureSummaries()`: Checks `apiResponse.partialResults` and sets the flag
- Modified `fetchRecordsForAllocations()`: Checks partial results from cache responses
- New getter method: `hasPartialAuthorizationResults()` returns the flag value

### 3. UI Layer (New Implementation)
**File**: `packages/vsce/src/trees/CICSResourceContainerNode.ts`

Added visual indicators and user notifications:
- Imports: Added `window` and `ThemeIcon` from vscode
- In `getChildren()` method after fetching resources:
  - Checks `this.fetcher.hasPartialAuthorizationResults()`
  - Shows warning message to user with resource type name
  - Updates tree item icon to warning icon (`ThemeIcon("warning")`)
  - Appends "(Partial Results)" to the description
  - Calls `updateDescription()` to refresh the UI

## User Experience

When partial authorization is detected:

1. **Warning Message**: A VS Code warning notification appears:
   ```
   "Partial authorization: Some {resources} could not be retrieved due to insufficient permissions. Only authorized {resources} are displayed."
   ```

2. **Visual Indicator**: The tree item shows:
   - ⚠️ Warning icon instead of the normal resource icon
   - "(Partial Results)" appended to the description

3. **Logging**: Debug logs show:
   - SDK layer: "Partial results returned due to insufficient authorization"
   - Resource container: Tracks the partial results flag

## Test Data

**WireMock Configuration**: `packages/vsce/__tests__/__e2e__/wiremock/mappings/MYREG3-PartialAuth.json`

Simulates partial authorization for MYPLEX3/MYREG3:
- Programs: Returns 2 authorized programs (PROG001, PROG002)
- Transactions: Returns 2 authorized transactions (TRN1, TRN2)
- Bundles: Returns 2 authorized bundles (BUND001, BUND002)
- All responses include error code 1031 with partial data

## Code Flow

```
User expands resource tree node
    ↓
CICSResourceContainerNode.getChildren()
    ↓
fetcher.fetchNextPage()
    ↓
ResourceContainer.fetchRecordsForAllocations()
    ↓
CicsCmciRestClient.getResources()
    ↓
CicsCmciRestClient.verifyResponseCodes()
    ↓ (detects error 1031 + records exist)
Sets apiResponse.partialResults = true
    ↓
ResourceContainer sets hasPartialResults = true
    ↓
CICSResourceContainerNode checks hasPartialAuthorizationResults()
    ↓
Shows warning message + updates icon + adds description
```

## Benefits

1. **User Awareness**: Users are immediately notified when they see partial results
2. **Visual Feedback**: Warning icon makes it obvious in the tree view
3. **No Data Loss**: Users still see the resources they can access
4. **Debugging**: Debug logs help troubleshoot authorization issues
5. **Graceful Degradation**: Extension continues to work with partial data

## Future Enhancements

Possible improvements:
- Add tooltip explaining partial authorization
- Provide link to documentation about CICS security
- Show count of accessible vs total resources (if available)
- Add setting to suppress warning messages
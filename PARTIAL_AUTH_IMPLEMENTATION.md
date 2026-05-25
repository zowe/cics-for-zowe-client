# Partial Authorization Implementation

## Overview
This document describes the implementation of partial authorization handling in the CICS for Zowe Explorer VS Code extension. The implementation supports partial authorization at both the resource level and the region level.

## Background
When a user has partial authorization to CICS resources or regions, the CMCI API returns:
- HTTP 200 status code
- Error code 1031 (NOTPERMIT) in the response
- Partial data containing only the resources/regions the user is authorized to access

## Implementation Layers

### 1. SDK Layer (Already Implemented)
**File**: `packages/sdk/src/rest/CicsCmciRestClient.ts`

The SDK already detects partial authorization scenarios:
- Method `verifyResponseCodes()` checks for error code 1031
- If records exist despite the error, sets `apiResponse.partialResults = true`
- Logs debug message: "Partial results returned due to insufficient authorization"

### 2. Profile Management Layer (Region-Level Support)
**File**: `packages/vsce/src/utils/profileManagement.ts`

Added partial authorization support for region queries:
- Modified `getRegionInfo()`: Returns `{ regions: any[], hasLimitedResults: boolean }`
- Checks if response code is not OK (1024) to detect limited results
- Sets `hasLimitedResults: true` when response code indicates partial/limited results (e.g., NOTPERMIT 1031)
- Modified `getRegionInfoInPlex()`: Wrapper that calls `getRegionInfo()` and returns the same structure

### 3. Resource Container Layer
**File**: `packages/vsce/src/resources/ResourceContainer.ts`

Added partial results tracking:
- New property: `hasPartialResults: boolean = false`
- Modified `ensureSummaries()`: Checks `apiResponse.partialResults` and sets the flag
- Modified `fetchRecordsForAllocations()`: Checks partial results from cache responses
- New getter method: `hasPartialAuthorizationResults()` returns the flag value

### 4. Regions Container Layer (Region-Level Support)
**File**: `packages/vsce/src/trees/CICSRegionsContainer.ts`

Added partial authorization tracking and user notifications for regions:
- New properties:
  - `hasLimitedResults: boolean = false`
  - `hasShownLimitedResultsWarning: boolean = false` (prevents duplicate warnings)
- Modified `loadRegionsInPlex()`:
  - Extracts `hasLimitedResults` from `getRegionInfoInPlex()` result
  - Shows warning message once when limited results are detected
  - Updates tree item icon to warning icon (`ThemeIcon("warning")`)
- Modified `filterRegions()`:
  - Checks for limited results after filtering
  - Shows warning message once when limited results are detected
  - Updates tree item icon to warning icon

### 5. UI Layer - Resource Level
**File**: `packages/vsce/src/trees/CICSResourceContainerNode.ts`

Added visual indicators and user notifications:
- New properties:
  - `hasLimitedResults: boolean = false`
  - `hasShownLimitedResultsWarning: boolean = false` (prevents duplicate warnings)
- In `getChildren()` method after fetching resources:
  - Checks `this.fetcher.hasLimitedResults()`
  - Shows warning message once per container
  - Updates tree item icon to warning icon (`ThemeIcon("warning")`)
- Modified `refreshIcon()`: Preserves warning icon when limited results are present
- Modified `buildDescription()`: Appends "(Limited Results)" to description when applicable

## User Experience

When partial authorization/limited results are detected:

1. **Warning Message**: A VS Code warning notification appears:
   ```
   "Limited results. Some resources couldn't be retrieved due to insufficient permissions."
   ```
   - Message is shown only once per resource container or regions container to avoid spam
   - Generic message works for all resource types and regions
   - Applies to both resource-level and region-level limited results

2. **Visual Indicator**: The tree item shows:
   - ⚠️ Warning icon instead of the normal resource/folder icon
   - Icon persists even when tree is collapsed/expanded
   - For resources: "(Limited Results)" appended to description

3. **Logging**: Debug logs show:
   - SDK layer: "Partial results returned due to insufficient authorization"
   - Resource container: Tracks the partial results flag
   - Profile management: Detects when regions have limited results (response code != 1024)

## Test Data

**WireMock Configuration**: `packages/vsce/__tests__/__e2e__/wiremock/mappings/MYREG3-PartialAuth.json`

Simulates partial authorization for MYPLEX3/MYREG3:
- Programs: Returns 2 authorized programs (PROG001, PROG002)
- Transactions: Returns 2 authorized transactions (TRN1, TRN2)
- Bundles: Returns 2 authorized bundles (BUND001, BUND002)
- All responses include error code 1031 with partial data

## Code Flow

### Resource-Level Partial Authorization
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
Shows warning message + updates icon (once per container)
```

### Region-Level Partial Authorization
```
User expands plex node or filters regions
    ↓
CICSRegionsContainer.loadRegionsInPlex() or filterRegions()
    ↓
ProfileManagement.getRegionInfoInPlex()
    ↓
ProfileManagement.getRegionInfo()
    ↓
runGetResource() calls CMCI API
    ↓
Response includes non-OK response code (e.g., 1031 NOTPERMIT) + partial region data
    ↓
Returns { regions: [...], hasLimitedResults: true }
    ↓
CICSRegionsContainer stores hasLimitedResults flag
    ↓
Shows warning message + updates icon (once per container)
    ↓
Regions displayed (only authorized ones)
```

## Benefits

1. **User Awareness**: Users are immediately notified when they see partial results
2. **Visual Feedback**: Warning icon makes it obvious in the tree view
3. **No Data Loss**: Users still see the resources/regions they can access
4. **Debugging**: Debug logs help troubleshoot authorization issues
5. **Graceful Degradation**: Extension continues to work with partial data
6. **Multi-Level Support**: Handles partial authorization at both resource and region levels
7. **No Spam**: Warning shown once per container to avoid notification fatigue

## Test Coverage

### Unit Tests
- `profileManagement.test.ts`: Tests for region-level partial auth handling
- `CICSRegionsContainer.unit.test.ts`: Tests for region container with partial auth
- `CICSResourceContainerNode.test.ts`: Tests for resource-level partial auth UI
- `setCICSRegionCommand.test.ts`: Tests for region selection with partial auth

### E2E Tests
- `partialAuth.spec.ts`: End-to-end tests for partial authorization scenarios
- WireMock mappings simulate CMCI responses with error code 1031

## Future Enhancements

Possible improvements:
- Add tooltip explaining partial authorization
- Provide link to documentation about CICS security
- Show count of accessible vs total resources (if available)
- Add setting to suppress warning messages
- Show limited results status in region description (similar to resources)
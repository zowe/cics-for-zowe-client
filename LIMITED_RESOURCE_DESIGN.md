# Authorized Resource Handling - Design Document

## Overview
This design document describes the implementation for handling CICS CMCI API responses with non-OK response codes (other than 1024). The implementation gracefully handles partial results and other error scenarios where the API returns data despite error codes.

**PR**: #654 - Authorised resource
**Issue**: #617
**Scope**: Handle all CMCI response codes, not just partial results (NOTPERMIT 1031)

## Problem Statement

When users interact with CICS resources through CICSPlex SM, they may encounter various response scenarios:

1. **Complete Results**: Response code 1024 (OK) with all data
2. **Partial Results**: Non-OK response code (e.g., 1031 NOTPERMIT, 1034 NOTAVAILABLE) but with partial data
3. **No Results**: Non-OK response code with NO data
4. **System Issues**: Non-OK response code (e.g., 1034 NOTAVAILABLE) with limited data

Previously, the extension would fail on any non-OK response code, even when partial data was available.

## Solution Architecture

### Core Principle
**If records exist in the response, display them to the user regardless of the response code.**

This allows users to:
- See resources they ARE authorized to access
- Continue working with available data
- Understand when they have limited access through visual indicators

---

## Response Code Handling Logic

### CMCI Response Codes (from CicsCmci.constants.ts)

| Code | Name | Description |
|------|------|-------------|
| 1024 | OK | Successful request |
| 1027 | NODATA | No data found (can be acceptable) |
| 1028 | INVALIDPARM | Invalid parameter |
| 1031 | NOTPERMIT | Not permitted (authorization issue) |
| 1034 | NOTAVAILABLE | Resource not available |
| 1041 | INVALIDDATA | Invalid data |

### Decision Flow

```
┌─────────────────────────────────────┐
│   CMCI API Response Received        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Parse XML Response                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Check: Does response have records?│
│   (records object with data)        │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
       YES           NO
        │             │
        ▼             ▼
┌──────────────┐  ┌──────────────────┐
│ Has Records  │  │  No Records      │
└──────┬───────┘  └────────┬─────────┘
       │                   │
       ▼                   ▼
┌──────────────────────┐  ┌──────────────────────┐
│ Check Response Code  │  │ Check Response Code  │
└──────┬───────────────┘  └────────┬─────────────┘
       │                           │
  ┌────┴────┐                 ┌────┴────┐
  │         │                 │         │
 OK      NOT OK              OK      NOT OK
  │         │                 │         │
  ▼         ▼                 ▼         ▼
┌────┐  ┌────────────┐    ┌────┐  ┌──────────┐
│Return│ │Set partial │    │Return│ │  Throw   │
│data  │ │Results=true│    │empty │ │  Error   │
└────┘  │Return data │    └────┘  └──────────┘
        │Show warning│
        └────────────┘
```

---

## Implementation Layers

### Layer 1: SDK - Response Code Verification
**File**: `packages/sdk/src/rest/CicsCmciRestClient.ts`

**Method**: `verifyResponseCodes(apiResponse, requestOptions)`

```typescript
// Pseudo-code logic
function verifyResponseCodes(apiResponse, requestOptions) {
  const okCodes = ['1024'];  // OK
  if (requestOptions?.failOnNoData === false) {
    okCodes.push('1027');  // NODATA acceptable
  }
  
  // STEP 1: Check if we have records
  if (apiResponse.response?.records && hasActualRecords(records)) {
    
    // STEP 2: If we have records but non-OK code
    if (!okCodes.includes(apiResponse.response.resultsummary.api_response1)) {
      // Set flag for partial results
      apiResponse.partialResults = true;
      
      // Log warning
      log.warn(`Returning partial results despite error code ${code}`);
      
      // Return data anyway
      return apiResponse;
    }
  }
  
  // STEP 3: If response code is OK, return (even without records)
  if (okCodes.includes(apiResponse.response.resultsummary.api_response1)) {
    return apiResponse;
  }
  
  // STEP 4: No records + error code = throw error
  throw new ImperativeError("CMCI request failed");
}
```

**Key Changes**:
- Checks for ANY records, not just specific error codes
- Sets `partialResults` flag when returning data despite errors
- Logs warning for debugging
- Throws error only when NO records AND error code

---

### Layer 2: Profile Management - Region Queries
**File**: `packages/vsce/src/utils/profileManagement.ts`

**Methods**: 
- `getRegionInfo()` - Returns `{ regions: any[], hasLimitedResults: boolean }`
- `getRegionInfoInPlex()` - Wrapper for plex queries

```typescript
// Pseudo-code
function getRegionInfo(session, parms) {
  const response = await runGetResource(session, parms);
  
  const regions = response.response?.records?.cicsmanagedregion || [];
  
  // Check if response code is NOT OK (1024)
  const responseCode = response.response?.resultsummary?.api_response1;
  const hasLimitedResults = responseCode !== '1024';
  
  return { regions, hasLimitedResults };
}
```

**Key Changes**:
- Returns structured object with both data and status
- Detects limited results by checking response code
- Works for both region and plex queries

---

### Layer 3: Resource Container - Resource Tracking
**File**: `packages/vsce/src/resources/ResourceContainer.ts`

**Properties**:
- `hasPartialResults: boolean = false`

**Methods**:
- `ensureSummaries()` - Checks `apiResponse.partialResults`
- `fetchRecordsForAllocations()` - Checks cache responses
- `hasPartialAuthorizationResults()` - Getter for flag

```typescript
// Pseudo-code
class ResourceContainer {
  private hasPartialResults = false;
  
  async ensureSummaries() {
    const response = await getResources(...);
    
    // Check if SDK flagged partial results
    if (response.partialResults) {
      this.hasPartialResults = true;
    }
  }
  
  async fetchRecordsForAllocations() {
    const response = await getCachedRecords(...);
    
    // Check cache response too
    if (response.partialResults) {
      this.hasPartialResults = true;
    }
  }
  
  hasPartialAuthorizationResults() {
    return this.hasPartialResults;
  }
}
```

---

### Layer 4: Regions Container - Region UI
**File**: `packages/vsce/src/trees/CICSRegionsContainer.ts`

**Properties**:
- `hasLimitedResults: boolean = false`
- `hasShownLimitedResultsWarning: boolean = false`

**Methods**:
- `loadRegionsInPlex()` - Loads regions and checks for limited results
- `filterRegions()` - Filters and checks for limited results

```typescript
// Pseudo-code
class CICSRegionsContainer {
  private hasLimitedResults = false;
  private hasShownLimitedResultsWarning = false;
  
  async loadRegionsInPlex() {
    const { regions, hasLimitedResults } = await getRegionInfoInPlex(...);
    
    this.hasLimitedResults = hasLimitedResults;
    
    // Show warning once
    if (hasLimitedResults && !this.hasShownLimitedResultsWarning) {
      vscode.window.showWarningMessage(
        "Limited results. Some regions couldn't be retrieved due to insufficient permissions."
      );
      this.hasShownLimitedResultsWarning = true;
      
      // Update icon to warning
      this.iconPath = new ThemeIcon("warning");
    }
    
    return regions;
  }
}
```

---

### Layer 5: Resource Container Node - Resource UI
**File**: `packages/vsce/src/trees/CICSResourceContainerNode.ts`

**Properties**:
- `hasLimitedResults: boolean = false`
- `hasShownLimitedResultsWarning: boolean = false`

**Methods**:
- `getChildren()` - Fetches resources and checks for limited results
- `refreshIcon()` - Preserves warning icon
- `buildDescription()` - Adds "(Limited Results)" text

```typescript
// Pseudo-code
class CICSResourceContainerNode {
  private hasLimitedResults = false;
  private hasShownLimitedResultsWarning = false;
  
  async getChildren() {
    await this.fetcher.fetchNextPage();
    
    // Check if fetcher has partial results
    if (this.fetcher.hasPartialAuthorizationResults()) {
      this.hasLimitedResults = true;
      
      // Show warning once
      if (!this.hasShownLimitedResultsWarning) {
        vscode.window.showWarningMessage(
          "Limited results. Some resources couldn't be retrieved due to insufficient permissions."
        );
        this.hasShownLimitedResultsWarning = true;
        
        // Update icon
        this.iconPath = new ThemeIcon("warning");
      }
    }
    
    return children;
  }
  
  buildDescription() {
    let desc = `${count} resources`;
    if (this.hasLimitedResults) {
      desc += " (Limited Results)";
    }
    return desc;
  }
}
```

---

## Complete Flow Diagrams

### Flow 1: Resource-Level Handling

```
┌─────────────────────────────────────────────────────────┐
│  User Action: Expand Resource Tree Node (e.g., Programs)│
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  CICSResourceContainerNode.getChildren()                │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  fetcher.fetchNextPage()                                │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  ResourceContainer.fetchRecordsForAllocations()         │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  CicsCmciRestClient.getResources()                      │
│  - Calls CMCI API                                       │
│  - Gets XML response                                    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  CicsCmciRestClient.verifyResponseCodes()               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Check: Has records?                             │  │
│  └───────────┬─────────────────────────────────────┘  │
│              │                                         │
│       ┌──────┴──────┐                                  │
│      YES            NO                                 │
│       │              │                                 │
│       ▼              ▼                                 │
│  ┌─────────┐   ┌──────────┐                           │
│  │Response │   │Response  │                           │
│  │Code OK? │   │Code OK?  │                           │
│  └────┬────┘   └─────┬────┘                           │
│       │              │                                 │
│   ┌───┴───┐      ┌───┴───┐                            │
│  YES     NO      YES     NO                            │
│   │       │       │       │                            │
│   ▼       ▼       ▼       ▼                            │
│ Return  Set     Return  Throw                          │
│ data    partial  empty   Error                         │
│         Results  data                                  │
│         =true                                          │
│         Return                                         │
│         data                                           │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  ResourceContainer checks apiResponse.partialResults    │
│  - If true: sets hasPartialResults = true               │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  CICSResourceContainerNode checks                       │
│  fetcher.hasPartialAuthorizationResults()               │
│                                                         │
│  If true:                                               │
│  1. Show warning message (once)                         │
│  2. Set icon to warning (⚠️)                            │
│  3. Add "(Limited Results)" to description              │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Display Resources in Tree View                         │
│  - Shows available resources                            │
│  - Warning icon visible                                 │
│  - Description shows limited results                    │
└─────────────────────────────────────────────────────────┘
```

### Flow 2: Region-Level Handling

```
┌─────────────────────────────────────────────────────────┐
│  User Action: Expand Plex Node or Filter Regions        │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  CICSRegionsContainer.loadRegionsInPlex()               │
│  or filterRegions()                                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  ProfileManagement.getRegionInfoInPlex()                │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  ProfileManagement.getRegionInfo()                      │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  runGetResource() - Calls CMCI API                      │
│  - Gets managed regions                                 │
│  - Response includes resultsummary with api_response1   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  SDK verifyResponseCodes() processes response           │
│  - Returns data if records exist (even with errors)     │
│  - Sets partialResults flag if needed                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  getRegionInfo() checks response code                   │
│                                                         │
│  const responseCode = response.resultsummary.api_response1│
│  const hasLimitedResults = (responseCode !== '1024')    │
│                                                         │
│  return { regions: [...], hasLimitedResults }           │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  CICSRegionsContainer receives result                   │
│  - Stores hasLimitedResults flag                        │
│                                                         │
│  If hasLimitedResults && !hasShownWarning:              │
│  1. Show warning message (once)                         │
│  2. Set icon to warning (⚠️)                            │
│  3. Set hasShownLimitedResultsWarning = true            │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Display Regions in Tree View                           │
│  - Shows available regions only                         │
│  - Warning icon on container                            │
│  - User can work with authorized regions                │
└─────────────────────────────────────────────────────────┘
```

---

## Scenarios and Examples

### Scenario 1: Partial Results (NOTPERMIT 1031)

**Context**: User has limited access - can see some programs but not all

**CMCI Response**:
```xml
<response>
  <resultsummary
    api_response1="1031"
    api_response1_alt="NOTPERMIT"
    api_response2="1345"
    api_response2_alt="USRID"
    recordcount="3" />
  <records>
    <cicsprogram name="PROG001" ... />
    <cicsprogram name="PROG002" ... />
    <cicsprogram name="PROG003" ... />
  </records>
</response>
```

**Behavior**:
1. SDK detects records exist despite error 1031
2. Sets `partialResults = true`
3. Returns data to extension
4. UI shows warning: "Limited results. Some resources couldn't be retrieved..."
5. Tree shows ⚠️ icon and "(Limited Results)" in description
6. User sees 3 programs they CAN access

---

### Scenario 2: No Results (Complete Failure)

**Context**: No data available due to permissions or other errors

**CMCI Response**:
```xml
<response>
  <resultsummary
    api_response1="1031"
    api_response1_alt="NOTPERMIT"
    recordcount="0" />
  <records></records>
</response>
```

**Behavior**:
1. SDK detects NO records with error 1031
2. Throws `ImperativeError`
3. Extension catches error
4. Shows error notification to user
5. Tree node shows error state

---

### Scenario 3: System Unavailability (NOTAVAILABLE 1034)

**Context**: CMAS is down but some cached data available

**CMCI Response**:
```xml
<response>
  <resultsummary 
    api_response1="1034" 
    api_response1_alt="NOTAVAILABLE"
    recordcount="5" />
  <records>
    <cicsmanagedregion name="REG1" ... />
    <cicsmanagedregion name="REG2" ... />
    ...
  </records>
</response>
```

**Behavior**:
1. SDK detects records exist despite error 1034
2. Sets `partialResults = true`
3. Returns available data
4. UI shows warning about limited results
5. User can work with available regions

---

### Scenario 4: Complete Results (OK 1024)

**Context**: All data successfully retrieved

**CMCI Response**:
```xml
<response>
  <resultsummary
    api_response1="1024"
    api_response1_alt="OK"
    recordcount="10" />
  <records>
    <cicsprogram name="PROG001" ... />
    ...
  </records>
</response>
```

**Behavior**:
1. SDK detects OK response
2. Returns data normally
3. No warnings shown
4. Normal icons displayed
5. User sees all 10 programs

---

## User Experience

### Visual Indicators

1. **Warning Icon** (⚠️):
   - Replaces normal folder/resource icon
   - Persists across collapse/expand
   - Indicates limited results

2. **Description Text**:
   - Resources: "5 Programs (Limited Results)"
   - Regions: Normal description (icon is sufficient)

3. **Warning Message**:
   - Shown once per container
   - Generic message for all scenarios
   - Non-intrusive notification

### Message Text

```
"Limited results. Some resources couldn't be retrieved due to insufficient permissions."
```

**Why this message?**
- Generic enough for all error scenarios
- Clear about the issue (permissions)
- Doesn't overwhelm with technical details
- Shown only once to avoid spam

---

## Test Coverage

### Unit Tests

1. **SDK Tests** (`CicsCmciRestClient.unit.test.ts`):
   - Test records with OK code → returns data
   - Test records with NOTPERMIT → returns data with partialResults flag
   - Test records with NOTAVAILABLE → returns data with partialResults flag
   - Test NO records with error code → throws error
   - Test empty records object → throws error

2. **Profile Management Tests** (`profileManagement.test.ts`):
   - Test region query with OK code → hasLimitedResults = false
   - Test region query with NOTPERMIT → hasLimitedResults = true
   - Test region query with NOTAVAILABLE → hasLimitedResults = true

3. **Container Tests** (`CICSResourceContainerNode.test.ts`, `CICSRegionsContainer.unit.test.ts`):
   - Test warning shown once
   - Test icon updated to warning
   - Test description includes "(Limited Results)"
   - Test flag persistence

### E2E Tests

**File**: `packages/vsce/__tests__/__e2e__/specs/partialAuth.spec.ts`

**Test Scenarios**:
1. Expand Programs with partial auth → shows warning and limited data
2. Expand Transactions with partial auth → shows warning and limited data
3. Expand Bundles with partial auth → shows warning and limited data
4. Expand Regions with partial auth → shows warning and limited regions
5. Expand resource with complete auth failure → shows error
6. Filter regions with partial auth → shows warning

### WireMock Test Data

**MYPLEX3/MYREG3** - Partial Results:
- Programs: 3 records with NOTPERMIT 1031
- Transactions: 4 records with NOTPERMIT 1031
- Bundles: 2 records with NOTPERMIT 1031
- Regions: 5 records with NOTPERMIT 1031

**MYPLEX4** - No Results (Complete Failure):
- Programs: 0 records with NOTPERMIT 1031
- Transactions: 0 records with NOTPERMIT 1031
- Regions: 0 records with NOTPERMIT 1031

---

## Benefits

1. **Graceful Degradation**: Extension works with partial results
2. **User Awareness**: Clear visual indicators of limited results
3. **No Data Loss**: Users see available data
4. **Debugging Support**: Logs help troubleshoot issues
5. **Consistent UX**: Same handling for all response scenarios
6. **No Spam**: Warnings shown once per container
7. **Flexible**: Handles any non-OK response code with data

---

## Future Enhancements

1. **Tooltip**: Add hover text explaining limited results
2. **Documentation Link**: Provide link to CICS security docs
3. **Count Display**: Show "3 of 10 programs" if total count available
4. **Settings**: Add option to suppress warnings
5. **Region Description**: Add "(Limited Results)" to region descriptions
6. **Retry Logic**: Allow user to retry with different credentials
7. **Detailed Errors**: Show specific error code in advanced mode

---

## Technical Notes

### Why Check for Records First?

The SDK prioritizes data availability over error codes because:
1. Partial results are better than no results
2. Users can still be productive with available data
3. CMCI API design returns HTTP 200 with error codes in body
4. Multiple error scenarios can return partial data (not just NOTPERMIT)

### Why Generic Warning Message?

A single generic message works because:
1. Avoids message fatigue from multiple warnings
2. User doesn't need to know specific error codes
3. The important info is: "you're seeing limited results"
4. Debug logs contain detailed error information

### Why Show Warning Once?

Showing the warning once per container prevents:
1. Notification spam during tree operations
2. User annoyance from repeated messages
3. Performance issues from excessive UI updates
4. Cluttered notification area

---

## Related Files

### SDK Layer
- `packages/sdk/src/rest/CicsCmciRestClient.ts` - Response verification
- `packages/sdk/src/constants/CicsCmci.constants.ts` - Response codes
- `packages/sdk/src/doc/ICMCIApiResponse.ts` - Response interface

### Extension Layer
- `packages/vsce/src/utils/profileManagement.ts` - Region queries
- `packages/vsce/src/resources/ResourceContainer.ts` - Resource tracking
- `packages/vsce/src/trees/CICSRegionsContainer.ts` - Region UI
- `packages/vsce/src/trees/CICSResourceContainerNode.ts` - Resource UI

### Test Files
- `packages/sdk/__tests__/__unit__/CicsCmciRestClient.unit.test.ts`
- `packages/vsce/__tests__/__unit__/utils/profileManagement.test.ts`
- `packages/vsce/__tests__/__unit__/trees/CICSRegionsContainer.unit.test.ts`
- `packages/vsce/__tests__/__unit__/trees/CICSResourceContainerNode.test.ts`
- `packages/vsce/__tests__/__e2e__/specs/partialAuth.spec.ts`

### WireMock Files
- `packages/vsce/__tests__/__e2e__/wiremock/mappings/MYREG3-PartialAuth.json`
- `packages/vsce/__tests__/__e2e__/wiremock/mappings/MYPLEX4-CompleteAuthFailure.json`
- `packages/vsce/__tests__/__e2e__/wiremock/__files/CICSProgram/MYREG3/`
- `packages/vsce/__tests__/__e2e__/wiremock/__files/CICSManagedRegion/`

---

## Changelog Entry

```markdown
- BugFix: Handles partial records, other than OK response codes and show informative error response. [#617](https://github.com/zowe/cics-for-zowe-client/issues/617)
```

---

## Summary

This implementation provides robust handling of all CMCI response scenarios, prioritizing data availability while keeping users informed about limited results. The solution is consistent across resource and region levels, with clear visual indicators and minimal user disruption.
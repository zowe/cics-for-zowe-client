# MYREG3 Partial Authorization Test Data

This directory contains WireMock test data for MYREG3 (part of MYPLEX3) demonstrating partial authorization scenarios across multiple CICS resource types.

## Overview

MYREG3 is configured to simulate a real-world scenario where users have **partial authorization** to view resources. This means:
- The CMCI API returns error code `1031 (NOTPERMIT)` with reason `1345 (USRID)`
- Despite the error, **partial data is still returned** in the response
- The SDK's `partialResults` flag is set to `true`
- The UI should display the available data with a warning message

## Test Scenario

**User**: Has limited security permissions in MYREG3  
**Behavior**: Can view some resources but not all due to RACF/security restrictions  
**Expected Result**: SDK returns partial data with warning flag instead of complete failure

## Resource Types with Partial Authorization Data

### 1. Programs (CICSProgram)
**File**: `CICSProgram/MYREG3/partial-auth-records.xml`
**Records Returned**: 3 programs (PROG001, PROG002, PROG003)
**Scenario**: User can see 3 out of potentially 100+ programs

```xml
<resultsummary api_response1="1031" api_response2="1345"
               api_response1_alt="NOTPERMIT" api_response2_alt="USRID"
               recordcount="3" />
```

**UI Display**:
```
⚠️ Programs [3 of ?] - Partial results due to authorization restrictions
├── PROG001 (ENABLED)
├── PROG002 (ENABLED)
└── PROG003 (DISABLED)
```

### 2. Transactions (CICSLocalTransaction)
**File**: `CICSTransaction/MYREG3/partial-auth-records.xml`
**Records Returned**: 4 transactions (TRN1, TRN2, TRN3, CEMT)
**Scenario**: User can see 4 out of potentially many transactions

```xml
<resultsummary api_response1="1031" api_response2="1345"
               recordcount="4" />
```

**UI Display**:
```
⚠️ Transactions [4 of ?] - Partial results
├── TRN1 (ENABLED)
├── TRN2 (ENABLED)
├── TRN3 (DISABLED)
└── CEMT (ENABLED)
```

### 3. Bundles (CICSBundle)
**File**: `CICSBundle/MYREG3/partial-auth-records.xml`
**Records Returned**: 2 bundles (BUNDLE01, BUNDLE02)
**Scenario**: User can see 2 out of potentially more bundles

```xml
<resultsummary api_response1="1031" api_response2="1345"
               recordcount="2" />
```

**UI Display**:
```
⚠️ Bundles [2 of ?] - Partial results
├── BUNDLE01 (ENABLED)
└── BUNDLE02 (DISABLED)
```

## WireMock Mappings

**File**: `mappings/MYREG3-PartialAuth.json`

### Cache-Based Request Flow (All Resources)

All resource types now use a **three-step cache-based request flow** with priority-based routing. This matches the actual behavior of the VS Code extension when fetching resources.

#### Request Flow Pattern

For each resource type, the extension makes these requests in order:

1. **Step 1: Summary Request** (Priority 1, 5, 9)
   - URL: `/CICSSystemManagement/{ResourceType}/MYPLEX3/MYREG3?SUMMONLY`
   - Response: `partial-auth-summary.xml`
   - Returns: OK (1024), recordcount, cachetoken
   - **Critical**: Summary MUST return OK to avoid SDK error

2. **Step 2: Cache Records Fetch** (Priority 3, 7, 11)
   - URL: `/CICSSystemManagement/CICSResultCache/{CACHETOKEN}/...`
   - Response: `partial-auth-cache-records.xml`
   - Returns: NOTPERMIT (1031) + actual records
   - SDK detects records + error → sets partialResults=true

3. **Step 3: Cache Removal** (Priority 2, 6, 10)
   - URL: `/CICSSystemManagement/CICSResultCache/{CACHETOKEN}?SUMMONLY`
   - Response: `partial-auth-remove-cache.xml`
   - Returns: OK (1024) - cleanup successful

4. **Fallback: Direct Request** (Priority 4, 8, 12)
   - URL: `/CICSSystemManagement/{ResourceType}/MYPLEX3/MYREG3`
   - Response: `partial-auth-records.xml`
   - Used if cache flow is not triggered

### Resource-Specific Mappings

#### Programs (Priority 1-4)
- Cache Token: `MYREG3PROGTOKEN`
- Records: 3 programs

#### Transactions (Priority 5-8)
- Cache Token: `MYREG3TRANTOKEN`
- Records: 4 transactions

#### Bundles (Priority 9-12)
- Cache Token: `MYREG3BUNDLETOKEN`
- Records: 2 bundles

### Response Files (Per Resource Type)

Each resource type has 4 response files:

1. **partial-auth-summary.xml**
   - Summary with OK (1024) response and cache token
   - No records, just metadata

2. **partial-auth-cache-records.xml**
   - Records with NOTPERMIT (1031) + actual data
   - This is where the partial authorization data lives

3. **partial-auth-remove-cache.xml**
   - Cache cleanup OK (1024) response
   - No records, just confirmation

4. **partial-auth-records.xml**
   - Direct request fallback with NOTPERMIT (1031) + data
   - Same data as cache-records, different access path

### Why This Pattern?

The cache-based flow is used by the VS Code extension for performance:
- Summary request is fast (no data transfer)
- Cache token allows pagination and filtering
- Cleanup prevents cache buildup on the CMCI server

**Key Insight**: The SDK's `verifyResponseCodes()` method throws an error if:
- Response has NO records AND
- Error code is not OK (1024)

By returning OK in the summary and NOTPERMIT in the cache records (which has data), we avoid the error and successfully return partial results.

## SDK Behavior

When the SDK receives these responses:

1. **Detects records are present** despite error code
2. **Sets `partialResults = true`** on the response object
3. **Logs a warning** to the console
4. **Returns the data** instead of throwing an error

```typescript
// SDK code in CicsCmciRestClient.ts
if (apiResponse.response?.records && Object.keys(apiResponse.response.records).length > 0) {
  if (!okResponse1Codes.includes(apiResponse.response?.resultsummary?.api_response1)) {
    apiResponse.partialResults = true;
    this.log.warn(`Returning partial results for error code ${api_response1}`);
  }
  return apiResponse;
}
```

## Consumer Code Example

```typescript
// In VS Code extension or CLI
const response = await runGetResource({
  profileName: 'myprofile',
  resourceName: CicsCmciConstants.CICS_PROGRAM_RESOURCE,
  cicsPlex: 'MYPLEX3',
  regionName: 'MYREG3'
});

if (response.partialResults) {
  // Show warning in UI
  vscode.window.showWarningMessage(
    `⚠️ Showing partial results - some ${resourceType} may be hidden due to authorization restrictions`
  );
  
  // Add warning icon to tree view
  treeItem.iconPath = new vscode.ThemeIcon('warning', 
    new vscode.ThemeColor('list.warningForeground'));
}

// Display the available data
displayResources(response.response.records);
```

## Comparison with Other Test Scenarios

| Scenario | Plex/Region | Error Code | Records | SDK Behavior | UI Display |
|----------|-------------|------------|---------|--------------|------------|
| **Normal** | MYPLEX1/MYREG1 | 1024 (OK) | Full data | Returns normally | Show all data |
| **Partial Auth** | MYPLEX3/MYREG3 | 1031 (NOTPERMIT) | Partial data | Returns with flag | Show data + warning |
| **No Auth** | MYPLEX4 | 1031 (NOTPERMIT) | No data | Throws error | Show error message |
| **Empty Records** | Any | 1031 (NOTPERMIT) | Empty `<records/>` | Throws error | Show error message |

## Testing Instructions

### 1. Start WireMock
```bash
cd packages/vsce/__tests__/__e2e__
docker-compose up wiremock
```

### 2. Test in VS Code Extension
1. Configure profile to use `MYPLEX3` and `MYREG3`
2. Expand the region in the CICS tree
3. Expand any resource type (Programs, Transactions, or Bundles)
4. **Expected**: See partial data with warning indicator
5. **Verify**: Console shows warning about partial results

### 3. Test Programmatically
```typescript
const response = await CicsCmciRestClient.getExpectParsedXml(
  session,
  '/CICSSystemManagement/CICSProgram/MYPLEX3/MYREG3',
  []
);

console.log(response.partialResults); // Should be true
console.log(response.response.records.cicsprogram.length); // Should be 3
```

## Real-World Use Cases

### Use Case 1: Production Environment with Strict Security
- **Scenario**: Production CICS regions with RACF security
- **Reality**: Users often have limited access to sensitive resources
- **Benefit**: Users can still see what they're authorized to view

### Use Case 2: Multi-Region Plex with Mixed Permissions
- **Scenario**: User has full access to DEV regions, partial to TEST, none to PROD
- **Reality**: Common in enterprise environments
- **Benefit**: Single interface works across all permission levels

### Use Case 3: Troubleshooting with Limited Access
- **Scenario**: Support team needs to investigate issues but has restricted access
- **Reality**: Can see enough to diagnose problems
- **Benefit**: Partial data is better than no data

## Future Enhancements

To add more resource types with partial authorization:

1. Create XML file in appropriate directory:
   ```
   CICS{ResourceType}/MYREG3/partial-auth-records.xml
   ```

2. Add mapping to `MYREG3-PartialAuth.json`:
   ```json
   {
     "name": "Get {ResourceType} for MYREG3 - Partial Auth",
     "request": {
       "urlPathPattern": "/CICSSystemManagement/{ResourceType}/MYPLEX3/MYREG3.*"
     },
     "response": {
       "bodyFileName": "{ResourceType}/MYREG3/partial-auth-records.xml"
     }
   }
   ```

3. Update this README with the new resource type

## Questions?

- **SDK Implementation**: See `packages/sdk/src/rest/CicsCmciRestClient.ts`
- **Response Interface**: See `packages/sdk/src/doc/ICMCIApiResponse.ts`
- **Constants**: See `packages/sdk/src/constants/CicsCmci.constants.ts`
- **VS Code Integration**: See `packages/vsce/src/utils/profileManagement.ts`
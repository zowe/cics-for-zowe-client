# WireMock Scenarios for Partial Authorization Testing

This document describes the WireMock test scenarios for partial authorization in CICS for Zowe Explorer.

## Overview

Two CICSPlex configurations are provided to test different authorization scenarios:

- **MYPLEX3**: Partial Authorization (some resources accessible)
- **MYPLEX4**: Complete Authorization Failure (no resources accessible)

## MYPLEX3 - Partial Authorization Scenario

**Purpose**: Simulate a user with partial authorization who can access some resources but not all.

**Behavior**: 
- API returns HTTP 200 with error code 1031 (NOTPERMIT)
- Response includes partial data (only authorized resources)
- Extension should display warning and show accessible resources

### Resource Types Configured

#### 1. Programs
- **Summary Request**: `/CICSSystemManagement/CICSProgram/MYPLEX3/MYREG3?...SUMMONLY...`
- **Response**: `CICSProgram/MYREG3/partial-auth-summary.xml`
- **Accessible Programs**: PROG001, PROG002 (2 out of many)
- **Cache Token**: MYREG3PROGTOKEN

#### 2. Transactions
- **Summary Request**: `/CICSSystemManagement/CICSTransaction/MYPLEX3/MYREG3?...SUMMONLY...`
- **Response**: `CICSTransaction/MYREG3/partial-auth-summary.xml`
- **Accessible Transactions**: TRN1, TRN2 (2 out of many)
- **Cache Token**: MYREG3TRANTOKEN

#### 3. Bundles
- **Summary Request**: `/CICSSystemManagement/CICSBundle/MYPLEX3/MYREG3?...SUMMONLY...`
- **Response**: `CICSBundle/MYREG3/partial-auth-summary.xml`
- **Accessible Bundles**: BUND001, BUND002 (2 out of many)
- **Cache Token**: MYREG3BUNDTOKEN

### Response Structure

Each response includes:
```xml
<resultsummary 
  api_response1="1031" 
  api_response1_alt="NOTPERMIT" 
  api_response2="0" 
  recordcount="2" 
  cachetoken="MYREG3XXXTOKEN"/>
<feedback>
  <error>
    <eyuda_code>1031</eyuda_code>
    <eyuda_message>NOTPERMIT</eyuda_message>
  </error>
</feedback>
<records>
  <!-- Partial data here -->
</records>
```

### Expected UI Behavior

When accessing MYPLEX3/MYREG3:
1. ⚠️ Warning icon displayed on resource tree items
2. Warning message shown: "Partial authorization: Some {resources} could not be retrieved..."
3. Description shows: "{Resource Type} [2 of 2] (Partial Results)"
4. Only authorized resources (PROG001, PROG002, etc.) are displayed

## MYPLEX4 - Complete Authorization Failure Scenario

**Purpose**: Simulate a user with no authorization to Programs.

**Behavior**:
- API returns HTTP 200 with error code 1031 (NOTPERMIT)
- Response includes NO data (recordcount="0")
- Extension should handle gracefully with appropriate error message

### Resource Types Configured

#### 1. Programs (Only Resource Type)
- **Summary Request**: `/CICSSystemManagement/CICSProgram/MYPLEX4/.*?...SUMMONLY...`
- **Response**: `CICSProgram/MYPLEX4/complete-auth-failure-summary.xml`
- **Records Request**: `/CICSSystemManagement/CICSProgram/MYPLEX4/.*?CRITERIA=.*`
- **Response**: `CICSProgram/MYPLEX4/complete-auth-failure-records.xml`
- **Accessible Programs**: None (0)

**Note**: Other resource types (Transactions, Bundles, etc.) are not configured for MYPLEX4. This allows testing complete authorization failure for a specific resource type while other resources may still be accessible through normal CICS operations.

### Response Structure

Each response includes:
```xml
<resultsummary 
  api_response1="1031" 
  api_response1_alt="NOTPERMIT" 
  api_response2="0" 
  recordcount="0" 
  displayed_recordcount="0"/>
<feedback>
  <error>
    <eyuda_code>1031</eyuda_code>
    <eyuda_message>NOTPERMIT</eyuda_message>
    <eyuda_reason>The user is not authorized to access any {resources}...</eyuda_reason>
  </error>
</feedback>
```

### Expected UI Behavior

When accessing MYPLEX4 Programs:
1. Error message displayed: "Not authorized to access programs"
2. No programs shown in tree
3. Appropriate error handling without crashes
4. Other resource types (Transactions, Bundles) will use default CICS behavior

## File Structure

```
wiremock/
├── mappings/
│   ├── MYREG3-PartialAuth.json              # MYPLEX3 mappings (12 endpoints)
│   └── MYPLEX4-CompleteAuthFailure.json     # MYPLEX4 mappings (2 endpoints - Programs only)
└── __files/
    ├── CICSProgram/
    │   ├── MYREG3/
    │   │   ├── partial-auth-summary.xml
    │   │   ├── partial-auth-cache-records.xml
    │   │   ├── partial-auth-remove-cache.xml
    │   │   └── partial-auth-records.xml
    │   └── MYPLEX4/
    │       ├── complete-auth-failure-summary.xml
    │       └── complete-auth-failure-records.xml
    ├── CICSTransaction/
    │   └── MYREG3/
    │       ├── partial-auth-summary.xml
    │       ├── partial-auth-cache-records.xml
    │       └── partial-auth-records.xml
    ├── CICSBundle/
    │   └── MYREG3/
    │       ├── partial-auth-summary.xml
    │       ├── partial-auth-cache-records.xml
    │       └── partial-auth-records.xml
    └── CICSManagedRegion/
        └── myplex3-notpermit-partial-auth-records.xml
```

## Testing Instructions

### Manual Testing

1. **Start WireMock**:
   ```bash
   cd packages/vsce/__tests__/__e2e__
   docker-compose up
   ```

2. **Configure Zowe Profile** for `wiremock_localhost` pointing to `http://localhost:8080`

3. **Test MYPLEX3 (Partial Auth)**:
   - Expand MYPLEX3 in tree
   - Expand MYREG3
   - Expand Programs/Transactions/Bundles
   - Verify warning icon and "(Partial Results)" text
   - Verify warning message appears
   - Verify only 2 resources shown for each type

4. **Test MYPLEX4 (Complete Failure for Programs)**:
   - Expand MYPLEX4 in tree
   - Expand any region
   - Expand Programs
   - Verify appropriate error handling
   - Verify no programs displayed
   - Note: Other resource types will use default CICS behavior

### Automated E2E Tests

Create tests in `packages/vsce/__tests__/__e2e__/specs/partialAuth.spec.ts`:

```typescript
test('should display partial authorization warning for MYPLEX3', async () => {
  // Expand MYPLEX3/MYREG3/Programs
  // Verify warning icon present
  // Verify "(Partial Results)" in description
  // Verify only 2 programs shown
});

test('should handle complete authorization failure for MYPLEX4', async () => {
  // Attempt to expand MYPLEX4
  // Verify error message
  // Verify no crash
});
```

## Key Implementation Details

### SDK Layer Detection
- `CicsCmciRestClient.verifyResponseCodes()` checks for error 1031
- If `recordcount > 0` despite error, sets `apiResponse.partialResults = true`

### Resource Container Tracking
- `ResourceContainer.hasPartialResults` flag tracks state
- `hasPartialAuthorizationResults()` getter exposes flag to UI

### UI Layer Display
- `CICSResourceContainerNode.hasPartialAuthResults` preserves state
- `buildDescription()` appends "(Partial Results)" text
- `refreshIcon()` preserves warning icon
- `window.showWarningMessage()` notifies user

## Troubleshooting

### Issue: Partial auth not detected
- Check SDK logs for "Partial results returned" message
- Verify XML response has both error 1031 AND recordcount > 0

### Issue: Warning not displayed
- Check `hasPartialAuthorizationResults()` returns true
- Verify `buildDescription()` is called after fetch
- Check browser console for errors

### Issue: Wrong resources shown
- Verify WireMock mapping priority (lower number = higher priority)
- Check URL patterns match actual requests
- Review WireMock logs for request matching

## References

- CMCI API Error Codes: https://www.ibm.com/docs/en/cics-ts/latest
- WireMock Documentation: http://wiremock.org/docs/
- Implementation Doc: `PARTIAL_AUTH_IMPLEMENTATION.md`
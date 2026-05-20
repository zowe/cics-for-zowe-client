# CICS Managed Region WireMock Test Files

This directory contains WireMock response files for testing CICS Managed Region scenarios.

## Files Overview

### Standard Success Responses

- **`records.xml`** - Standard successful response for MYPLEX1
  - Returns managed regions with `api_response1: 1024 (OK)`
  - Used for normal operation testing

- **`myplex2-records.xml`** - Standard successful response for MYPLEX2
  - Returns managed regions with `api_response1: 1024 (OK)`
  - Used for normal operation testing

### Error Scenarios

#### Partial Authorization (MYPLEX3)

- **`myplex3-notpermit-partial-auth-records.xml`** - NOTPERMIT with partial authorization
  - **Error Code**: `api_response1: 1031 (NOTPERMIT)`, `api_response2: 1345 (USRID)`
  - **Scenario**: User lacks full permissions but still receives partial data
  - **Records Returned**: 5 managed regions (MYREG3, MYREG4, MYREG5, MYREG6, MYREG7)
  - **Expected Behavior**: SDK accepts this as valid when records are present
  - **Use Case**: Testing partial authorization scenarios where users can see some data despite permission restrictions

#### Complete Authorization Failure (MYPLEX4)

- **`myplex4-notpermit-no-auth-records.xml`** - NOTPERMIT with complete authorization failure
  - **Error Code**: `api_response1: 1031 (NOTPERMIT)`, `api_response2: 1345 (USRID)`
  - **Scenario**: User has NO authorization to view any data
  - **Records Returned**: 0 managed regions (empty response)
  - **Expected Behavior**: SDK rejects this and throws an error
  - **Use Case**: Testing complete authorization failure where users cannot see any data due to insufficient permissions

## Error Scenario Details

### Comparison: Authorization Failure Scenarios

| Aspect | MYPLEX3 (Partial Auth) | MYPLEX4 (No Auth) | Program NOTPERMIT (Empty Records) |
|--------|------------------------|-------------------|-----------------------------------|
| Error Code | 1031 (NOTPERMIT) | 1031 (NOTPERMIT) | 1031 (NOTPERMIT) |
| Records Element | Present with data | Missing | Present but empty |
| Records Returned | 5 regions | 0 regions | 0 (empty object) |
| SDK Behavior | Accepts, sets `partialResults=true` | Rejects, throws error | Rejects, throws error |
| User Experience | Can view partial data with warning | Cannot view any data | Cannot view resource type |
| Use Case | Partial authorization to some regions | No authorization to plexes | No authorization to resource type (e.g., PROGRAM) |

### NOTPERMIT (1031) with Partial Authorization (MYPLEX3)

**Background:**
In CICS environments with complex security configurations, users may have partial authorization to view resources. This means they can see some data but don't have full access permissions.

**Response Characteristics:**
- `api_response1`: `1031` (NOTPERMIT)
- `api_response2`: `1345` (USRID) - User ID related authorization issue
- `api_response1_alt`: `"NOTPERMIT"`
- `api_response2_alt`: `"USRID"`
- `recordcount`: `5` (partial data is returned)

**SDK Handling:**
The SDK's `CicsCmciRestClient.verifyResponseCodes()` method returns records whenever they are present, regardless of error codes. This handles various scenarios including:
- Partial authorization (NOTPERMIT with some data)
- CMAS down scenarios (some regions unavailable)
- Other partial failure cases

When partial results are returned, the SDK sets a `partialResults` flag on the response:

```typescript
// If we have records, return them regardless of error codes
if (apiResponse.response?.records && Object.keys(apiResponse.response.records).length > 0) {
  // Check if there's an error code but we're returning data anyway
  if (!okResponse1Codes.includes(apiResponse.response?.resultsummary?.api_response1)) {
    // Set flag to indicate partial results
    apiResponse.partialResults = true;
    
    this.log.warn(
      `CMCI request returned error code ${apiResponse.response?.resultsummary?.api_response1} ` +
      `(${apiResponse.response?.resultsummary?.api_response1_alt}) but also returned records. ` +
      `Returning partial results.`
    );
  }
  return apiResponse;
}
```

**Using the `partialResults` Flag:**
Consumers of the SDK can check this flag to display warnings or different UI elements:

```typescript
const response = await Get.resource(session, {
  name: "CICSManagedRegion",
  regionName: "MYPLEX3"
});

if (response.partialResults) {
  // Show warning to user: "Partial results returned due to insufficient permissions"
  // Display data with warning indicator
} else {
  // Display data normally
}
```

**Related Code:**
- `packages/sdk/src/rest/CicsCmciRestClient.ts` - Response verification logic
- `packages/sdk/src/constants/CicsCmci.constants.ts` - Response code constants
- `packages/vsce/src/utils/profileManagement.ts` - Profile management and error handling

### NOTPERMIT (1031) with Complete Authorization Failure (MYPLEX4)

**Background:**
In CICS environments, users may have no authorization at all to view certain resources. This results in a NOTPERMIT error with no data returned.

**Response Characteristics:**
- `api_response1`: `1031` (NOTPERMIT)
- `api_response2`: `1345` (USRID) - User ID related authorization issue
- `api_response1_alt`: `"NOTPERMIT"`
- `api_response2_alt`: `"USRID"`
- `recordcount`: `0` (no data is returned)

**SDK Handling:**
The SDK's `CicsCmciRestClient.verifyResponseCodes()` method will reject this response and throw an error because no records are present:

```typescript
// Accept NOTPERMIT (1031) if records are present (partial authorization scenario)
if (apiResponse.response?.resultsummary?.api_response1 === `${CicsCmciConstants.RESPONSE_1_CODES.NOTPERMIT}` && apiResponse.response?.records) {
  return apiResponse; // This condition is NOT met when recordcount is 0
}
// Falls through to error handling
throw new ImperativeError(...);
```

## WireMock Mappings

The mapping configuration is in `packages/vsce/__tests__/__e2e__/wiremock/mappings/CICSManagedRegion.json`:

### MYPLEX3 - Partial Authorization
```json
{
  "name": "Get Managed Regions for MYPLEX3 - NOTPERMIT with Partial Authorization",
  "request": {
    "method": "GET",
    "url": "/CICSSystemManagement/CICSManagedRegion/MYPLEX3/"
  },
  "response": {
    "status": 200,
    "bodyFileName": "CICSManagedRegion/myplex3-notpermit-partial-auth-records.xml"
  }
}
```

### MYPLEX4 - Complete Authorization Failure
```json
{
  "name": "Get Managed Regions for MYPLEX4 - NOTPERMIT with Complete Authorization Failure",
  "request": {
    "method": "GET",
    "url": "/CICSSystemManagement/CICSManagedRegion/MYPLEX4/"
  },
  "response": {
    "status": 200,
    "bodyFileName": "CICSManagedRegion/myplex4-notpermit-no-auth-records.xml"
  }
}
```

## Testing These Scenarios

### Test Partial Authorization (MYPLEX3)

1. Start WireMock with the test configuration
2. Make a request to `/CICSSystemManagement/CICSManagedRegion/MYPLEX3/`
3. Verify that:
   - The response contains 5 managed region records
   - The SDK accepts the response despite the NOTPERMIT error
   - The application can display the partial data to the user

### Test Complete Authorization Failure (MYPLEX4)

1. Start WireMock with the test configuration
2. Make a request to `/CICSSystemManagement/CICSManagedRegion/MYPLEX4/`
3. Verify that:
   - The response contains 0 managed region records
   - The SDK rejects the response and throws an error
   - The application displays an appropriate error message to the user

## Future Maintenance

When updating or adding new error scenarios:

1. Use descriptive filenames that clearly indicate the error type
2. Add XML comments in the response files explaining the scenario
3. Update this README with the new scenario details
4. Add a descriptive "name" field in the WireMock mapping
5. Document the expected behavior and related code locations

## Questions?

If you need to recreate or understand these scenarios in the future, refer to:
- This README for scenario descriptions
- The XML file comments for technical details
- The related SDK code for implementation details
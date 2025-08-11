import { readFileSync } from "fs";
import { join } from "path";
import { BodyType, IWireMockResponse, MatchingAttributes, WireMock } from "wiremock-captain";

const wiremockFilesPath = join(__dirname, "..", "..", "__e2e__", "resources", "wiremock", "__files");

const buildResponseObj = (filename: string, status: number = 200): IWireMockResponse => {
  return {
    status,
    headers: { "Content-Type": "text/xml" },
    body: readFileSync(join(wiremockFilesPath, `${filename}.xml`)).toString()
  };
};

const buildEndpoint_getProgramsCacheToken = (regionName: string, plexName: string = "CICSEX61") => {
  return `/CICSSystemManagement/CICSProgram/${plexName}/${regionName}?CRITERIA=(NOT%20(PROGRAM%3DCEE*%20OR%20PROGRAM%3DDFH*%20OR%20PROGRAM%3DCJ*%20OR%20PROGRAM%3DEYU*%20OR%20PROGRAM%3DCSQ*%20OR%20PROGRAM%3DCEL*%20OR%20PROGRAM%3DIGZ*))&SUMMONLY&NODISCARD&OVERRIDEWARNINGCOUNT`;
};
const buildEndpoint_getResultCache = (resultCache: string, noDiscard: boolean = true) => {
  return `/CICSSystemManagement/CICSResultCache/${resultCache}${noDiscard ? "/1/250?NODISCARD" : "?SUMMONLY"}`;
};

export const mockPrograms = async (wiremock: WireMock) => {

  /**
   * Get all programs and put them in tree
   */
  await wiremock.register(
    {
      method: "GET",
      endpoint: buildEndpoint_getProgramsCacheToken("2PRGTST"),
    },
    buildResponseObj("fetch-resource-count-with-cachetoken"),
    {
      responseBodyType: BodyType.Body,
      scenario: {
        scenarioName: "Getting Programs",
        requiredScenarioState: "Started",
        newScenarioState: "Got program result cache"
      }
    }
  );
  await wiremock.register(
    {
      method: "GET",
      endpoint: buildEndpoint_getResultCache("E1033298F081A095"),
    },
    buildResponseObj("programs-with-default-filter"),
    {
      responseBodyType: BodyType.Body,
      scenario: {
        scenarioName: "Getting Programs",
        requiredScenarioState: "Got program result cache",
        newScenarioState: "Fetched program records"
      }
    }
  );
  await wiremock.register(
    {
      method: "GET",
      endpoint: buildEndpoint_getResultCache("E1033298F081A095", false),
    },
    buildResponseObj("fetch-resource-count"),
    {
      responseBodyType: BodyType.Body,
      scenario: {
        scenarioName: "Getting Programs",
        requiredScenarioState: "Fetched program records",
        newScenarioState: "Removed result cache"
      }
    }
  );
};

export const mockEnableDisableProgram = async (wiremock: WireMock) => {

  await mockPrograms(wiremock);

  /**
   * Disable program C128N
   */
  await wiremock.register(
    {
      method: "PUT",
      endpoint: "/CICSSystemManagement/CICSProgram/CICSEX61/2PRGTST?CRITERIA=(PROGRAM%3D'C128N')",
      body: "<request><action name=\"DISABLE\"/></request>"
    },
    buildResponseObj("response-for-disable-program"),
    {
      responseBodyType: BodyType.Body,
      requestBodyFeature: MatchingAttributes.EqualToXml,
      scenario: {
        scenarioName: "Disabling Programs",
        requiredScenarioState: "Started",
        newScenarioState: "Program is Disabled"
      }
    }
  );

  /**
   * Get disabled results
   */
  await wiremock.register(
    {
      method: "GET",
      endpoint: buildEndpoint_getProgramsCacheToken("2PRGTST"),
    },
    buildResponseObj("fetch-resource-count-with-cachetoken"),
    {
      responseBodyType: BodyType.Body,
      scenario: {
        scenarioName: "Disabling Programs",
        requiredScenarioState: "Program is Disabled",
        newScenarioState: "Got Disabled program result cache"
      }
    }
  );
  await wiremock.register(
    {
      method: "GET",
      endpoint: buildEndpoint_getResultCache("E1033298F081A095"),
    },
    buildResponseObj("program-with-disabled-status"),
    {
      responseBodyType: BodyType.Body,
      scenario: {
        scenarioName: "Disabling Programs",
        requiredScenarioState: "Got Disabled program result cache",
        newScenarioState: "Fetched Disabled program result cache"
      }
    }
  );
  await wiremock.register(
    {
      method: "GET",
      endpoint: buildEndpoint_getResultCache("E1033298F081A095", false),
    },
    buildResponseObj("fetch-resource-count"),
    {
      responseBodyType: BodyType.Body,
      scenario: {
        scenarioName: "Disabling Programs",
        requiredScenarioState: "Fetched Disabled program result cache",
        newScenarioState: "Removed Disabled result cache"
      }
    }
  );

  /**
   * Enable program C128N
   */
  await wiremock.register(
    {
      method: "PUT",
      endpoint: "/CICSSystemManagement/CICSProgram/CICSEX61/2PRGTST?CRITERIA=(PROGRAM%3D'C128N')",
      body: "<request><action name=\"ENABLE\"/></request>"
    },
    buildResponseObj("response-for-enable-program"),
    {
      responseBodyType: BodyType.Body,
      requestBodyFeature: MatchingAttributes.EqualToXml,
      scenario: {
        scenarioName: "Disabling Programs",
        requiredScenarioState: "Removed Disabled result cache",
        newScenarioState: "Program is Enabled"
      }
    }
  );

  /**
   * Get Enabled results
   */
  await wiremock.register(
    {
      method: "GET",
      endpoint: buildEndpoint_getProgramsCacheToken("2PRGTST"),
    },
    buildResponseObj("fetch-resource-count-with-cachetoken"),
    {
      responseBodyType: BodyType.Body,
      scenario: {
        scenarioName: "Disabling Programs",
        requiredScenarioState: "Program is Enabled",
        newScenarioState: "Got New Enabled program result cache"
      }
    }
  );
  await wiremock.register(
    {
      method: "GET",
      endpoint: buildEndpoint_getResultCache("E1033298F081A095"),
    },
    buildResponseObj("programs-with-default-filter"),
    {
      responseBodyType: BodyType.Body,
      scenario: {
        scenarioName: "Disabling Programs",
        requiredScenarioState: "Got New Enabled program result cache",
        newScenarioState: "Fetched New Enabled program records"
      }
    }
  );
  await wiremock.register(
    {
      method: "GET",
      endpoint: buildEndpoint_getResultCache("E1033298F081A095", false),
    },
    buildResponseObj("fetch-resource-count"),
    {
      stubPriority: 100,
      responseBodyType: BodyType.Body,
      scenario: {
        scenarioName: "Disabling Programs",
        requiredScenarioState: "Fetched New Enabled program records",
        newScenarioState: "Finished"
      }
    }
  );
};

export const mockFetchOneProgram = async (wiremock: WireMock, programName: string) => {
  await wiremock.register(
    {
      method: "GET",
      endpoint: `/CICSSystemManagement/CICSProgram/CICSEX61/2PRGTST?CRITERIA=(PROGRAM%3D${programName})&SUMMONLY&NODISCARD&OVERRIDEWARNINGCOUNT`
    },
    buildResponseObj("resource_inspector_mappings/fetch-selected-program-count-with-cachetoken"),
    { responseBodyType: BodyType.Body, }
  );
  await wiremock.register(
    {
      method: "GET",
      endpoint: buildEndpoint_getResultCache("E1033298F081A060")
    },
    buildResponseObj("resource_inspector_mappings/program-with-resource-inspector"),
    { responseBodyType: BodyType.Body, }
  );
  await wiremock.register(
    {
      method: "GET",
      endpoint: buildEndpoint_getResultCache("E1033298F081A060", false)
    },
    buildResponseObj("resource_inspector_mappings/fetch-selected-program-count"),
    { responseBodyType: BodyType.Body, }
  );
};
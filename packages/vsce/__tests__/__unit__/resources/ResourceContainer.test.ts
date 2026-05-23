/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 */

import { ILocalFile, IProgram } from "@zowe/cics-for-zowe-explorer-api";
import { LocalFileMeta, ProgramMeta } from "../../../src/doc";
import { ResourceContainer } from "../../../src/resources/ResourceContainer";
import { Resource } from "../../../src/resources/Resource";
import { getCacheMock, getResourceMock, profile } from "../../__mocks__";

const prog1: IProgram = {
  program: "PROG1",
  status: "ENABLED",
  eyu_cicsname: "MYREG",
  newcopycnt: "0",
  progtype: "PROGRAM",
  library: "MYLIB",
  librarydsn: "MYLIBDSN",
  usecount: "0",
  language: "COBOL",
  jvmserver: "EYUCMCIJ",
};
const prog2: IProgram = {
  program: "PROG2",
  status: "DISABLED",
  newcopycnt: "2",
  eyu_cicsname: "MYREG",
  progtype: "PROGRAM",
  library: "MYLIB",
  librarydsn: "MYLIBDSN",
  usecount: "0",
  language: "COBOL",
  jvmserver: "EYUCMCIJ",
};
const locFile1: ILocalFile = {
  browse: "",
  dsname: "A.B.C",
  enablestatus: "ENABLED",
  eyu_cicsname: "MYREG",
  file: "AS",
  keylength: "",
  openstatus: "OPEN",
  read: "",
  recordsize: "",
  vsamtype: "",
  update: "UPDATABLE",
  add: "ADDABLE",
  delete: "DELETABLE",
};

describe("Resource Container", () => {
  let container: ResourceContainer;

  beforeEach(() => {
    container = new ResourceContainer([ProgramMeta], {
      profileName: profile.name!,
      regionName: "MYREG",
    });

    getCacheMock.mockResolvedValue({
      response: {
        resultsummary: {
          recordcount: "2",
        },
        records: {
          cicsprogram: [prog1, prog2],
        },
      },
    });

    getResourceMock.mockResolvedValue({
      response: {
        resultsummary: {
          api_response1: "1024",
          cachetoken: "MYCACHETOKEN",
          recordcount: "2",
        },
      },
    });
  });

  it("creates resource container", () => {
    expect(container).toBeDefined();
  });

  it("should default values on instantiation", () => {
    expect(container.isCriteriaApplied()).toBeFalsy();
    expect(container.hasMore()).toBeFalsy();
  });

  it("should set criteria", async () => {
    expect(container.getCriteria(ProgramMeta)).toEqual(ProgramMeta.getDefaultCriteria());
    container.setCriteria(["a", "b"]);
    expect(container.getCriteria(ProgramMeta)).toEqual("PROGRAM=a OR PROGRAM=b");
  });

  it("should get region name", () => {
    expect(container.getRegionName()).toEqual("MYREG");
  });
  it("should get profile name", () => {
    expect(container.getProfileName()).toEqual("MYPROF");
  });
  it("should get plex name when not set", () => {
    expect(container.getPlexName()).toBeUndefined();
  });
  it("should get plex name when set", () => {
    container = new ResourceContainer([ProgramMeta], {
      profileName: profile.name!,
      cicsplexName: "MYPLEX",
      regionName: "MYREG",
    });
    expect(container.getPlexName()).toEqual("MYPLEX");
  });

  it("should ensure summaries", async () => {
    container = new ResourceContainer([ProgramMeta, LocalFileMeta], {
      profileName: profile.name!,
      cicsplexName: "MYPLEX",
      regionName: "MYREG",
    });

    expect(container.isCriteriaApplied()).toBeFalsy();

    getCacheMock
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            recordcount: "2",
          },
          records: {
            cicsprogram: [prog1, prog2],
          },
        },
      })
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            recordcount: "1",
          },
          records: {
            cicsprogram: [locFile1],
          },
        },
      });

    getResourceMock
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "MYCACHETOKEN",
            recordcount: "2",
          },
        },
      })
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "MYCACHETOKEN2",
            recordcount: "1",
          },
        },
      });

    const res = await container.fetchNextPage();

    expect(res).toHaveLength(3);
  });

  it("should reset container and discard cache tokens", async () => {
    await container.fetchNextPage();
    expect(getResourceMock).toHaveBeenCalled();
    expect(getCacheMock).toHaveBeenCalled();
    const initialGetCacheCallCount = getCacheMock.mock.calls.length;
    await container.reset();

    // Verify cache token was discarded - getCacheMock should be called
    // and parameters including nodiscard: false and summonly: true
    const resetCalls = getCacheMock.mock.calls.slice(initialGetCacheCallCount);
    expect(resetCalls.length).toBeGreaterThan(0);

    // Check that at least one call has nodiscard: false and summonly: true
    const discardCall = resetCalls.find((call) => {
      const params = call[1];
      return params && params.nodiscard === false && params.summonly === true;
    });
    expect(discardCall).toBeDefined();
    expect(container.hasMore()).toBeFalsy();
    getCacheMock.mockClear();
    getResourceMock.mockClear();

    await container.fetchNextPage();
    // Should call getResource again to get new summaries
    expect(getResourceMock).toHaveBeenCalled();
  });

  it("should handle ensureSummaries early return when summaries already exist", async () => {
    // First call to populate summaries
    await container.fetchNextPage();
    
    const getResourceCallCount = getResourceMock.mock.calls.length;
    
    // Call ensureSummaries again - should return early
    await container.fetchNextPage();
    
    // getResourceMock should not be called again since summaries exist
    expect(getResourceMock.mock.calls.length).toBe(getResourceCallCount);
  });

  it("should handle getAvailableResourceTypes with no summary", async () => {
    const containerWithMultipleTypes = new ResourceContainer([ProgramMeta, LocalFileMeta], {
      profileName: profile.name!,
      regionName: "MYREG",
    });

    // Mock one resource type with summary and one with zero records
    getResourceMock
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "TOKEN1",
            recordcount: "2",
          },
        },
      })
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "TOKEN2",
            recordcount: "0", // Zero records for second type
          },
        },
      });

    getCacheMock.mockResolvedValue({
      response: {
        resultsummary: {
          recordcount: "2",
        },
        records: {
          cicsprogram: [prog1, prog2],
        },
      },
    });

    await containerWithMultipleTypes.fetchNextPage();
    
    // Should still work with partial summaries
    expect(containerWithMultipleTypes.hasMore()).toBe(false);
  });

  it("should handle fetchRecordsForAllocations with zero count allocation", async () => {
    const containerMulti = new ResourceContainer([ProgramMeta, LocalFileMeta], {
      profileName: profile.name!,
      cicsplexName: "MYPLEX",
      regionName: "MYREG",
    });

    getResourceMock
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "TOKEN1",
            recordcount: "0", // Zero records
          },
        },
      })
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "TOKEN2",
            recordcount: "2",
          },
        },
      });

    getCacheMock.mockResolvedValue({
      response: {
        resultsummary: {
          recordcount: "2",
        },
        records: {
          cicslocalfile: [locFile1],
        },
      },
    });

    const results = await containerMulti.fetchNextPage();
    
    // Should only get results from the type with records
    expect(results.length).toBeGreaterThan(0);
  });

  it("should skip allocations with count <= 0 in fetchRecordsForAllocations", async () => {
    // Create a container that will result in zero allocation for one type
    const containerMulti = new ResourceContainer([ProgramMeta, LocalFileMeta], {
      profileName: profile.name!,
      cicsplexName: "MYPLEX",
      regionName: "MYREG",
    });

    // Mock with very small page size scenario where one type gets 0 allocation
    getResourceMock
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "TOKEN1",
            recordcount: "1", // Very small count
          },
        },
      })
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "TOKEN2",
            recordcount: "100", // Large count
          },
        },
      });

    getCacheMock.mockResolvedValue({
      response: {
        resultsummary: {
          recordcount: "100",
        },
        records: {
          cicslocalfile: [locFile1],
        },
      },
    });

    const results = await containerMulti.fetchNextPage();
    
    // Should get results even though one allocation might be 0
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });

  it("should handle fetchNextPage when no available resources", async () => {
    const emptyContainer = new ResourceContainer([ProgramMeta], {
      profileName: profile.name!,
      regionName: "MYREG",
    });

    getResourceMock.mockResolvedValue({
      response: {
        resultsummary: {
          api_response1: "1024",
          cachetoken: "TOKEN",
          recordcount: "0", // No records
        },
      },
    });

    const results = await emptyContainer.fetchNextPage();
    
    expect(results).toEqual([]);
    expect(emptyContainer.hasMore()).toBeFalsy();
  });

  it("should handle fetchNextPage error in ensureSummaries", async () => {
    const errorContainer = new ResourceContainer([ProgramMeta], {
      profileName: profile.name!,
      regionName: "MYREG",
    });

    const error = new Error("CMCI Error");
    getResourceMock.mockRejectedValue(error);

    const results = await errorContainer.fetchNextPage();
    
    // Should return empty array after error handling
    expect(results).toEqual([]);
  });

  it("should handle reset with cache discard error", async () => {
    await container.fetchNextPage();
    
    // Mock cache discard to fail
    getCacheMock.mockRejectedValueOnce(new Error("Cache discard failed"));
    
    // Should not throw error
    await expect(container.reset()).resolves.not.toThrow();
    
    // Container should still be reset
    expect(container.hasMore()).toBeFalsy();
  });

  it("should handle reset when no cache tokens exist", async () => {
    const freshContainer = new ResourceContainer([ProgramMeta], {
      profileName: profile.name!,
      regionName: "MYREG",
    });

    const getCacheCallCount = getCacheMock.mock.calls.length;
    
    // Reset without fetching anything first
    await freshContainer.reset();
    
    // Should not call getCacheMock since no tokens to discard
    expect(getCacheMock.mock.calls.length).toBe(getCacheCallCount);
  });

  it("should test reduceSummary method", async () => {
    await container.fetchNextPage();
    
    const initialProgress = container.getProgress();
    
    // Reduce summary count
    container.reduceSummary(ProgramMeta, 1);
    
    const newProgress = container.getProgress();
    
    // Progress should reflect reduced count
    expect(newProgress).not.toEqual(initialProgress);
    expect(container.hasMore()).toBeDefined();
  });

  it("should handle resetCriteria with parent resource", () => {
    const parentResource = new Resource<IProgram>(prog1);
    const containerWithParent = new ResourceContainer(
      [ProgramMeta],
      {
        profileName: profile.name!,
        regionName: "MYREG",
      },
      parentResource
    );

    containerWithParent.resetCriteria();
    
    expect(containerWithParent.isCriteriaApplied()).toBeFalsy();
    expect(containerWithParent.getCriteria(ProgramMeta)).toBeDefined();
  });

  it("should handle setCriteria with parent resource", () => {
    const parentResource = new Resource<IProgram>(prog1);
    const containerWithParent = new ResourceContainer(
      [ProgramMeta],
      {
        profileName: profile.name!,
        regionName: "MYREG",
      },
      parentResource
    );

    containerWithParent.setCriteria(["TEST1", "TEST2"]);
    
    expect(containerWithParent.isCriteriaApplied()).toBeTruthy();
    expect(containerWithParent.getCriteria(ProgramMeta)).toContain("TEST1");
  });

  it("should handle getProgress with multiple resource types", async () => {
    const multiContainer = new ResourceContainer([ProgramMeta, LocalFileMeta], {
      profileName: profile.name!,
      cicsplexName: "MYPLEX",
      regionName: "MYREG",
    });

    getResourceMock
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "TOKEN1",
            recordcount: "5",
          },
        },
      })
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "TOKEN2",
            recordcount: "3",
          },
        },
      });

    getCacheMock
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            recordcount: "5",
          },
          records: {
            cicsprogram: [prog1, prog2],
          },
        },
      })
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            recordcount: "3",
          },
          records: {
            cicslocalfile: [locFile1],
          },
        },
      });

    await multiContainer.fetchNextPage();
    
    const progress = multiContainer.getProgress();
    
    expect(progress).toBeDefined();
    expect(progress).toContain("of");
  });

  it("should handle continue in getAvailableResourceTypes when summary is missing", async () => {
    // This test covers line 120-121: the continue statement when !summary
    const containerMulti = new ResourceContainer([ProgramMeta, LocalFileMeta], {
      profileName: profile.name!,
      cicsplexName: "MYPLEX",
      regionName: "MYREG",
    });

    // First call succeeds for ProgramMeta
    getResourceMock.mockResolvedValueOnce({
      response: {
        resultsummary: {
          api_response1: "1024",
          cachetoken: "TOKEN1",
          recordcount: "5",
        },
      },
    });

    // Second call fails for LocalFileMeta - this will cause ensureSummaries to not set a summary for it
    getResourceMock.mockRejectedValueOnce(new Error("CMCI Error"));

    getCacheMock.mockResolvedValue({
      response: {
        resultsummary: {
          recordcount: "5",
        },
        records: {
          cicsprogram: [prog1, prog2],
        },
      },
    });

    // fetchNextPage will call ensureSummaries which will fail for LocalFileMeta
    // Then getAvailableResourceTypes will encounter !summary for LocalFileMeta and continue
    const results = await containerMulti.fetchNextPage();
    
    // Should still get results from ProgramMeta even though LocalFileMeta failed
    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  });

  it("should handle continue in fetchRecordsForAllocations when count is zero or negative", async () => {
    // This test covers line 175-176: the continue statement when count <= 0
    const containerMulti = new ResourceContainer([ProgramMeta, LocalFileMeta], {
      profileName: profile.name!,
      cicsplexName: "MYPLEX",
      regionName: "MYREG",
    });

    // Set up so that one resource type gets 0 allocation
    // ProgramMeta has 0 records, LocalFileMeta has many
    getResourceMock
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "TOKEN1",
            recordcount: "0", // Zero records means 0 allocation
          },
        },
      })
      .mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "TOKEN2",
            recordcount: "100",
          },
        },
      });

    getCacheMock.mockResolvedValue({
      response: {
        resultsummary: {
          recordcount: "100",
        },
        records: {
          cicslocalfile: [locFile1],
        },
      },
    });

    // When fetchRecordsForAllocations is called, ProgramMeta will have count=0
    // and will hit the continue statement at line 175-176
    const results = await containerMulti.fetchNextPage();
    
    // Should get results only from LocalFileMeta
    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);
    // Verify we got LocalFile results, not Program results
    expect(results[0].meta).toBe(LocalFileMeta);
  });

  describe("Partial Authorization Tests", () => {
    it("should detect partial results from ensureSummaries", async () => {
      container = new ResourceContainer([ProgramMeta], {
        profileName: profile.name!,
        regionName: "MYREG",
      });

      getResourceMock.mockResolvedValue({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "MYCACHETOKEN",
            recordcount: "2",
          },
        },
        partialResults: true, // SDK sets this flag
      });

      await container.fetchNextPage();

      expect(container.hasPartialAuthorizationResults()).toBeTruthy();
    });

    it("should detect partial results from cache", async () => {
      container = new ResourceContainer([ProgramMeta], {
        profileName: profile.name!,
        regionName: "MYREG",
      });

      getResourceMock.mockResolvedValue({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "MYCACHETOKEN",
            recordcount: "2",
          },
        },
      });

      getCacheMock.mockResolvedValue({
        response: {
          resultsummary: {
            recordcount: "2",
          },
          records: {
            cicsprogram: [prog1, prog2],
          },
        },
        partialResults: true, // SDK sets this flag on cache response
      });

      await container.fetchNextPage();

      expect(container.hasPartialAuthorizationResults()).toBeTruthy();
    });

    it("should not flag partial results when not present", async () => {
      container = new ResourceContainer([ProgramMeta], {
        profileName: profile.name!,
        regionName: "MYREG",
      });

      getResourceMock.mockResolvedValue({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "MYCACHETOKEN",
            recordcount: "2",
          },
        },
        partialResults: false,
      });

      getCacheMock.mockResolvedValue({
        response: {
          resultsummary: {
            recordcount: "2",
          },
          records: {
            cicsprogram: [prog1, prog2],
          },
        },
        partialResults: false,
      });

      await container.fetchNextPage();

      expect(container.hasPartialAuthorizationResults()).toBeFalsy();
    });

    it("should maintain partial results flag across multiple fetches", async () => {
      container = new ResourceContainer([ProgramMeta], {
        profileName: profile.name!,
        regionName: "MYREG",
      });

      // First fetch with partial results
      getResourceMock.mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "MYCACHETOKEN",
            recordcount: "4",
          },
        },
        partialResults: true,
      });

      getCacheMock.mockResolvedValueOnce({
        response: {
          resultsummary: {
            recordcount: "4",
            displayed_recordcount: "2",
          },
          records: {
            cicsprogram: [prog1, prog2],
          },
        },
        partialResults: true,
      });

      await container.fetchNextPage();
      expect(container.hasPartialAuthorizationResults()).toBeTruthy();

      // Second fetch (pagination) - partial results should persist
      getCacheMock.mockResolvedValueOnce({
        response: {
          resultsummary: {
            recordcount: "4",
            displayed_recordcount: "2",
          },
          records: {
            cicsprogram: [prog1, prog2],
          },
        },
      });

      await container.fetchNextPage();
      expect(container.hasPartialAuthorizationResults()).toBeTruthy();
    });

    it("should reset partial results flag on container reset", async () => {
      container = new ResourceContainer([ProgramMeta], {
        profileName: profile.name!,
        regionName: "MYREG",
      });

      getResourceMock.mockResolvedValue({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "MYCACHETOKEN",
            recordcount: "2",
          },
        },
        partialResults: true,
      });

      await container.fetchNextPage();
      expect(container.hasPartialAuthorizationResults()).toBeTruthy();

      await container.reset();
      expect(container.hasPartialAuthorizationResults()).toBeFalsy();
    });

    it("should handle multiple resource types with partial results", async () => {
      container = new ResourceContainer([ProgramMeta, LocalFileMeta], {
        profileName: profile.name!,
        cicsplexName: "MYPLEX",
        regionName: "MYREG",
      });

      // Programs with partial results
      getResourceMock.mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "MYCACHETOKEN",
            recordcount: "2",
          },
        },
        partialResults: true,
      });

      getCacheMock.mockResolvedValueOnce({
        response: {
          resultsummary: {
            recordcount: "2",
          },
          records: {
            cicsprogram: [prog1, prog2],
          },
        },
        partialResults: true,
      });

      // Local files without partial results
      getResourceMock.mockResolvedValueOnce({
        response: {
          resultsummary: {
            api_response1: "1024",
            cachetoken: "MYCACHETOKEN2",
            recordcount: "1",
          },
        },
      });

      getCacheMock.mockResolvedValueOnce({
        response: {
          resultsummary: {
            recordcount: "1",
          },
          records: {
            cicslocalfile: [locFile1],
          },
        },
      });

      await container.fetchNextPage();

      // Should flag partial results if ANY resource type has partial results
      expect(container.hasPartialAuthorizationResults()).toBeTruthy();
    });
  });
});



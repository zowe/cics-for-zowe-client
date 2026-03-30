# Unit Testing Guide - Path to 100% Coverage

## 📊 Current Coverage Status (Updated March 26, 2026)

### Package Coverage Summary
- **CLI Package**: 100% 🎉 (PERFECT - All metrics at 100%!)
- **SDK Package**: 100% 🎉 (PERFECT - All metrics at 100%!)
- **API Package**: 100% 🎉 (PERFECT - All metrics at 100%!)
- **VSCE Package**: 64.08% ⚠️ (Needs Improvement)

### Overall Project: ~91% Average Coverage (Improved!)

### 🎊 Three Packages at Perfect Coverage! 🎊

#### CLI Package Detailed Coverage 🎉
- **Statement**: 100% ✅ (Perfect!)
- **Branch**: 100% ✅ (Improved from 75% → +25%)
- **Function**: 100% ✅ (Perfect!)
- **Line**: 100% ✅ (Perfect!)
- **Test Suites**: 65 passing
- **Total Tests**: 121 passing
- **Status**: 🎉 **PERFECT 100% COVERAGE ACHIEVED!** 🎉

#### SDK Package Detailed Coverage 🎉
- **Statement**: 100% ✅ (Perfect!)
- **Branch**: 100% ✅ (Perfect!)
- **Function**: 100% ✅ (Perfect!)
- **Line**: 100% ✅ (Perfect!)
- **Test Suites**: 31 passing
- **Total Tests**: 358 passing
- **Status**: 🎉 **PERFECT 100% COVERAGE ACHIEVED!** 🎉

#### API Package Detailed Coverage 🎉
- **Statement**: 100% ✅ (Perfect!)
- **Branch**: 100% ✅ (Perfect!)
- **Function**: 100% ✅ (Perfect!)
- **Line**: 100% ✅ (Perfect!)
- **Test Suites**: 3 passing
- **Total Tests**: 47 passing
- **Status**: 🎉 **PERFECT 100% COVERAGE ACHIEVED!** 🎉

---

## 🎯 Roadmap to 100% Coverage

### Phase 1: VSCE Commands (Priority: HIGH)
**Target**: Increase from 32.95% to 95%+
**Estimated**: ~200 test cases, 15-20 hours

### Phase 2: VSCE Utils (Priority: HIGH)
**Target**: Increase from 70% to 95%+
**Estimated**: ~100 test cases, 8-10 hours

### Phase 3: VSCE Trees (Priority: MEDIUM)
**Target**: Increase from 71% to 95%+
**Estimated**: ~80 test cases, 6-8 hours

### Phase 4: Branch Coverage (Priority: MEDIUM)
**Target**: Increase all packages to 90%+
**Estimated**: ~150 test cases, 10-12 hours

### Phase 5: Final Polish (Priority: LOW)
**Target**: Achieve 100% across all metrics
**Estimated**: ~50 test cases, 4-6 hours

---

## 📝 Test File Templates

### Recent CLI Package Test Examples ✅

The CLI package now has excellent test coverage. Use these as reference examples:

#### Example 1: CicsBaseHandler Test
**File**: `packages/cli/__tests__/__unit__/CicsBaseHandler.unit.test.ts`
- Tests abstract base class implementation
- Mocks session creation
- Tests error handling and progress bars
- Coverage: 100%

#### Example 2: Handler Tests (Define/Delete/Install/Refresh)
**Files**:
- `packages/cli/__tests__/__unit__/define/Program.handler.unit.test.ts`
- `packages/cli/__tests__/__unit__/delete/Program.handler.unit.test.ts`
- `packages/cli/__tests__/__unit__/install/Program.handler.unit.test.ts`
- `packages/cli/__tests__/__unit__/refresh/Program.handler.unit.test.ts`

**Key Features**:
- Comprehensive SDK function mocking
- Tests for all parameters (required and optional)
- Error scenario testing
- Progress bar verification
- Success message validation
- Coverage: 100% for all handlers

#### Example 3: Get Resource Handler Test
**File**: `packages/cli/__tests__/__unit__/get/Resource.handler.unit.test.ts`
- Tests resource retrieval with various parameters
- Tests response formatting
- Tests lowercase resource name handling
- Coverage: 100%

### Recent SDK Package Test Examples ✅

The SDK package now has perfect test coverage. Use these as reference examples:

#### Example 4: CicsCmciRestError Test
**File**: `packages/sdk/__tests__/__unit__/CicsCmciRestError.unit.test.ts`
- Tests custom error class extending ImperativeError
- Tests constructor with message and response
- Tests parseResultSummary method with various response codes
- Tests error scenarios (NODATA, INVALIDPARM, NOTAVAILABLE, INVALIDDATA)
- Tests complex error scenarios with complete feedback
- Tests edge cases (NaN handling, missing fields, empty strings)
- Coverage: 100% (18 test cases)

**Key Features**:
- Comprehensive mock response objects
- Tests for all error properties (RESPONSE_1, RESPONSE_2, FEEDBACKRESP, etc.)
- Tests default value handling when errors are absent
- Tests numeric string parsing with leading zeros
- Tests partial and complete feedback information
- Edge case testing for invalid data

**Test Structure**:
```typescript
describe("CicsCmciRestError tests", () => {
  describe("Constructor and basic properties", () => {
    // Tests error creation and inheritance
  });
  
  describe("parseResultSummary method", () => {
    // Tests parsing of response codes and feedback
  });
  
  describe("Error scenarios with different response codes", () => {
    // Tests handling of specific CMCI response codes
  });
  
  describe("Complex error scenarios", () => {
    // Tests complete feedback with CICS name and actions
  });
  
  describe("Edge cases", () => {
    // Tests NaN, missing fields, and minimal feedback
  });
});
```

#### Example 5: Doc Interface Tests
**File**: `packages/sdk/__tests__/__unit__/doc/Interfaces.unit.test.ts`
- Tests TypeScript interfaces for CMCI API responses
- Tests ICMCIApiResponse, ICMCIResponseResultSummary, ICMCIResponseErrorFeedBack, ICMCIResponseErrors
- Tests type guard functions for runtime validation
- Tests integration scenarios with complete responses
- Coverage: 100% (23 test cases)

**Key Features**:
- Validates interface structure with required and optional fields
- Tests various CICS response codes (OK, NODATA, INVALIDPARM, NOTAVAILABLE, INVALIDDATA)
- Tests various CICS error codes (NORMAL, DISABLED, NOTAUTH, NOTFND, INVREQ)
- Tests EIBFN function codes (GET, PUT, POST, DELETE, INQUIRE, SET, PERFORM)
- Type guard functions for runtime type checking
- Integration tests combining multiple interfaces

**Test Structure**:
```typescript
describe("Doc Interface Tests", () => {
  describe("ICMCIApiResponse", () => {
    // Tests complete API response structure
  });
  
  describe("ICMCIResponseResultSummary", () => {
    // Tests result summary with required and optional fields
  });
  
  describe("ICMCIResponseErrorFeedBack", () => {
    // Tests feedback with various CICS response codes
  });
  
  describe("ICMCIResponseErrors", () => {
    // Tests error structure with feedback
  });
  
  describe("Type Guard Functions", () => {
    // Tests runtime type validation functions
  });
  
  describe("Integration Tests", () => {
    // Tests complete scenarios with all interfaces together
  });
});
```

**Type Guard Example**:
```typescript
function isICMCIApiResponse(obj: any): obj is ICMCIApiResponse {
  return (
    obj !== null &&
    obj !== undefined &&
    typeof obj === "object" &&
    "response" in obj &&
    obj.response &&
    "resultsummary" in obj.response &&
    "records" in obj.response
  );
}
```

### Recent API Package Test Examples ✅

The API package now has perfect test coverage. Use these as reference examples:

#### Example 6: Interface Tests
**File**: `packages/vsce-api/__tests__/__unit__/interfaces.test.ts`
- Tests TypeScript interfaces for CICS Explorer API
- Tests ResourceAction class with all properties and methods
- Tests IResourceExtender interface implementation
- Tests all resource type interfaces (20+ interfaces)
- Coverage: 100% (47 test cases)

**Key Features**:
- Comprehensive ResourceAction class testing with constructor variations
- Tests for optional and required parameters
- IResourceExtender methods (registerAction, getActions, getAction, getActionsFor)
- All resource context interfaces (IResourceContext, IResourceRegionInfo, IResourceProfileNameInfo, IResourceProfileInfo)
- All resource type interfaces (IProgram, ITransaction, IBundle, IJVMServer, ILibrary, ILocalFile, IRemoteFile, IPipeline, IURIMap, IWebService, ITCPIP, ITSQueue, ISharedTSQueue, ITask, IRegion, IManagedRegion, etc.)
- Proper imports to ensure TypeScript interface files are included in coverage

**Test Structure**:
```typescript
describe("Interfaces", () => {
  describe("ResourceAction", () => {
    // Tests ResourceAction class creation and getters
    // Tests constructor with various parameter combinations
    // Tests refreshResourceInspector default behavior
  });
  
  describe("IResourceExtender", () => {
    // Tests action registration and retrieval
    // Tests getActions, getAction, getActionsFor methods
  });
  
  describe("IExtensionAPI", () => {
    // Tests API structure validation
  });
  
  describe("IResource interfaces", () => {
    // Tests base resource interfaces
  });
  
  describe("IResourceContext interfaces", () => {
    // Tests context and profile interfaces
  });
  
  describe("Resource type interfaces", () => {
    // Tests all 20+ resource type interfaces
    // Validates proper property names and types
  });
  
  describe("ResourceTypeMap", () => {
    // Tests type mapping between ResourceTypes and interfaces
  });
});
```

**Key Testing Pattern for Interfaces**:
```typescript
// Import all interface files to ensure coverage
import "../../src/interfaces/IExtensionAPI";
import "../../src/interfaces/IResourceContext";
// ... import all interface files

// Then use type imports for actual testing
import type { IExtensionAPI } from "../../src/interfaces/IExtensionAPI";
```

---

### Template 1: Command Handler Tests (VSCE Package)

```typescript
/**
 * Template for testing VSCE command handlers
 * Use this for files in packages/vsce/src/commands/
 * Based on successful CLI package patterns
 */

import * as vscode from "vscode";
import { imperative } from "@zowe/zowe-explorer-api";
import { commandFunction } from "../../../src/commands/yourCommand";
import { CICSTree } from "../../../src/trees/CICSTree";

jest.mock("vscode");
jest.mock("@zowe/zowe-explorer-api");

describe("CommandName Tests", () => {
  let mockTree: CICSTree;
  let mockNode: any;
  let showErrorMessageSpy: jest.SpyInstance;
  let showInformationMessageSpy: jest.SpyInstance;

  beforeEach(() => {
    // Setup mocks
    mockTree = {
      refresh: jest.fn(),
      getChildren: jest.fn(),
    } as unknown as CICSTree;

    mockNode = {
      label: "TestNode",
      profile: {
        name: "testProfile",
        profile: {
          host: "example.com",
          port: 1490,
        },
      },
    };

    showErrorMessageSpy = jest.spyOn(vscode.window, "showErrorMessage");
    showInformationMessageSpy = jest.spyOn(vscode.window, "showInformationMessage");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Success Scenarios", () => {
    it("should execute command successfully with valid input", async () => {
      // Arrange
      const expectedResult = { success: true };

      // Act
      const result = await commandFunction(mockNode, mockTree);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockTree.refresh).toHaveBeenCalled();
      expect(showInformationMessageSpy).toHaveBeenCalled();
    });

    it("should handle multiple nodes", async () => {
      // Test with array of nodes
      const nodes = [mockNode, { ...mockNode, label: "Node2" }];
      
      const result = await commandFunction(nodes, mockTree);
      
      expect(result).toBeDefined();
    });
  });

  describe("Error Scenarios", () => {
    it("should handle undefined node gracefully", async () => {
      await commandFunction(undefined, mockTree);
      
      expect(showErrorMessageSpy).toHaveBeenCalled();
    });

    it("should handle API errors", async () => {
      // Mock API to throw error
      const error = new Error("API Error");
      jest.spyOn(mockTree, "refresh").mockRejectedValue(error);

      await commandFunction(mockNode, mockTree);

      expect(showErrorMessageSpy).toHaveBeenCalledWith(
        expect.stringContaining("API Error")
      );
    });

    it("should handle network timeout", async () => {
      const timeoutError = new imperative.ImperativeError({
        msg: "Connection timeout",
      });

      // Test timeout handling
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty profile", async () => {
      mockNode.profile = undefined;
      
      await commandFunction(mockNode, mockTree);
      
      expect(showErrorMessageSpy).toHaveBeenCalled();
    });

    it("should handle missing credentials", async () => {
      mockNode.profile.profile.user = undefined;
      
      // Test credential handling
    });
  });

  describe("Branch Coverage", () => {
    it("should follow true branch when condition is met", async () => {
      // Test positive condition
    });

    it("should follow false branch when condition is not met", async () => {
      // Test negative condition
    });

    it("should handle all switch/case branches", async () => {
      // Test each case in switch statements
    });
  });
});
```

### Template 2: Utility Function Tests

```typescript
/**
 * Template for testing utility functions
 * Use this for files in packages/vsce/src/utils/
 */

import { utilityFunction } from "../../../src/utils/yourUtil";

describe("UtilityName Tests", () => {
  describe("Function: utilityFunction", () => {
    it("should return expected result for valid input", () => {
      const input = "test";
      const expected = "TEST";
      
      const result = utilityFunction(input);
      
      expect(result).toBe(expected);
    });

    it("should handle null input", () => {
      expect(() => utilityFunction(null)).toThrow();
    });

    it("should handle undefined input", () => {
      expect(() => utilityFunction(undefined)).toThrow();
    });

    it("should handle empty string", () => {
      const result = utilityFunction("");
      expect(result).toBe("");
    });

    it("should handle special characters", () => {
      const input = "!@#$%^&*()";
      const result = utilityFunction(input);
      expect(result).toBeDefined();
    });

    it("should handle very long strings", () => {
      const longString = "a".repeat(10000);
      const result = utilityFunction(longString);
      expect(result).toBeDefined();
    });
  });

  describe("Branch Coverage Tests", () => {
    it("should execute if branch", () => {
      // Test condition = true
    });

    it("should execute else branch", () => {
      // Test condition = false
    });

    it("should handle early return", () => {
      // Test early return conditions
    });
  });
});
```

### Template 3: Tree/Provider Tests

```typescript
/**
 * Template for testing tree providers and nodes
 * Use this for files in packages/vsce/src/trees/
 */

import * as vscode from "vscode";
import { CICSTree } from "../../../src/trees/CICSTree";
import { CICSTreeNode } from "../../../src/trees/CICSTreeNode";

jest.mock("vscode");

describe("TreeName Tests", () => {
  let tree: CICSTree;
  let mockContext: vscode.ExtensionContext;

  beforeEach(() => {
    mockContext = {
      subscriptions: [],
      workspaceState: {
        get: jest.fn(),
        update: jest.fn(),
      },
      globalState: {
        get: jest.fn(),
        update: jest.fn(),
      },
    } as unknown as vscode.ExtensionContext;

    tree = new CICSTree(mockContext);
  });

  describe("getChildren", () => {
    it("should return root nodes when element is undefined", async () => {
      const children = await tree.getChildren();
      
      expect(children).toBeDefined();
      expect(Array.isArray(children)).toBe(true);
    });

    it("should return child nodes for parent element", async () => {
      const parent = new CICSTreeNode("Parent", vscode.TreeItemCollapsibleState.Collapsed);
      
      const children = await tree.getChildren(parent);
      
      expect(children).toBeDefined();
    });

    it("should return empty array for leaf nodes", async () => {
      const leaf = new CICSTreeNode("Leaf", vscode.TreeItemCollapsibleState.None);
      
      const children = await tree.getChildren(leaf);
      
      expect(children).toEqual([]);
    });
  });

  describe("getTreeItem", () => {
    it("should return tree item for node", () => {
      const node = new CICSTreeNode("Test", vscode.TreeItemCollapsibleState.None);
      
      const item = tree.getTreeItem(node);
      
      expect(item).toBe(node);
    });
  });

  describe("refresh", () => {
    it("should fire change event", () => {
      const fireStub = jest.fn();
      tree["_onDidChangeTreeData"] = { fire: fireStub } as any;
      
      tree.refresh();
      
      expect(fireStub).toHaveBeenCalled();
    });

    it("should refresh specific node", () => {
      const node = new CICSTreeNode("Test", vscode.TreeItemCollapsibleState.None);
      const fireStub = jest.fn();
      tree["_onDidChangeTreeData"] = { fire: fireStub } as any;
      
      tree.refresh(node);
      
      expect(fireStub).toHaveBeenCalledWith(node);
    });
  });
});
```

---

## 🔧 Specific File Templates

### 1. profileManagement.ts Test Template

```typescript
/**
 * File: packages/vsce/__tests__/__unit__/utils/profileManagement.unit.test.ts
 * Coverage Target: 21.73% → 95%+
 * Estimated: ~30 test cases
 */

import { ProfileManagement } from "../../../src/utils/profileManagement";
import { ZoweVsCodeExtension } from "@zowe/zowe-explorer-api";

jest.mock("@zowe/zowe-explorer-api");

describe("ProfileManagement", () => {
  describe("apiDoesExist", () => {
    it("should return true when API exists", () => {
      // Test API existence check
    });

    it("should return false when API does not exist", () => {
      // Test API non-existence
    });
  });

  describe("registerCICSProfiles", () => {
    it("should register profiles successfully", async () => {
      // Test profile registration
    });

    it("should handle registration errors", async () => {
      // Test error handling
    });
  });

  describe("getExplorerApis", () => {
    it("should return explorer APIs", () => {
      // Test API retrieval
    });
  });

  describe("getProfilesCache", () => {
    it("should return profiles cache", () => {
      // Test cache retrieval
    });
  });

  describe("profilesCacheRefresh", () => {
    it("should refresh profiles cache", async () => {
      // Test cache refresh
    });
  });

  describe("getConfigInstance", () => {
    it("should return config instance", async () => {
      // Test config retrieval
    });
  });

  describe("formatRestClientError", () => {
    it("should format error with error code", () => {
      const error = {
        errorCode: "ERR001",
        additionalDetails: "Details",
      };
      
      const result = ProfileManagement.formatRestClientError(error as any);
      
      expect(result).toContain("ERR001");
    });

    it("should format error with cause code", () => {
      const error = {
        causeErrors: {
          code: "CAUSE001",
          message: "Cause message",
        },
      };
      
      const result = ProfileManagement.formatRestClientError(error as any);
      
      expect(result).toContain("CAUSE001");
    });

    it("should format error with additional details", () => {
      const error = {
        additionalDetails: "Additional info",
      };
      
      const result = ProfileManagement.formatRestClientError(error as any);
      
      expect(result).toContain("Additional info");
    });
  });

  describe("regionIsGroup", () => {
    it("should return true for group region", async () => {
      // Mock API response with recordcount !== "0"
    });

    it("should return false for non-group region", async () => {
      // Mock API response with recordcount === "0"
    });

    it("should handle CicsCmciRestError", async () => {
      // Test CICS error handling
    });

    it("should handle ImperativeError", async () => {
      // Test Imperative error handling
    });

    it("should handle generic errors", async () => {
      // Test generic error handling
    });
  });
});
```

### 2. CICSTree.ts Test Template

```typescript
/**
 * File: packages/vsce/__tests__/__unit__/trees/CICSTree.unit.test.ts
 * Coverage Target: 21.96% → 95%+
 * Estimated: ~40 test cases
 */

describe("CICSTree", () => {
  // Add comprehensive tests for all methods
  // Focus on:
  // - Tree initialization
  // - Node creation and management
  // - Profile handling
  // - Refresh operations
  // - Error scenarios
  // - Edge cases
});
```

### 3. Command Handler Templates

Create tests for each command file in `packages/vsce/src/commands/`:

```typescript
// actionResourceCommand.ts (32% → 95%)
// clearPlexFilterCommand.ts (15.78% → 95%)
// disableResourceCommand.ts (22.22% → 95%)
// enableResourceCommand.ts (26.41% → 95%)
// getFilterPlexResources.ts (10.66% → 95%)
// inquireProgram.ts (28% → 95%)
// inquireTransaction.ts (28% → 95%)
// purgeTaskCommand.ts (24.32% → 95%)
// setCICSRegionCommand.ts (9.16% → 95%)
// showLibraryCommand.ts (13.51% → 95%)
// showParameterCommand.ts (20% → 95%)
```

---

## 📋 Testing Checklist

### For Each Function/Method:
- [ ] Test with valid inputs
- [ ] Test with null/undefined inputs
- [ ] Test with empty inputs
- [ ] Test with boundary values
- [ ] Test with invalid inputs
- [ ] Test error handling
- [ ] Test all conditional branches (if/else)
- [ ] Test all switch/case branches
- [ ] Test early returns
- [ ] Test async/await scenarios
- [ ] Test promise rejections
- [ ] Test timeout scenarios

### For Each Class:
- [ ] Test constructor
- [ ] Test all public methods
- [ ] Test all getters/setters
- [ ] Test inheritance scenarios
- [ ] Test interface implementations
- [ ] Test event handlers
- [ ] Test lifecycle methods

---

## 🎯 Priority Order

### Week 1: High-Impact Areas
1. profileManagement.ts tests
2. Top 5 command handlers with lowest coverage
3. CICSTree.ts core functionality

### Week 2: Medium-Impact Areas
4. Remaining command handlers
5. Tree provider tests
6. Utility function branch coverage

### Week 3: Final Polish
7. Edge cases and boundary conditions
8. Integration scenarios
9. Error path coverage
10. Final 100% verification

---

## 📊 Progress Tracking

Create a file `COVERAGE_PROGRESS.md` to track:

```markdown
# Coverage Progress Tracker

## Week 1
- [ ] profileManagement.ts: 21.73% → ___%
- [ ] setCICSRegionCommand.ts: 9.16% → ___%
- [ ] getFilterPlexResources.ts: 10.66% → ___%
- [ ] showLibraryCommand.ts: 13.51% → ___%
- [ ] clearPlexFilterCommand.ts: 15.78% → ___%

## Week 2
- [ ] CICSTree.ts: 21.96% → ___%
- [ ] [Continue with remaining files]

## Week 3
- [ ] Final verification
- [ ] 100% coverage achieved: [ ]
```

---

## 🚀 Quick Start

1. Copy the appropriate template
2. Replace placeholder names with actual file names
3. Implement test cases following the patterns
4. Run tests: `npm run test:unit`
5. Check coverage: Review the coverage report
6. Iterate until 100% coverage achieved

---

## 💡 Tips for Success

1. **Start Small**: Begin with one file at a time
2. **Follow Patterns**: Use existing tests as examples
3. **Mock Wisely**: Mock external dependencies, not internal logic
4. **Test Behavior**: Focus on what the code does, not how
5. **Cover Branches**: Ensure all if/else paths are tested
6. **Handle Errors**: Test both success and failure scenarios
7. **Document**: Add comments explaining complex test scenarios
8. **Refactor**: Keep tests DRY (Don't Repeat Yourself)

---

## 📚 Resources

- Jest Documentation: https://jestjs.io/docs/getting-started
- VS Code Extension Testing: https://code.visualstudio.com/api/working-with-extensions/testing-extension
- Coverage Reports: Check `__tests__/__results__/unit/coverage/`

---

**Remember**: The goal is not just 100% coverage, but meaningful tests that catch real bugs and ensure code quality!
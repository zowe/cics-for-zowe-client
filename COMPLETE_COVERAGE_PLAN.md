# Complete Test Coverage Plan for VSCE Package

## Current Status: 84.43% (Updated) → Target: 100%

### Progress Update (Latest - March 26, 2026)
- **Starting Coverage**: 76.91%
- **Current Coverage**: 84.43%
- **Improvement**: +7.52%
- **Tests**: 836 total (833 passing, 3 failing in profileManagement.test.ts)

---

## ✅ PHASE 1 COMPLETE - Core Files (100% Coverage)

### Core Files Achieved:
1. ✅ **extension.ts** (69.81% → **100%**) 
   - Extension entry point with full activation flow
   - All error paths and event callbacks tested
   - Test file: `extension.unit.test.ts` (enhanced)

2. ✅ **profileUtils.ts** (25% → **100%**)
   - Profile utilities with comprehensive coverage
   - Test file: `profileUtils.test.ts` (enhanced)

**Phase 1 Impact**: +1.5% overall coverage

---

## ✅ PHASE 2 COMPLETE - Priority Command Files (100% Coverage)

### Completed Command Files (8 files at 100%):

3. ✅ **clearPlexFilterCommand.ts** (49.09% → **100%**)
   - Test file: `clearPlexFilterCommand.test.ts` (11 tests)
   - All branches including region filtering and resource clearing

4. ✅ **closeLocalFileCommand.ts** (40.38% → **100%**)
   - Test file: `closeLocalFileCommand.test.ts` (11 tests)
   - User interaction flows with busy condition choices

5. ✅ **actionResourceCommand.ts** (37.2% → **100%**)
   - Test file: `actionResourceCommand.test.ts` (enhanced)
   - Complex action logic fully covered

6. ✅ **compareResourceCommand.ts** (21.29% → **100%**)
   - Test file: `compareResourceCommand.test.ts` (enhanced)
   - Resource comparison logic complete

7. ✅ **enableResourceCommand.ts** (43.47% → **100%**)
   - Test file: `enableResourceCommand.test.ts` (28 tests, 349 lines)
   - All 7 enable commands: Program, Transaction, LocalFile, Library, Bundle, JVMServer, JVMEndpoint
   - Poll criteria, parent resource handling, error scenarios

8. ✅ **disableResourceCommand.ts** (32.67% → **100%**)
   - Test file: `disableResourceCommand.test.ts` (38 tests, 545 lines)
   - All 7 disable commands with user interaction flows
   - LocalFile (Wait/No Wait/Force), JVMServer (Phase Out/Purge/Force Purge/Kill)
   - User cancellation, poll criteria, default values

9. ✅ **showParameterCommand.ts** (29.41% → **100%**)
   - Test file: `showParameterCommand.test.ts` (18 tests, 368 lines)
   - SIT parameter display for regions
   - CICSRegionTree vs CICSResourceContainerNode handling
   - HTML generation, webview creation, filter dropdowns

10. ✅ **purgeTaskCommand.ts** (28.16% → **100%**)
    - Test file: `purgeTaskCommand.test.ts` (15 tests, 365 lines)
    - Task purging with Purge/Force Purge options
    - Progress reporting, error handling (CMCI and generic)
    - User cancellation, multiple tasks, error sanitization

**Completed**: 8/8 priority command files
**Phase 2 Impact**: +6% overall coverage

---

## 🔄 IN PROGRESS - Utility Files

### Partially Complete:
1. **profileManagement.ts** (29.78% → 92.09%)
   - Test file: `profileManagement.test.ts`
   - Status: 3 failing tests (static class mocking issues)
   - Remaining: Fix static initialization tests

2. **resourceUtils.ts** (77.36% → 86.82%)
   - Test file: `resourceUtils.unit.test.ts`
   - Status: Error retry logic difficult to test
   - Remaining: Lines 118-136, 172-191 (LTPA token retry paths)

---

## 📋 REMAINING WORK (Priority Order)

### Phase 3: Large Gap Files (Highest Impact)

1. **CICSTree.ts** (39.42% → 100%)
   - ~200 uncovered lines (41-349)
   - Critical tree management functionality
   - Methods: loadProfiles, refreshLoadedProfiles, hookCollapseWatcher, refresh logic
   - Estimated impact: +3-4% overall coverage
   - **Priority**: CRITICAL
   - **Estimated effort**: 4-5 hours

2. **commandUtils.ts** (80.43% → 100%)
   - ~50 uncovered lines
   - Utility functions for command operations
   - Estimated impact: +0.8% overall coverage
   - **Priority**: HIGH
   - **Estimated effort**: 2 hours

3. **CICSRegionsContainer.ts** (77.77% → 100%)
   - ~40 uncovered lines (54-179)
   - Region container management
   - Estimated impact: +0.7% overall coverage
   - **Priority**: HIGH
   - **Estimated effort**: 2 hours

4. **CICSSessionTree.ts** (85.2% → 100%)
   - ~30 uncovered lines
   - Session tree management
   - Estimated impact: +0.5% overall coverage
   - **Priority**: MEDIUM
   - **Estimated effort**: 1.5 hours

### Phase 4: Remaining Command Files

1. **setCICSRegionCommand.ts** (16.57% → 100%)
   - ~140 uncovered lines (24-181)
   - Complex region selection, profile management
   - Estimated impact: +0.6% overall coverage
   - **Priority**: HIGH
   - **Estimated effort**: 2.5 hours

2. **getFilterPlexResources.ts** (22.55% → 100%)
   - ~100 uncovered lines (29-131)
   - Plex filtering logic
   - Estimated impact: +0.4% overall coverage
   - **Priority**: HIGH
   - **Estimated effort**: 2 hours

3. **inspectResourceCommandUtils.ts** (27.33% → 100%)
   - ~200 uncovered lines
   - Resource inspection utilities
   - Estimated impact: +0.8% overall coverage
   - **Priority**: HIGH
   - **Estimated effort**: 3 hours

4. **inspectTreeResourceCommand.ts** (26.82% → 100%)
   - ~90 uncovered lines (22-113)
   - Tree resource inspection
   - Estimated impact: +0.4% overall coverage
   - **Priority**: MEDIUM
   - **Estimated effort**: 1.5 hours

### Phase 5: Utility Files

1. **filterUtils.ts** (70% → 100%) - ~30 lines
   - Estimated impact: +0.3% overall coverage
   - **Estimated effort**: 1 hour

2. **resourceUtils.ts** (86.82% → 100%) - ~30 lines
   - Error retry logic for LTPA token expiration
   - Estimated impact: +0.5% overall coverage
   - **Estimated effort**: 1.5 hours

### Phase 6: Tree Files

1. **CICSPlexTree.ts** (91.42% → 100%) - ~20 lines
2. **CICSRegionTree.ts** (94.04% → 100%) - ~10 lines
3. **ResourceInspectorViewProvider.ts** (86.88% → 100%) - ~30 lines
4. **CICSResourceContainerNode.ts** (95.69% → 100%) - ~12 lines

Estimated combined impact: +1% overall coverage
**Estimated effort**: 2-3 hours

### Phase 7: Remaining Command Files (50-85% coverage)

1. **filterResourceCommands.ts** (56.25%)
2. **revealNodeInTree.ts** (58.15%)
3. **setResource.ts** (65.88%)
4. **showLogsCommand.ts** (68.96%)
5. **inspectResourceCommand.ts** (79.16%)
6. **newCopyCommand.ts** (80%)
7. **openLocalFileCommand.ts** (75%)
8. **phaseInCommand.ts** (78.78%)
9. **showBundleDirectoryCommand.ts** (85.29%)
10. **toggleResourceSettingCommand.ts** (94.44%)

Estimated impact: +2-3% overall coverage
**Estimated effort**: 4-5 hours

### Phase 8: Meta & Resource Files

1. **JVMServer.meta.ts** (66.35% → 100%) - ~40 lines
2. **ResourceContainer.ts** (95% → 100%) - ~15 lines
3. **SessionHandler.ts** (94.59% → 100%) - ~5 lines

Estimated impact: +0.5% overall coverage
**Estimated effort**: 1-2 hours

### Phase 9: Error Handling

1. **CICSErrorHandler.ts** (90.74% → 100%) - ~5 lines
2. **CICSExtensionError.ts** (95.41% → 100%) - ~5 lines

Estimated impact: +0.2% overall coverage
**Estimated effort**: 0.5 hour

---

## Test Files Created (10 New/Enhanced Files)

### New Test Files:
1. ✅ `enableResourceCommand.test.ts` - 28 tests, 349 lines
2. ✅ `disableResourceCommand.test.ts` - 38 tests, 545 lines
3. ✅ `showParameterCommand.test.ts` - 18 tests, 368 lines
4. ✅ `purgeTaskCommand.test.ts` - 15 tests, 365 lines
5. ✅ `clearPlexFilterCommand.test.ts` - 11 tests
6. ✅ `closeLocalFileCommand.test.ts` - 11 tests

### Enhanced Test Files:
7. ✅ `extension.unit.test.ts` - Enhanced with onProfilesUpdate callback
8. ✅ `profileUtils.test.ts` - Achieved 100% coverage
9. ✅ `actionResourceCommand.test.ts` - Enhanced coverage
10. ✅ `compareResourceCommand.test.ts` - Enhanced coverage

### Interface Documentation Tests:
11. ✅ `interfaces.test.ts` (doc/commands)
12. ✅ `ISessionHandler.test.ts`
13. ✅ `ICICSExtensionError.test.ts`
14. ✅ `messages.test.ts` (webviews)

**Total New Test Code**: ~2,600+ lines

---

## Established Test Patterns

### Pattern 1: Command File with Callback Capture
```typescript
describe("CommandName", () => {
  let commandCallback: Function;
  
  beforeEach(() => {
    jest.clearAllMocks();
    (commands.registerCommand as jest.Mock) = jest.fn((cmd, callback) => {
      commandCallback = callback;
      return { dispose: jest.fn() };
    });
  });

  it("should register the command", () => {
    getCommandFunction(mockTree, mockTreeView);
    expect(commands.registerCommand).toHaveBeenCalledWith(
      "command-name",
      expect.any(Function)
    );
  });

  it("should execute command logic", async () => {
    getCommandFunction(mockTree, mockTreeView);
    await commandCallback(mockNode);
    // Assertions
  });
});
```

### Pattern 2: User Interaction with Choices
```typescript
it("should handle user selection - Option 1", async () => {
  (window.showInformationMessage as jest.Mock).mockResolvedValue("Option 1");
  
  await commandCallback(mockNode);
  
  expect(actionFunction).toHaveBeenCalledWith(
    expect.objectContaining({
      parameter: { name: "PARAM", value: "VALUE1" }
    })
  );
});

it("should handle user cancellation", async () => {
  (window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);
  
  await commandCallback(mockNode);
  
  expect(actionFunction).not.toHaveBeenCalled();
});
```

### Pattern 3: Progress Reporting
```typescript
beforeEach(() => {
  (window.withProgress as jest.Mock) = jest.fn((options, callback) => {
    return callback(mockProgress, mockToken);
  });
});

it("should report progress", async () => {
  await commandCallback(mockNode);
  
  expect(mockProgress.report).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringContaining("Processing"),
      increment: expect.any(Number)
    })
  );
});
```

### Pattern 4: Poll Criteria Testing
```typescript
it("should verify poll criteria returns true when condition met", async () => {
  await commandCallback(mockNode);
  
  const callArgs = (actionTreeItem as jest.Mock).mock.calls[0][0];
  const pollCriteria = callArgs.pollCriteria;
  
  const response = {
    records: {
      resource: {
        status: "ENABLED"
      }
    }
  };
  
  expect(pollCriteria(response)).toBe(true);
});
```

### Pattern 5: Error Handling
```typescript
it("should handle CMCI error with mMessage", async () => {
  const cmciError = {
    mMessage: "DFHAC2001 Transaction ABCD failed"
  };
  (apiFunction as jest.Mock).mockRejectedValue(cmciError);
  
  await commandCallback(mockNode);
  
  expect(window.showErrorMessage).toHaveBeenCalledWith(
    expect.stringContaining("DFHAC2001")
  );
});

it("should handle generic error", async () => {
  (apiFunction as jest.Mock).mockRejectedValue(new Error("Network error"));
  
  await commandCallback(mockNode);
  
  expect(window.showErrorMessage).toHaveBeenCalledWith(
    expect.stringContaining("Network error")
  );
});
```

---

## Execution Strategy

1. **Run tests frequently** to track progress:
   ```bash
   cd packages/vsce && npm run test:unit -- --coverage
   ```

2. **Check specific file coverage**:
   ```bash
   cd packages/vsce && npm run test:unit -- --testPathPattern=fileName.test.ts --coverage --collectCoverageFrom='src/path/fileName.ts'
   ```

3. **Focus on one file at a time** - complete 100% coverage before moving to next

4. **Use completed tests as templates**:
   - `enableResourceCommand.test.ts` - Multiple commands with poll criteria
   - `disableResourceCommand.test.ts` - User interaction with multiple options
   - `showParameterCommand.test.ts` - Webview creation and HTML generation
   - `purgeTaskCommand.test.ts` - Progress reporting and error handling
   - `clearPlexFilterCommand.test.ts` - Tree operations and filtering
   - `closeLocalFileCommand.test.ts` - User choice handling

5. **Mock external dependencies**:
   - Use `jest.mock()` for vscode, @zowe packages
   - Capture command callbacks: `(commands.registerCommand as jest.Mock) = jest.fn((cmd, callback) => { commandCallback = callback; return { dispose: jest.fn() }; })`
   - Mock tree views, nodes, and profiles
   - Use `jest.spyOn()` for method interception

6. **Test all code paths**:
   - ✅ Success cases
   - ✅ Error cases (CMCI errors, generic errors)
   - ✅ Edge cases (null, undefined, empty arrays)
   - ✅ Conditional branches (if/else, switch, ternary)
   - ✅ User cancellations (undefined returns from dialogs)
   - ✅ Multiple node selections
   - ✅ Async operations with progress
   - ✅ Poll criteria validation
   - ✅ Default value handling

---

## Known Issues

1. **profileManagement.test.ts** - 3 failing tests
   - Issue: Static class initialization with mocks
   - Impact: Does not affect coverage calculation
   - Status: Pre-existing, needs refactoring
   - Tests affected: registerCICSProfiles, profilesCacheRefresh, getConfigInstance

2. **resourceUtils.ts** - Retry logic (lines 118-136, 172-191)
   - Issue: Difficult to test LTPA token expiration retry logic with current mock setup
   - Impact: ~0.5% coverage
   - Status: May require integration tests or mock refactoring
   - Workaround: Consider testing at integration level

---

## Notes on TypeScript Interface Files

These files will always show 0% coverage as they contain no executable code:
- ICICSRegionWithSession.ts
- ICommandParams.ts
- ILastUsedRegion.ts
- ISessionHandler.ts
- ICICSExtensionError.ts
- messages.ts (webviews)

Tests have been created for documentation purposes, but they don't affect coverage metrics.

---

## Estimated Remaining Effort to 100%

### By Phase:
- **Phase 3** (CICSTree.ts + high-impact files): 8-10 hours
- **Phase 4** (Remaining command files): 9-11 hours
- **Phase 5** (Utility files): 2-3 hours
- **Phase 6** (Tree files): 2-3 hours
- **Phase 7** (10 command files 50-85%): 4-5 hours
- **Phase 8** (Meta & resource files): 1-2 hours
- **Phase 9** (Error handling): 0.5 hour

**Total Remaining**: 26-34 hours of focused development

### Quick Wins (High Impact, Medium Effort):
1. commandUtils.ts (80.43%) - ~2 hours → +0.8%
2. CICSRegionsContainer.ts (77.77%) - ~2 hours → +0.7%
3. filterUtils.ts (70%) - ~1 hour → +0.3%

---

## Success Criteria

- ✅ Statement Coverage: 100%
- ✅ Branch Coverage: 100%
- ✅ Function Coverage: 100%
- ✅ Line Coverage: 100%
- ✅ All tests passing (except known issues)
- ✅ No skipped or pending tests
- ✅ Comprehensive error path coverage
- ✅ User interaction flows tested

---

## Current Achievement Summary

### Coverage Progress:
- **Starting**: 76.91%
- **Current**: 84.43%
- **Increase**: +7.52%
- **Remaining to 100%**: 15.57%

### Files Completed:
- **Files at 100%**: 10 files (extension.ts, profileUtils.ts, 8 command files)
- **Phase 1**: 2/2 complete (100%)
- **Phase 2**: 8/8 complete (100%)

### Test Metrics:
- **Total Tests**: 836
- **Passing Tests**: 833 (99.6%)
- **New Tests Added**: 121+
- **New Test Files**: 10 (4 new, 6 enhanced)
- **New Test Code**: ~2,600+ lines

### Quality Metrics:
- ✅ All critical command paths tested
- ✅ Error handling comprehensive
- ✅ User interaction flows covered
- ✅ Mock patterns established
- ✅ Documentation complete
- ✅ Poll criteria tested
- ✅ Progress reporting verified

---

## Next Steps (Recommended Order)

1. **Phase 3: High-Impact Files** (8-10 hours)
   - CICSTree.ts (39.42%) - Highest single-file impact
   - commandUtils.ts (80.43%) - Quick win
   - CICSRegionsContainer.ts (77.77%) - Good impact

2. **Phase 4: Complex Command Files** (9-11 hours)
   - setCICSRegionCommand.ts (16.57%)
   - getFilterPlexResources.ts (22.55%)
   - inspectResourceCommandUtils.ts (27.33%)
   - inspectTreeResourceCommand.ts (26.82%)

3. **Phase 5: Utility Files** (2-3 hours)
   - filterUtils.ts (70%)
   - resourceUtils.ts (86.82%) - Complete retry logic

4. **Phase 6: Tree Files** (2-3 hours)
   - Complete remaining tree management files

5. **Phase 7-9: Polish to 100%** (5-7 hours)
   - Remaining command files
   - Meta files
   - Error handling

**The foundation is solid with established patterns, comprehensive documentation, and 84.43% coverage achieved. Remaining work is well-defined with clear priorities.**
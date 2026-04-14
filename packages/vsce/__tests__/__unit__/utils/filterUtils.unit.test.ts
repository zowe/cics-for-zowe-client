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

import { Gui } from "@zowe/zowe-explorer-api";
import { buildQuickPick, FilterDescriptor, getPatternFromFilter, toEscapedCriteriaString } from "../../../src/utils/filterUtils";

// Helper function to create a mock QuickPick
const createMockQuickPick = (value: string, selectedItems: any[] = []) => {
  const mockQuickPick = {
    show: jest.fn(),
    hide: jest.fn(),
    value,
    selectedItems,
    onDidAccept: jest.fn(),
    onDidHide: jest.fn(),
  };
  
  // Auto-trigger onDidAccept when show is called (simulates user pressing Enter)
  mockQuickPick.show.mockImplementation(() => {
    const acceptHandler = mockQuickPick.onDidAccept.mock.calls[0]?.[0];
    if (acceptHandler) {
      // Simulate async behavior
      setTimeout(() => acceptHandler(), 0);
    }
  });
  
  return mockQuickPick;
};

// Helper function to setup single quickpick scenario
const setupSingleQuickPick = (value: string, resolvedValue?: { label: string; description?: string }) => {
  const selectedItems = resolvedValue ? [resolvedValue] : [];
  const mockQuickPick = createMockQuickPick(value, selectedItems);
  jest.spyOn(Gui, "createQuickPick").mockReturnValue(mockQuickPick as any);
  return mockQuickPick;
};

// Helper function to setup dual quickpick scenario (initial + edit)
const setupDualQuickPick = (
  initialValue: string,
  editValue: string,
  firstResolve: { label: string; description?: string },
  secondResolve: { label: string; description?: string }
) => {
  const firstSelectedItems = firstResolve ? [firstResolve] : [];
  const secondSelectedItems = secondResolve ? [secondResolve] : [];
  
  const mockQuickPick = createMockQuickPick(initialValue, firstSelectedItems);
  const mockEditQuickPick = createMockQuickPick(editValue, secondSelectedItems);
  
  let callCount = 0;
  jest.spyOn(Gui, "createQuickPick").mockImplementation(() => {
    callCount++;
    return callCount === 1 ? mockQuickPick as any : mockEditQuickPick as any;
  });
  
  return { mockQuickPick, mockEditQuickPick };
};

describe("FilterDescriptor", () => {
  it("should create FilterDescriptor with correct label", () => {
    const descriptor = new FilterDescriptor("Test Label");
    expect(descriptor.label).toBe("Test Label");
  });

  it("should have empty description", () => {
    const descriptor = new FilterDescriptor("Test");
    expect(descriptor.description).toBe("");
  });

  it("should always show", () => {
    const descriptor = new FilterDescriptor("Test");
    expect(descriptor.alwaysShow).toBe(true);
  });
});

describe("toEscapedCriteriaString", () => {
  it("should create criteria string for single filter", () => {
    const result = toEscapedCriteriaString("PROG*", "name");
    expect(result).toBe("(name=PROG*)");
  });

  it("should create criteria string for multiple filters", () => {
    const result = toEscapedCriteriaString("PROG*,CUST*,TEST*", "name");
    expect(result).toBe("(name=PROG* OR name=CUST* OR name=TEST*)");
  });

  it("should handle different attribute names", () => {
    const result = toEscapedCriteriaString("VALUE1,VALUE2", "attribute");
    expect(result).toBe("(attribute=VALUE1 OR attribute=VALUE2)");
  });
});

describe("Filter Utils tests", () => {

  it("should return quickpick object with history items", () => {

    const quickpick = buildQuickPick("MYRES", ["prev1", "prev2"]);

    expect(quickpick.items).toHaveLength(2);
    expect(quickpick.items[0]).toEqual({ label: "prev1" });
    expect(quickpick.items[1]).toEqual({ label: "prev2" });
    expect(quickpick.placeholder).toContain("Select a filter or type to create a new one (use commas to separate multiple values)");

  });

  it("should get pattern when user types exact match", async () => {
    setupSingleQuickPick("NEWPATTERN", { label: "NEWPATTERN" });
    
    const pattern = await getPatternFromFilter("MYRES", ["prev1"], false);
    expect(pattern).toEqual("NEWPATTERN");
  });

  it("should get pattern when user types without selecting", async () => {
    setupSingleQuickPick("TYPED*", undefined);
    
    const pattern = await getPatternFromFilter("MYRES", ["prev1"], false);
    expect(pattern).toEqual("TYPED*");
  });

  it("should return undefined when no selection and no input", async () => {
    setupSingleQuickPick("", undefined);
    
    const pattern = await getPatternFromFilter("MYRES", ["prev1"], false);
    expect(pattern).toBeUndefined();
  });

  it("should show edit quickpick when user clicks history item", async () => {
    const { mockEditQuickPick } = setupDualQuickPick(
      "",
      "prev1",
      { label: "prev1" },
      { label: "prev1", description: "Press Enter to use this filter" }
    );
    
    const pattern = await getPatternFromFilter("MYRES", ["prev1"], false);
    expect(pattern).toEqual("PREV1");
    expect(mockEditQuickPick.show).toHaveBeenCalled();
  });

  it("should show edit quickpick when user types to filter then clicks different item", async () => {
    const { mockEditQuickPick } = setupDualQuickPick(
      "PRE",
      "prev1",
      { label: "prev1" },
      { label: "prev1", description: "Press Enter to use this filter" }
    );
    
    const pattern = await getPatternFromFilter("MYRES", ["prev1"], false);
    expect(pattern).toEqual("PREV1");
    expect(mockEditQuickPick.show).toHaveBeenCalled();
  });

  it("should convert to uppercase when case insensitive", async () => {
    setupSingleQuickPick("lowercase*", undefined);
    
    const pattern = await getPatternFromFilter("MYRES", [], false);
    expect(pattern).toEqual("LOWERCASE*");
  });

  it("should preserve case when case sensitive", async () => {
    setupSingleQuickPick("MixedCase*", undefined);
    
    const pattern = await getPatternFromFilter("MYRES", [], true);
    expect(pattern).toEqual("MixedCase*");
  });

  it("should remove whitespace from pattern", async () => {
    setupSingleQuickPick("PAT TERN*", undefined);
    
    const pattern = await getPatternFromFilter("MYRES", [], false);
    expect(pattern).toEqual("PATTERN*");
  });

  it("should handle comma-separated patterns", async () => {
    setupSingleQuickPick("PAT1*, PAT2*", undefined);
    
    const pattern = await getPatternFromFilter("MYRES", [], false);
    expect(pattern).toEqual("PAT1*,PAT2*");
  });


  it("should show input box when 'Edit filter' option is selected", async () => {
    setupDualQuickPick(
      "",
      "prev1",
      { label: "prev1" },
      { label: "Edit filter", description: "Modify the filter before applying" }
    );
    jest.spyOn(Gui, "showInputBox").mockResolvedValueOnce("INPUTBOX*");
    
    const pattern = await getPatternFromFilter("MYRES", ["prev1"], false);
    expect(pattern).toEqual("INPUTBOX*");
    expect(Gui.showInputBox).toHaveBeenCalled();
  });

  it("should return undefined when pattern is empty after input", async () => {
    setupDualQuickPick(
      "",
      "prev1",
      { label: "prev1" },
      { label: "Edit filter", description: "Modify the filter before applying" }
    );
    jest.spyOn(Gui, "showInputBox").mockResolvedValueOnce("");
    
    const pattern = await getPatternFromFilter("MYRES", ["prev1"], false);
    expect(pattern).toBeUndefined();
  });
});
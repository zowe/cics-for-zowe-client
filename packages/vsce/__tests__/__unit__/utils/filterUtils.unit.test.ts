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
    const mockQuickPick = {
      show: jest.fn(),
      hide: jest.fn(),
      value: "NEWPATTERN",
    };
    jest.spyOn(Gui, "createQuickPick").mockReturnValue(mockQuickPick as any);
    jest.spyOn(Gui, "resolveQuickPick").mockResolvedValueOnce({ label: "NEWPATTERN" });
    
    const pattern = await getPatternFromFilter("MYRES", ["prev1"], false);
    expect(pattern).toEqual("NEWPATTERN");
  });

  it("should get pattern when user types without selecting", async () => {
    const mockQuickPick = {
      show: jest.fn(),
      hide: jest.fn(),
      value: "TYPED*",
    };
    jest.spyOn(Gui, "createQuickPick").mockReturnValue(mockQuickPick as any);
    jest.spyOn(Gui, "resolveQuickPick").mockResolvedValueOnce(undefined);
    
    const pattern = await getPatternFromFilter("MYRES", ["prev1"], false);
    expect(pattern).toEqual("TYPED*");
  });

  it("should return undefined when no selection and no input", async () => {
    const mockQuickPick = {
      show: jest.fn(),
      hide: jest.fn(),
      value: "",
    };
    jest.spyOn(Gui, "createQuickPick").mockReturnValue(mockQuickPick as any);
    jest.spyOn(Gui, "resolveQuickPick").mockResolvedValueOnce(undefined);
    
    const pattern = await getPatternFromFilter("MYRES", ["prev1"], false);
    expect(pattern).toBeUndefined();
  });

  it("should show edit quickpick when user clicks history item", async () => {
    const mockQuickPick = {
      show: jest.fn(),
      hide: jest.fn(),
      value: "",
    };
    const mockEditQuickPick = {
      show: jest.fn(),
      hide: jest.fn(),
      value: "prev1",
    };
    
    let callCount = 0;
    jest.spyOn(Gui, "createQuickPick").mockImplementation(() => {
      callCount++;
      return callCount === 1 ? mockQuickPick as any : mockEditQuickPick as any;
    });
    
    jest.spyOn(Gui, "resolveQuickPick")
      .mockResolvedValueOnce({ label: "prev1" })
      .mockResolvedValueOnce({ label: "prev1", description: "Press Enter to use this filter" });
    
    const pattern = await getPatternFromFilter("MYRES", ["prev1"], false);
    expect(pattern).toEqual("PREV1");
    expect(mockEditQuickPick.show).toHaveBeenCalled();
  });

  it("should show edit quickpick when user types to filter then clicks different item", async () => {
    const mockQuickPick = {
      show: jest.fn(),
      hide: jest.fn(),
      value: "PRE",
    };
    const mockEditQuickPick = {
      show: jest.fn(),
      hide: jest.fn(),
      value: "prev1",
    };
    
    let callCount = 0;
    jest.spyOn(Gui, "createQuickPick").mockImplementation(() => {
      callCount++;
      return callCount === 1 ? mockQuickPick as any : mockEditQuickPick as any;
    });
    
    jest.spyOn(Gui, "resolveQuickPick")
      .mockResolvedValueOnce({ label: "prev1" })
      .mockResolvedValueOnce({ label: "prev1", description: "Press Enter to use this filter" });
    
    const pattern = await getPatternFromFilter("MYRES", ["prev1"], false);
    expect(pattern).toEqual("PREV1");
    expect(mockEditQuickPick.show).toHaveBeenCalled();
  });

  it("should convert to uppercase when case insensitive", async () => {
    const mockQuickPick = {
      show: jest.fn(),
      hide: jest.fn(),
      value: "lowercase*",
    };
    jest.spyOn(Gui, "createQuickPick").mockReturnValue(mockQuickPick as any);
    jest.spyOn(Gui, "resolveQuickPick").mockResolvedValueOnce(undefined);
    
    const pattern = await getPatternFromFilter("MYRES", [], false);
    expect(pattern).toEqual("LOWERCASE*");
  });

  it("should preserve case when case sensitive", async () => {
    const mockQuickPick = {
      show: jest.fn(),
      hide: jest.fn(),
      value: "MixedCase*",
    };
    jest.spyOn(Gui, "createQuickPick").mockReturnValue(mockQuickPick as any);
    jest.spyOn(Gui, "resolveQuickPick").mockResolvedValueOnce(undefined);
    
    const pattern = await getPatternFromFilter("MYRES", [], true);
    expect(pattern).toEqual("MixedCase*");
  });

  it("should remove whitespace from pattern", async () => {
    const mockQuickPick = {
      show: jest.fn(),
      hide: jest.fn(),
      value: "PAT TERN*",
    };
    jest.spyOn(Gui, "createQuickPick").mockReturnValue(mockQuickPick as any);
    jest.spyOn(Gui, "resolveQuickPick").mockResolvedValueOnce(undefined);
    
    const pattern = await getPatternFromFilter("MYRES", [], false);
    expect(pattern).toEqual("PATTERN*");
  });

  it("should handle comma-separated patterns", async () => {
    const mockQuickPick = {
      show: jest.fn(),
      hide: jest.fn(),
      value: "PAT1*, PAT2*",
    };
    jest.spyOn(Gui, "createQuickPick").mockReturnValue(mockQuickPick as any);
    jest.spyOn(Gui, "resolveQuickPick").mockResolvedValueOnce(undefined);
    
    const pattern = await getPatternFromFilter("MYRES", [], false);
    expect(pattern).toEqual("PAT1*,PAT2*");
  });


  it("should show input box when 'Edit filter' option is selected", async () => {
    const mockQuickPick = {
      show: jest.fn(),
      hide: jest.fn(),
      value: "",
    };
    const mockEditQuickPick = {
      show: jest.fn(),
      hide: jest.fn(),
      value: "prev1",
    };
    
    let callCount = 0;
    jest.spyOn(Gui, "createQuickPick").mockImplementation(() => {
      callCount++;
      return callCount === 1 ? mockQuickPick as any : mockEditQuickPick as any;
    });
    
    jest.spyOn(Gui, "resolveQuickPick")
      .mockResolvedValueOnce({ label: "prev1" })
      .mockResolvedValueOnce({ label: "Edit filter", description: "Modify the filter before applying" });
    
    jest.spyOn(Gui, "showInputBox").mockResolvedValueOnce("INPUTBOX*");
    
    const pattern = await getPatternFromFilter("MYRES", ["prev1"], false);
    expect(pattern).toEqual("INPUTBOX*");
    expect(Gui.showInputBox).toHaveBeenCalled();
  });

  it("should return undefined when pattern is empty after input", async () => {
    const mockQuickPick = {
      show: jest.fn(),
      hide: jest.fn(),
      value: "",
    };
    const mockEditQuickPick = {
      show: jest.fn(),
      hide: jest.fn(),
      value: "prev1",
    };
    
    let callCount = 0;
    jest.spyOn(Gui, "createQuickPick").mockImplementation(() => {
      callCount++;
      return callCount === 1 ? mockQuickPick as any : mockEditQuickPick as any;
    });
    
    jest.spyOn(Gui, "resolveQuickPick")
      .mockResolvedValueOnce({ label: "prev1" })
      .mockResolvedValueOnce({ label: "Edit filter", description: "Modify the filter before applying" });
    
    jest.spyOn(Gui, "showInputBox").mockResolvedValueOnce("");
    
    const pattern = await getPatternFromFilter("MYRES", ["prev1"], false);
    expect(pattern).toBeUndefined();
  });
});
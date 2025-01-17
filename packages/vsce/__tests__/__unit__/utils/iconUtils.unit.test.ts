import { getIconByStatus, getIconOpen, getIconPathInResources, getIconRootName } from "../../../src/utils/iconUtils";

const iconPath = {
  light: "/program-light.svg",
  dark: "/program-dark.svg",
};

describe("Test suite for iconUtils", () => {
  describe("Test suite for getIconPathResources", () => {
    it("Should return icon path for dark and light theme", () => {
      const result = getIconPathInResources("program");
      expect(result.dark).toContain(iconPath.dark);
      expect(result.light).toContain(iconPath.light);
    });
  });

  describe("Test suite for getIconOpen", () => {
    it("Should return icon path for folder open when true", () => {
      const result = getIconOpen(true);
      expect(result.dark).toContain("folder-open-dark");
      expect(result.light).toContain("folder-open-light");
    });
    it("Should return icon path for folder closed when false", () => {
      const result = getIconOpen(false);
      expect(result.dark).toContain("folder-closed-dark");
      expect(result.light).toContain("folder-closed-light");
    });
  });

  describe("Test suite for getIconRootName", () => {
    //  Using the common object for resourcesTreeItem
    const resourceTreeItem = {
      status: "",
      openstatus: "",
      enablestatus: "",
      runstatus: "",
    };
    it("Should return program-disabled for PROGRAM resource with DISABLED status", () => {
      resourceTreeItem.status = "DISABLED";
      const result = getIconRootName("PROGRAM", resourceTreeItem);
      expect(result).toBe("program-disabled");
    });
    it("Should return program for PROGRAM resource with ENABLED status", () => {
      resourceTreeItem.status = "ENABLED";
      const result = getIconRootName("PROGRAM", resourceTreeItem);
      expect(result).toBe("program");
    });
    it("Should return local-transaction-disabled for TRANSACTION resource with DISABLED status", () => {
      resourceTreeItem.status = "DISABLED";
      const result = getIconRootName("TRANSACTION", resourceTreeItem);
      expect(result).toBe("local-transaction-disabled");
    });
    it("Should return local-transaction for TRANSACTION resource with ENABLED status", () => {
      resourceTreeItem.status = "ENABLED";
      const result = getIconRootName("TRANSACTION", resourceTreeItem);
      expect(result).toBe("local-transaction");
    });
    it("Should return local-file-disabled-closed for LOCAL_FILE resource with openstatus as CLOSED and enablestatus as CLOSED", () => {
      resourceTreeItem.openstatus = "CLOSED";
      resourceTreeItem.enablestatus = "DISABLED";
      const result = getIconRootName("LOCAL_FILE", resourceTreeItem);
      expect(result).toBe("local-file-disabled-closed");
    });
    it("Should return local-file-closed for LOCAL_FILE resource with openstatus as CLOSED", () => {
      resourceTreeItem.enablestatus = "ENABLED";
      resourceTreeItem.openstatus = "CLOSED";
      const result = getIconRootName("LOCAL_FILE", resourceTreeItem);
      expect(result).toBe("local-file-closed");
    });
    it("Should return local-file-disabled for LOCAL_FILE resource with enablestatus as DISABLED", () => {
      resourceTreeItem.openstatus = "OPEN";
      resourceTreeItem.enablestatus = "DISABLED";
      const result = getIconRootName("LOCAL_FILE", resourceTreeItem);
      expect(result).toBe("local-file-disabled");
    });
    it("Should return local-file for LOCAL_FILE resource with enablestatus as ENABLED and openstatus as OPEM", () => {
      resourceTreeItem.enablestatus = "ENABLED";
      resourceTreeItem.openstatus = "OPEN";
      const result = getIconRootName("LOCAL_FILE", resourceTreeItem);
      expect(result).toBe("local-file");
    });
    it("Should return task-running for TASK resource with runstatus as RUNNING", () => {
      resourceTreeItem.runstatus = "RUNNING";
      const result = getIconRootName("TASK", resourceTreeItem);
      expect(result).toBe("task-running");
    });
    it("Should return task-suspended for TASK resource with runstatus as SUSPENDED", () => {
      resourceTreeItem.runstatus = "SUSPENDED";
      const result = getIconRootName("TASK", resourceTreeItem);
      expect(result).toBe("task-suspended");
    });
    it("Should return task-dispatched for TASK resource with runstatus as DISPATCHED", () => {
      resourceTreeItem.runstatus = "DISPATCHED";
      const result = getIconRootName("TASK", resourceTreeItem);
      expect(result).toBe("task-dispatched");
    });
  });

  describe("Test suite for getIconByStatus", () => {
    const resource = {
      status: "DISABLED",
    };
    it("Should return icon based on resource status", () => {
      const result = getIconByStatus("PROGRAM", resource);
      expect(result.dark).toContain("program-disabled");
    });
  });
});

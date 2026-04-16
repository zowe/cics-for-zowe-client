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

import { CICSSession } from "@zowe/cics-for-zowe-sdk";
import type { imperative } from "@zowe/zowe-explorer-api";
// Import all interfaces to ensure they're included in coverage reporting
import "../../src/interfaces";
import type { IExtensionAPI } from "../../src/interfaces/IExtensionAPI";
import type {
  IResourceContext,
  IResourceRegionInfo,
  IResourceProfileNameInfo,
  IResourceProfileInfo,
} from "../../src/interfaces/IResourceContext";

import type { IResourceExtender } from "../../src/interfaces/IResourceExtender";
import { ResourceAction, type ResourceTypeMap } from "../../src/interfaces/ResourceAction";
import type {
  IProgram,
  IResource,
  IResourceWithStatus,
  IResourceWithEnableStatus,
  IBundle,
  IBundlePart,
  IJVMEndpoint,
  IJVMServer,
  ILibrary,
  ILibraryDataset,
  ILocalFile,
  IManagedRegion,
  IPipeline,
  IRegion,
  IRemoteFile,
  ISharedTSQueue,
  ITCPIP,
  ITSQueue,
  ITask,
  ITransaction,
  IURIMap,
  IWebService,
} from "../../src/interfaces/resources";
import { ResourceTypes, SupportedResourceTypes } from "../../src/resources";

describe("Interfaces", () => {
  const action = new ResourceAction({
    id: "CICS.CICSProgram.NEWCOPY",
    name: "New Copy Program",
    resourceType: ResourceTypes.CICSProgram,
    action: async (_resource: IProgram, _resourceContext: IResourceContext) => {},
    visibleWhen(_resource, _resourceContext) {
      return true;
    },
  });

  const extender: IResourceExtender = {
    registeredActions: new Map(),
    registerAction: function <TType extends keyof ResourceTypeMap>(acc: ResourceAction<TType>) {
      const arr = this.registeredActions.get(acc.resourceType) || [];
      arr.push(acc as unknown as ResourceAction<keyof ResourceTypeMap>);
      this.registeredActions.set(acc.resourceType, arr);
      return { dispose: () => {} };
    },
    getActions: function (): ResourceAction<keyof ResourceTypeMap>[] {
      return [...this.registeredActions.values()].flat() as ResourceAction<keyof ResourceTypeMap>[];
    },
    getAction: function (id: string): ResourceAction<keyof ResourceTypeMap> | undefined {
      const actions = this.getActions().filter((ac: ResourceAction<keyof ResourceTypeMap>) => ac.id === id);
      if (actions.length > 0) {
        return actions[0] as ResourceAction<keyof ResourceTypeMap>;
      }
      return undefined;
    },
    getActionsFor: function <TType extends keyof ResourceTypeMap>(type: TType): ResourceAction<TType>[] {
      return (this.registeredActions.get(type) || []) as unknown as ResourceAction<TType>[];
    },
  };

  const api: IExtensionAPI = {
    resources: {
      supportedResources: SupportedResourceTypes,
      resourceExtender: extender,
    },
  };

  const res: IResource = {
    eyu_cicsname: "REGION1",
  };

  const profile: imperative.IProfileLoaded = {
    failNotFound: false,
    message: "",
    type: "cics",
    name: "MYPROF",
    profile: {
      host: "MYHOST",
      port: 1234,
    },
  };

  const session: CICSSession = new CICSSession(profile.profile as any);

  const cx: IResourceContext = {
    profile,
    cicsplexName: "myplex",
    regionName: "REGION1",
    session,
  };

  describe("ResourceAction", () => {
    it("should create ResourceAction with all required properties", () => {
      expect(action).toHaveProperty("id");
      expect(action).toHaveProperty("name");
      expect(action).toHaveProperty("resourceType");
      expect(action).toHaveProperty("action");
      expect(action).toHaveProperty("visibleWhen");
      expect(action).toHaveProperty("refreshResourceInspector");
    });

    it("should access ResourceAction getters with correct values", () => {
      expect(action.id).toBe("CICS.CICSProgram.NEWCOPY");
      expect(action.name).toBe("New Copy Program");
      expect(action.resourceType).toBe(ResourceTypes.CICSProgram);
      expect(action.action).toBeDefined();
      expect(action.visibleWhen).toBeDefined();
      expect(action.refreshResourceInspector).toBe(true);
    });

    it("should create ResourceAction with refreshResourceInspector set to false", () => {
      const actionNoRefresh = new ResourceAction({
        id: "test.action",
        name: "Test Action",
        resourceType: ResourceTypes.CICSProgram,
        action: "test.command",
        refreshResourceInspector: false,
      });
      expect(actionNoRefresh.refreshResourceInspector).toBe(false);
    });

    it("should create ResourceAction with string action command", () => {
      const stringAction = new ResourceAction({
        id: "test.string.action",
        name: "Test String Action",
        resourceType: ResourceTypes.CICSProgram,
        action: "test.command.string",
      });
      expect(stringAction.action).toBe("test.command.string");
    });

    it("should create ResourceAction without optional visibleWhen parameter", () => {
      const noVisibleWhen = new ResourceAction({
        id: "test.no.visible",
        name: "Test No Visible",
        resourceType: ResourceTypes.CICSProgram,
        action: "test.command",
      });
      expect(noVisibleWhen.visibleWhen).toBeUndefined();
    });

    it("should handle explicitly undefined visibleWhen parameter", () => {
      const explicitUndefined = new ResourceAction({
        id: "test.explicit.undefined",
        name: "Test Explicit Undefined",
        resourceType: ResourceTypes.CICSProgram,
        action: "test.command",
        visibleWhen: undefined,
      });
      expect(explicitUndefined.visibleWhen).toBeUndefined();
    });

    it("should handle async visibleWhen function returning Promise", async () => {
      const asyncAction = new ResourceAction({
        id: "test.async.visible",
        name: "Test Async Visible",
        resourceType: ResourceTypes.CICSProgram,
        action: "test.command",
        visibleWhen: async () => Promise.resolve(true),
      });
      const result = await asyncAction.visibleWhen?.({} as IProgram, {} as IResourceContext);
      expect(result).toBe(true);
    });

    it("should handle empty string action command", () => {
      const emptyAction = new ResourceAction({
        id: "test.empty.action",
        name: "Test Empty Action",
        resourceType: ResourceTypes.CICSProgram,
        action: "",
      });
      expect(emptyAction.action).toBe("");
    });
  });

  describe("IResourceExtender", () => {
    it("should have all required interface properties", () => {
      expect(extender).toHaveProperty("registeredActions");
      expect(extender).toHaveProperty("registerAction");
      expect(extender).toHaveProperty("getAction");
      expect(extender).toHaveProperty("getActions");
      expect(extender).toHaveProperty("getActionsFor");
    });

    it("should register action and retrieve it by type", () => {
      const testAction = new ResourceAction({
        id: "test.action.id",
        name: "Test Action",
        resourceType: ResourceTypes.CICSProgram,
        action: "test.command",
      });
      
      extender.registerAction(testAction);
      const actions = extender.getActionsFor(ResourceTypes.CICSProgram);
      expect(actions).toContain(testAction);
      expect(actions.length).toBeGreaterThan(0);
    });

    it("should retrieve registered action by id", () => {
      const retrieved = extender.getAction("test.action.id");
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe("test.action.id");
    });

    it("should return undefined for non-existent action id", () => {
      const retrieved = extender.getAction("non.existent.action");
      expect(retrieved).toBeUndefined();
    });

    it("should get all registered actions", () => {
      const actions = extender.getActions();
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBeGreaterThan(0);
    });

    it("should get actions for specific resource type", () => {
      const testAction = new ResourceAction({
        id: "test.specific.action",
        name: "Test Specific Action",
        resourceType: ResourceTypes.CICSProgram,
        action: "test.command",
      });
      
      extender.registerAction(testAction);
      const programActions = extender.getActionsFor(ResourceTypes.CICSProgram);
      expect(Array.isArray(programActions)).toBe(true);
      expect(programActions).toContain(testAction);
    });
  });

  describe("IExtensionAPI", () => {
    it("should have correct API structure with resources property", () => {
      expect(api).toHaveProperty("resources");
      expect(api.resources).toHaveProperty("supportedResources");
      expect(api.resources).toHaveProperty("resourceExtender");
    });

    it("should have valid array of supported resource types", () => {
      expect(Array.isArray(api.resources.supportedResources)).toBe(true);
      expect(api.resources.supportedResources.length).toBeGreaterThan(0);
    });
  });

  describe("IResource base interfaces", () => {
    it("should validate IResource with eyu_cicsname property", () => {
      expect(res).toHaveProperty("eyu_cicsname");
      expect(res.eyu_cicsname).toBe("REGION1");
    });

    it("should validate IResourceWithStatus interface structure", () => {
      const resWithStatus: IResourceWithStatus = {
        eyu_cicsname: "REGION1",
        status: "ENABLED",
      };
      expect(resWithStatus).toHaveProperty("eyu_cicsname");
      expect(resWithStatus).toHaveProperty("status");
    });

    it("should validate IResourceWithEnableStatus interface structure", () => {
      const resWithEnableStatus: IResourceWithEnableStatus = {
        eyu_cicsname: "REGION1",
        enablestatus: "ENABLED",
      };
      expect(resWithEnableStatus).toHaveProperty("eyu_cicsname");
      expect(resWithEnableStatus).toHaveProperty("enablestatus");
    });
  });

  describe("IResourceContext interfaces", () => {
    it("should validate IResourceContext with all required properties", () => {
      expect(cx).toHaveProperty("session");
      expect(cx).toHaveProperty("profile");
      expect(cx).toHaveProperty("cicsplexName");
      expect(cx).toHaveProperty("regionName");
    });

    it("should validate IResourceRegionInfo interface structure", () => {
      const regionInfo: IResourceRegionInfo = {
        regionName: "REGION1",
        cicsplexName: "PLEX1",
      };
      expect(regionInfo).toHaveProperty("regionName");
      expect(regionInfo).toHaveProperty("cicsplexName");
      expect(regionInfo.cicsplexName).toBe("PLEX1");
    });

    it("should validate IResourceProfileNameInfo interface structure", () => {
      const profileNameInfo: IResourceProfileNameInfo = {
        regionName: "REGION1",
        profileName: "MYPROF",
      };
      expect(profileNameInfo).toHaveProperty("regionName");
      expect(profileNameInfo).toHaveProperty("profileName");
    });

    it("should validate IResourceProfileInfo interface structure", () => {
      const profileInfo: IResourceProfileInfo = {
        regionName: "REGION1",
        profile: profile,
      };
      expect(profileInfo).toHaveProperty("regionName");
      expect(profileInfo).toHaveProperty("profile");
    });
  });

  describe("Resource type interfaces", () => {
    // Data-driven test configuration for all resource types
    const resourceTestCases = [
      {
        name: "IProgram",
        factory: (): IProgram => ({
          eyu_cicsname: "REGION1",
          status: "ENABLED",
          library: "MYLIB",
          librarydsn: "MY.LIBRARY.DSN",
          program: "PROG001",
          progtype: "COBOL",
          newcopycnt: "0",
          usecount: "5",
          language: "COBOL",
          jvmserver: "",
        }),
        requiredProps: ["program", "library", "status"],
      },
      {
        name: "ITransaction",
        factory: (): ITransaction => ({
          eyu_cicsname: "REGION1",
          status: "ENABLED",
          tranid: "TRAN",
          program: "PROG001",
          availstatus: "AVAILABLE",
          tranclass: "CLASS1",
          routing: "LOCAL",
        }),
        requiredProps: ["tranid", "program", "status"],
      },
      {
        name: "IBundle",
        factory: (): IBundle => ({
          eyu_cicsname: "REGION1",
          enablestatus: "ENABLED",
          bundledir: "/path/to/bundle",
          bundleid: "BUNDLE1",
          name: "MyBundle",
          partcount: "5",
          availstatus: "AVAILABLE",
        }),
        requiredProps: ["bundleid", "bundledir", "enablestatus"],
      },
      {
        name: "IBundlePart",
        factory: (): IBundlePart => ({
          eyu_cicsname: "REGION1",
          enablestatus: "ENABLED",
          bundle: "BUNDLE1",
          bundlepart: "PART1",
          partclass: "PROGRAM",
          availstatus: "AVAILABLE",
          parttype: "OSGI",
        }),
        requiredProps: ["bundle", "bundlepart", "partclass"],
      },
      {
        name: "IJVMServer",
        factory: (): IJVMServer => ({
          eyu_cicsname: "REGION1",
          enablestatus: "ENABLED",
          name: "JVMSRV1",
          profile: "PROFILE1",
          javahome: "/java/home",
          threadlimit: "100",
          log: "STDOUT",
          definetime: "2024-01-01",
          changetime: "2024-01-02",
          changeusrid: "USER1",
        }),
        requiredProps: ["name", "profile", "javahome"],
      },
      {
        name: "IJVMEndpoint",
        factory: (): IJVMEndpoint => ({
          eyu_cicsname: "REGION1",
          enablestatus: "ENABLED",
          jvmendpoint: "ENDPOINT1",
          jvmserver: "JVMSRV1",
          port: "8080",
          secport: "8443",
        }),
        requiredProps: ["jvmendpoint", "jvmserver", "port"],
      },
      {
        name: "ILibrary",
        factory: (): ILibrary => ({
          eyu_cicsname: "REGION1",
          enablestatus: "ENABLED",
          name: "LIB1",
          dsname: "MY.LIBRARY.DSN",
          ranking: "1",
          numdsnames: "5",
        }),
        requiredProps: ["name", "dsname", "ranking"],
      },
      {
        name: "ILibraryDataset",
        factory: (): ILibraryDataset => ({
          eyu_cicsname: "REGION1",
          dsname: "MY.LIBRARY.DSN",
          library: "LIB1",
          dsnum: "1",
          searchpos: "1",
        }),
        requiredProps: ["library", "dsname", "dsnum"],
      },
      {
        name: "ILocalFile",
        factory: (): ILocalFile => ({
          eyu_cicsname: "REGION1",
          enablestatus: "ENABLED",
          file: "FILE1",
          dsname: "MY.FILE.DSN",
          vsamtype: "KSDS",
          read: "YES",
          browse: "YES",
          keylength: "10",
          recordsize: "80",
          openstatus: "OPEN",
          update: "YES",
          add: "YES",
          delete: "YES",
        }),
        requiredProps: ["file", "dsname", "vsamtype"],
      },
      {
        name: "IRemoteFile",
        factory: (): IRemoteFile => ({
          eyu_cicsname: "REGION1",
          enablestatus: "ENABLED",
          file: "RFILE1",
          remotename: "REMOTE1",
          remotesystem: "SYS1",
        }),
        requiredProps: ["file", "remotename", "remotesystem"],
      },
      {
        name: "IPipeline",
        factory: (): IPipeline => ({
          eyu_cicsname: "REGION1",
          enablestatus: "ENABLED",
          name: "PIPE1",
          configfile: "/path/to/config",
          soaplevel: "1.1",
          wsdir: "/ws/dir",
        }),
        requiredProps: ["name", "configfile", "soaplevel"],
      },
      {
        name: "IURIMap",
        factory: (): IURIMap => ({
          eyu_cicsname: "REGION1",
          enablestatus: "ENABLED",
          name: "URIMAP1",
          path: "/api/test",
          scheme: "HTTP",
          transaction: "TRAN",
          pipeline: "PIPE1",
          webservice: "WEBSVC1",
        }),
        requiredProps: ["name", "path", "scheme"],
      },
      {
        name: "IWebService",
        factory: (): IWebService => ({
          eyu_cicsname: "REGION1",
          name: "WEBSVC1",
          state: "ENABLED",
          wsbind: "BIND1",
          program: "PROG1",
          pipeline: "PIPE1",
          urimap: "URIMAP1",
          container: "CONT1",
          wsdlfile: "/path/to/wsdl",
        }),
        requiredProps: ["name", "pipeline", "wsbind", "state"],
      },
      {
        name: "ITCPIP",
        factory: (): ITCPIP => ({
          eyu_cicsname: "REGION1",
          name: "TCPIP1",
          port: "8080",
          protocol: "HTTP",
          transid: "TRAN",
          urm: "URM1",
          attls: "NO",
          ssltype: "NONE",
          openstatus: "OPEN",
        }),
        requiredProps: ["name", "port", "protocol", "openstatus"],
      },
      {
        name: "ITSQueue",
        factory: (): ITSQueue => ({
          eyu_cicsname: "REGION1",
          name: "TSQ1",
          location: "MAIN",
          numitems: "10",
          hexname: "54535131",
          quelength: "100",
          expiryint: "0",
          transid: "TRAN",
          tsmodel: "MODEL1",
        }),
        requiredProps: ["name", "location", "numitems", "hexname"],
      },
      {
        name: "ISharedTSQueue",
        factory: (): ISharedTSQueue => ({
          eyu_cicsname: "REGION1",
          name: "STSQ1",
          poolname: "POOL1",
          location: "SHARED",
          hexname: "53545351",
        }),
        requiredProps: ["name", "poolname", "location"],
      },
      {
        name: "ITask",
        factory: (): ITask => ({
          eyu_cicsname: "REGION1",
          task: "12345",
          runstatus: "RUNNING",
          tranid: "TRAN",
          suspendtime: "0",
          suspendtype: "NONE",
          suspendvalue: "0",
          currentprog: "PROG001",
          userid: "USER1",
        }),
        requiredProps: ["task", "runstatus", "tranid", "currentprog"],
      },
      {
        name: "IRegion",
        factory: (): IRegion => ({
          eyu_cicsname: "REGION1",
          applid: "APPLID1",
          startup: "AUTO",
          cicsname: "CICS1",
          cicsstatus: "ACTIVE",
        }),
        requiredProps: ["eyu_cicsname", "applid", "cicsname"],
      },
      {
        name: "IManagedRegion",
        factory: (): IManagedRegion => ({
          eyu_cicsname: "REGION1",
          cicsname: "CICS1",
          cicsstate: "ACTIVE",
          secbypass: "NO",
          wlmstatus: "ENABLED",
        }),
        requiredProps: ["cicsname", "cicsstate", "wlmstatus"],
      },
    ];

    // Generate tests for all resource types using data-driven approach
    resourceTestCases.forEach(({ name, factory, requiredProps }) => {
      it(`should validate ${name} interface with all required properties`, () => {
        const resource = factory();
        
        // Validate all required properties exist
        requiredProps.forEach((prop) => {
          expect(resource).toHaveProperty(prop);
        });
        
        // Validate base property exists
        expect(resource).toHaveProperty("eyu_cicsname");
      });
    });
  });

  describe("ResourceTypeMap", () => {
    it("should map all ResourceTypes enum values to their corresponding interfaces", () => {
      const typeMap: ResourceTypeMap = {
        [ResourceTypes.CICSProgram]: {} as IProgram,
        [ResourceTypes.CICSLocalFile]: {} as ILocalFile,
        [ResourceTypes.CICSRemoteFile]: {} as IRemoteFile,
        [ResourceTypes.CICSLocalTransaction]: {} as ITransaction,
        [ResourceTypes.CICSTCPIPService]: {} as ITCPIP,
        [ResourceTypes.CICSLibrary]: {} as ILibrary,
        [ResourceTypes.CICSURIMap]: {} as IURIMap,
        [ResourceTypes.CICSTask]: {} as ITask,
        [ResourceTypes.CICSPipeline]: {} as IPipeline,
        [ResourceTypes.CICSWebService]: {} as IWebService,
        [ResourceTypes.CICSJVMServer]: {} as IJVMServer,
        [ResourceTypes.CICSBundle]: {} as IBundle,
        [ResourceTypes.CICSTSQueue]: {} as ITSQueue,
        [ResourceTypes.CICSSharedTSQueue]: {} as ISharedTSQueue,
        [ResourceTypes.CICSManagedRegion]: {} as IManagedRegion,
        [ResourceTypes.CICSRegion]: {} as IRegion,
      };
      const expectedResourceTypeCount = 16;
      expect(typeMap).toBeDefined();
      expect(Object.keys(typeMap).length).toBe(expectedResourceTypeCount);
    });
  });
});
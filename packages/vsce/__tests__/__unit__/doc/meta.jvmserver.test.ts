import { JVMServerMeta } from "../../../src/doc/meta/JVMServer.meta";
import { IJVMServer } from "../../../src/doc/resources/IJVMServer";
import { Resource } from "../../../src/resources";

describe("JVMServer Meta", () => {
  let jvmserverMock: Resource<IJVMServer>;

  beforeEach(() => {
    jvmserverMock = new Resource({
      eyu_cicsname: "MYREG",
      name: "JVM1",
      status: "ENABLED",
      enablestatus: "ENABLED",
    });
  });
  it("should return icon name", () => {
    const iconName = JVMServerMeta.getIconName(jvmserverMock);
    expect(iconName).toEqual(`jvm-server`);
  });
});
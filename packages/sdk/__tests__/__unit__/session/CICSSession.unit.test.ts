/**
 * Unit tests for CICSSession
 */

import { SessConstants } from "@zowe/imperative";
import { CICSSession } from "../../../src/core/CICSSession";

// Helper to peek into protected Session internals
const asAny = (obj: unknown): any => obj as any;

describe("CICSSession", () => {
  const baseProfile: any = {
    host: "example.ibm.com",
    port: 10000,
    protocol: "https",
    rejectUnauthorized: true,
    cicsPlex: "PLEX1",
    regionName: "REG1",
  };

  it("constructs a token / LTPA session when no certs are present", () => {
    const profile = {
      ...baseProfile,
      user: "cicsuser",
      password: "secret",
    };

    const session = new CICSSession(profile);
    const anySession = asAny(session);

    // Common connection properties
    expect(anySession.mISession.hostname).toBe(profile.host);
    expect(anySession.mISession.port).toBe(Number(profile.port));
    expect(anySession.mISession.protocol).toBe(profile.protocol);
    expect(anySession.mISession.rejectUnauthorized).toBe(true);

    // Auth configuration
    expect(anySession.mISession.type).toBe(SessConstants.AUTH_TYPE_TOKEN);
    expect(anySession.mISession.tokenType).toBe(SessConstants.TOKEN_TYPE_LTPA);
    expect(anySession.mISession.storeCookie).toBe(true);
    expect(anySession.mISession.user).toBe(profile.user);
    expect(anySession.mISession.password).toBe(profile.password);

    // Cert fields should not be set
    expect(anySession.mISession.cert).toBeUndefined();
    expect(anySession.mISession.certKey).toBeUndefined();

    // CICS-specific metadata
    expect(session.cicsplexName).toBe(profile.cicsPlex);
    expect(session.regionName).toBe(profile.regionName);
  });

  it("constructs a CERT_PEM session when certFile and certKeyFile are present", () => {
    const profile = {
      ...baseProfile,
      certFile: "../../__resources__/properties/client.pem",
      certKeyFile: "../../__resources__/properties/client.key",
    };

    const session = new CICSSession(profile);
    const anySession = asAny(session);

    // Common connection properties
    expect(anySession.mISession.hostname).toBe(profile.host);
    expect(anySession.mISession.port).toBe(Number(profile.port));
    expect(anySession.mISession.protocol).toBe(profile.protocol);
    expect(anySession.mISession.rejectUnauthorized).toBe(true);

    // Auth configuration for client-cert
    expect(anySession.mISession.type).toBe(SessConstants.AUTH_TYPE_CERT_PEM);
    expect(anySession.mISession.storeCookie).toBe(false);

    // No token or basic credentials used
    expect(anySession.mISession.tokenType).toBeUndefined();
    expect(anySession.mISession.user).toBeUndefined();
    expect(anySession.mISession.password).toBeUndefined();

    // Cert fields mapped from profile
    expect(anySession.mISession.cert).toBe(profile.certFile);
    expect(anySession.mISession.certKey).toBe(profile.certKeyFile);

    // CICS-specific metadata
    expect(session.cicsplexName).toBe(profile.cicsPlex);
    expect(session.regionName).toBe(profile.regionName);
  });

  it("defaults user and password to empty strings when not supplied and no certs", () => {
    const profile = {
      ...baseProfile,
    };

    const session = new CICSSession(profile);
    const anySession = asAny(session);

    expect(anySession.mISession.user).toBe("");
    expect(anySession.mISession.password).toBe("");
  });
});

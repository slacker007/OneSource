import { describe, expect, it } from "vitest";

import {
  extractPemCertificates,
  getEndpointServername,
  getProxyBootstrapEndpoint,
  getProxyUrl,
  selectAuthorityCertificate,
  shouldBootstrapProxyCa,
} from "../../../scripts/bootstrap-container-proxy-ca.mjs";

describe("bootstrap-container-proxy-ca helpers", () => {
  it("prefers HTTPS proxy values before HTTP values", () => {
    expect(
      getProxyUrl({
        HTTPS_PROXY: "http://secure-proxy.internal:3128",
        HTTP_PROXY: "http://fallback-proxy.internal:8080",
      }),
    ).toBe("http://secure-proxy.internal:3128");
  });

  it("skips proxy CA bootstrap when trust is disabled", () => {
    expect(
      shouldBootstrapProxyCa({
        HTTPS_PROXY: "http://secure-proxy.internal:3128",
        CONTAINER_TRUST_PROXY_CA: "false",
      }),
    ).toBe(false);
  });

  it("uses the documented default endpoint when none is configured", () => {
    expect(getProxyBootstrapEndpoint({})).toBe("registry.npmjs.org:443");
    expect(getEndpointServername("registry.npmjs.org:443")).toBe(
      "registry.npmjs.org",
    );
  });

  it("extracts the authority certificate from an openssl chain dump", () => {
    const leafCertificate = [
      "-----BEGIN CERTIFICATE-----",
      "LEAF",
      "-----END CERTIFICATE-----",
    ].join("\n");
    const authorityCertificate = [
      "-----BEGIN CERTIFICATE-----",
      "AUTHORITY",
      "-----END CERTIFICATE-----",
    ].join("\n");
    const chainDump = [
      "CONNECTED(00000003)",
      leafCertificate,
      authorityCertificate,
      "Verify return code: 19 (self-signed certificate in certificate chain)",
    ].join("\n");

    expect(extractPemCertificates(chainDump)).toEqual([
      leafCertificate,
      authorityCertificate,
    ]);
    expect(
      selectAuthorityCertificate(extractPemCertificates(chainDump)),
    ).toBe(authorityCertificate);
  });
});

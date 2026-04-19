import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export function getProxyUrl(env = process.env) {
  return (
    env.HTTPS_PROXY ??
    env.https_proxy ??
    env.HTTP_PROXY ??
    env.http_proxy ??
    null
  );
}

export function shouldBootstrapProxyCa(env = process.env) {
  const configured = (env.CONTAINER_TRUST_PROXY_CA ?? "true").trim().toLowerCase();

  if (configured === "false" || configured === "0" || configured === "no") {
    return false;
  }

  return Boolean(getProxyUrl(env));
}

export function getProxyBootstrapEndpoint(env = process.env) {
  return env.CONTAINER_PROXY_CA_ENDPOINT?.trim() || "registry.npmjs.org:443";
}

export function getEndpointServername(endpoint) {
  const lastColonIndex = endpoint.lastIndexOf(":");

  if (lastColonIndex === -1) {
    return endpoint;
  }

  return endpoint.slice(0, lastColonIndex);
}

export function extractPemCertificates(text) {
  return text.match(
    /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g,
  ) ?? [];
}

export function selectAuthorityCertificate(certificates) {
  if (certificates.length === 0) {
    return null;
  }

  return certificates.at(-1) ?? null;
}

export function bootstrapProxyCa({
  env = process.env,
  outputPath = "/usr/local/share/ca-certificates/proxy-bootstrap.crt",
} = {}) {
  if (!shouldBootstrapProxyCa(env)) {
    return {
      outputPath,
      proxyUrl: getProxyUrl(env),
      skipped: true,
    };
  }

  const proxyUrl = new URL(getProxyUrl(env));
  const endpoint = getProxyBootstrapEndpoint(env);
  const servername = getEndpointServername(endpoint);
  const result = spawnSync(
    "openssl",
    [
      "s_client",
      "-proxy",
      proxyUrl.host,
      "-connect",
      endpoint,
      "-servername",
      servername,
      "-showcerts",
    ],
    {
      encoding: "utf8",
      input: "",
      maxBuffer: 5 * 1024 * 1024,
    },
  );

  const commandOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  const certificates = extractPemCertificates(commandOutput);
  const authorityCertificate = selectAuthorityCertificate(certificates);

  if (!authorityCertificate) {
    throw new Error(
      `Unable to extract a proxy CA certificate from ${proxyUrl.host} while probing ${endpoint}.`,
    );
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(`${outputPath}.tmp`, `${authorityCertificate}\n`);
  fs.renameSync(`${outputPath}.tmp`, outputPath);

  return {
    endpoint,
    outputPath,
    proxyUrl: proxyUrl.toString(),
    skipped: false,
  };
}

function main() {
  const result = bootstrapProxyCa();

  if (result.skipped) {
    console.log("Skipping proxy CA bootstrap because no trusted proxy is configured.");
    return;
  }

  console.log(
    `Bootstrapped proxy CA from ${result.proxyUrl} using ${result.endpoint} into ${result.outputPath}.`,
  );
}

const invokedPath = process.argv[1]
  ? path.resolve(process.argv[1])
  : null;
const currentPath = path.resolve(new URL(import.meta.url).pathname);

if (invokedPath === currentPath) {
  main();
}

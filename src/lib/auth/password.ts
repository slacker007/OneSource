import { scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_PREFIX = "scrypt";

export function verifyPasswordHash(
  candidatePassword: string,
  storedPasswordHash: string | null | undefined,
) {
  if (!storedPasswordHash) {
    return false;
  }

  const [algorithm, costFactor, blockSize, parallelization, salt, digest] =
    storedPasswordHash.split("$");

  if (
    algorithm !== SCRYPT_PREFIX ||
    !costFactor ||
    !blockSize ||
    !parallelization ||
    !salt ||
    !digest
  ) {
    return false;
  }

  const expectedDigest = Buffer.from(digest, "base64url");
  const derivedDigest = scryptSync(
    candidatePassword,
    Buffer.from(salt, "base64url"),
    expectedDigest.length,
    {
      N: Number.parseInt(costFactor, 10),
      r: Number.parseInt(blockSize, 10),
      p: Number.parseInt(parallelization, 10),
    },
  );

  return timingSafeEqual(derivedDigest, expectedDigest);
}

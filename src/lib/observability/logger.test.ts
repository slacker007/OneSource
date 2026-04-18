import { afterEach, describe, expect, it, vi } from "vitest";

import { createStructuredLogger, serializeError } from "./logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createStructuredLogger", () => {
  it("writes structured info logs as JSON", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const logger = createStructuredLogger("web");

    const entry = logger("info", "Health check completed.", {
      status: "ok",
    });

    expect(entry.service).toBe("web");
    expect(entry.level).toBe("info");
    expect(logSpy).toHaveBeenCalledWith(
      JSON.stringify({
        timestamp: entry.timestamp,
        service: "web",
        level: "info",
        message: "Health check completed.",
        detail: {
          status: "ok",
        },
      }),
    );
  });

  it("writes warnings and errors to the matching console methods", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const logger = createStructuredLogger("worker");

    logger("warn", "Connector rate limited.", { sourceSystem: "sam_gov" });
    logger("error", "Worker iteration failed.", { retryable: false });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});

describe("serializeError", () => {
  it("normalizes Error instances and unknown values", () => {
    const normalizedError = serializeError(new Error("Boom"));
    const normalizedUnknown = serializeError({ message: "ignored" });

    expect(normalizedError).toMatchObject({
      message: "Boom",
      name: "Error",
    });
    expect(normalizedUnknown).toEqual({
      message: "Unknown error",
      name: "UnknownError",
      stack: null,
    });
  });
});

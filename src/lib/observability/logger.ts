export type StructuredLogLevel = "info" | "warn" | "error";

export type StructuredLogEntry = {
  timestamp: string;
  service: string;
  level: StructuredLogLevel;
  message: string;
  detail?: Record<string, unknown>;
};

export function createStructuredLogger(service: string) {
  return (
    level: StructuredLogLevel,
    message: string,
    detail?: Record<string, unknown>,
  ) => {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      service,
      level,
      message,
      ...(detail ? { detail } : {}),
    };
    const serializedEntry = JSON.stringify(entry);

    if (level === "error") {
      console.error(serializedEntry);
      return entry;
    }

    if (level === "warn") {
      console.warn(serializedEntry);
      return entry;
    }

    console.log(serializedEntry);
    return entry;
  };
}

export function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack ?? null,
    };
  }

  return {
    message: typeof error === "string" ? error : "Unknown error",
    name: "UnknownError",
    stack: null,
  };
}

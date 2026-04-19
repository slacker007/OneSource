"use client";

import { useEffect, useState } from "react";

type CopyState = "idle" | "copied" | "error";

export function KnowledgeCopyButton({
  copiedLabel = "Copied",
  errorLabel = "Copy unavailable",
  label,
  text,
}: {
  copiedLabel?: string;
  errorLabel?: string;
  label: string;
  text: string;
}) {
  const [copyState, setCopyState] = useState<CopyState>("idle");

  useEffect(() => {
    if (copyState === "idle") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState("idle");
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState]);

  async function handleClick() {
    if (!navigator.clipboard?.writeText) {
      setCopyState("error");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  const buttonLabel =
    copyState === "copied"
      ? copiedLabel
      : copyState === "error"
        ? errorLabel
        : label;

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:border-border-strong hover:bg-surface-muted"
      onClick={handleClick}
      type="button"
    >
      {buttonLabel}
    </button>
  );
}

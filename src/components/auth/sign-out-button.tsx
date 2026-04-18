"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(() => {
      void signOut({
        callbackUrl: "/sign-in",
      });
    });
  }

  return (
    <button
      className="border-border text-foreground hover:bg-surface-strong inline-flex items-center justify-center rounded-full border bg-white px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70"
      disabled={isPending}
      onClick={handleSignOut}
      type="button"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
}

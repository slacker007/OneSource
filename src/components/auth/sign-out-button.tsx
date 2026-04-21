"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

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
    <Button
      disabled={isPending}
      onClick={handleSignOut}
      tone="neutral"
      type="button"
      variant="outlined"
    >
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}

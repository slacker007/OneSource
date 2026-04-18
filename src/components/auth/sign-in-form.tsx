"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";

type SignInFormProps = {
  defaultEmail?: string;
};

export function SignInForm({ defaultEmail = "" }: SignInFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitCredentials(email: string, password: string) {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/",
    });

    if (!result || result.error) {
      setErrorMessage("Invalid email or password.");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setErrorMessage(null);

    startTransition(() => {
      void submitCredentials(email, password);
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label
          className="text-foreground text-sm font-medium"
          htmlFor="email"
        >
          Email
        </label>
        <input
          autoComplete="email"
          className="border-border focus:border-accent focus:ring-accent/20 text-foreground w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none ring-0 transition-shadow focus:ring-4"
          defaultValue={defaultEmail}
          id="email"
          name="email"
          placeholder="admin@onesource.local"
          type="email"
        />
      </div>

      <div className="space-y-2">
        <label
          className="text-foreground text-sm font-medium"
          htmlFor="password"
        >
          Password
        </label>
        <input
          autoComplete="current-password"
          className="border-border focus:border-accent focus:ring-accent/20 text-foreground w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none ring-0 transition-shadow focus:ring-4"
          id="password"
          name="password"
          placeholder="Local development password"
          type="password"
        />
      </div>

      {errorMessage ? (
        <p
          aria-live="polite"
          className="rounded-2xl border border-[#dca167]/50 bg-[#fbf2e6] px-4 py-3 text-sm text-[#7e431f]"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        className="bg-accent hover:bg-accent-strong inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

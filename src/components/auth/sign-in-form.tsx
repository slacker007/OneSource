"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

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
      <FormField label="Email" htmlFor="email">
        <Input
          autoComplete="email"
          defaultValue={defaultEmail}
          id="email"
          name="email"
          placeholder="admin@onesource.local"
          type="email"
        />
      </FormField>

      <FormField label="Password" htmlFor="password">
        <Input
          autoComplete="current-password"
          id="password"
          name="password"
          placeholder="Local development password"
          type="password"
        />
      </FormField>

      {errorMessage ? (
        <FeedbackBanner
          message={errorMessage}
          title="Sign-in failed"
          tone="warning"
          className="w-full"
        >
        </FeedbackBanner>
      ) : null}

      <Button
        disabled={isPending}
        fullWidth
        type="submit"
        variant="solid"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

"use client";

import Stack from "@mui/material/Stack";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

type SignInFormProps = {
  defaultEmail?: string;
};

type SignInFieldErrors = {
  email?: string;
  password?: string;
};

export function SignInForm({ defaultEmail = "" }: SignInFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SignInFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitCredentials(email: string, password: string) {
    setIsSubmitting(true);

    try {
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
    } catch {
      setErrorMessage("Sign-in could not be completed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const nextFieldErrors: SignInFieldErrors = {
      email: email ? undefined : "Enter your email address.",
      password: password ? undefined : "Enter your password.",
    };

    if (nextFieldErrors.email || nextFieldErrors.password) {
      setFieldErrors(nextFieldErrors);
      setErrorMessage("Enter the required credentials to continue.");
      return;
    }

    setFieldErrors({});
    setErrorMessage(null);
    void submitCredentials(email, password);
  }

  return (
    <Stack component="form" noValidate onSubmit={handleSubmit} spacing={3}>
      <Stack spacing={2.5}>
        <FormField error={fieldErrors.email} label="Email" htmlFor="email">
          <Input
            aria-invalid={Boolean(fieldErrors.email)}
            autoComplete="email"
            defaultValue={defaultEmail}
            disabled={isSubmitting}
            id="email"
            name="email"
            placeholder="admin@onesource.local"
            required
            type="email"
          />
        </FormField>

        <FormField error={fieldErrors.password} label="Password" htmlFor="password">
          <Input
            aria-invalid={Boolean(fieldErrors.password)}
            autoComplete="current-password"
            disabled={isSubmitting}
            id="password"
            name="password"
            placeholder="Local development password"
            required
            type="password"
          />
        </FormField>
      </Stack>

      {errorMessage ? (
        <FeedbackBanner
          message={errorMessage}
          title={
            fieldErrors.email || fieldErrors.password
              ? "Credentials required"
              : "Sign-in failed"
          }
          tone="warning"
        >
        </FeedbackBanner>
      ) : null}

      <Button
        disabled={isSubmitting}
        fullWidth
        type="submit"
        variant="solid"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </Stack>
  );
}

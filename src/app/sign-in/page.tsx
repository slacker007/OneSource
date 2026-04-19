import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/sign-in-form";
import { getServerAuthSession } from "@/lib/auth/auth-options";
import { LOCAL_DEMO_SIGN_IN_EMAIL } from "@/lib/auth/local-demo-auth.mjs";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const session = await getServerAuthSession();

  if (session?.user?.id) {
    redirect("/");
  }

  return (
    <main className="from-[rgba(17,44,47,0.97)] via-[rgba(33,69,67,0.95)] to-[rgba(244,232,214,0.94)] flex min-h-screen items-center justify-center bg-linear-to-br px-4 py-12">
      <section className="border-border w-full max-w-md rounded-[32px] border bg-[rgba(252,249,244,0.96)] p-8 shadow-[0_28px_80px_rgba(14,32,35,0.28)] backdrop-blur">
        <div className="space-y-3">
          <p className="text-muted text-sm tracking-[0.28em] uppercase">
            OneSource Access
          </p>
          <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
            Sign in to OneSource.
          </h1>
          <p className="text-muted text-sm leading-6">
            Use the seeded local admin account to access OneSource. Sign in with{" "}
            the email{" "}
            <span className="text-foreground font-medium">
              {LOCAL_DEMO_SIGN_IN_EMAIL}
            </span>{" "}
            and the shared local development password documented in the repo.
          </p>
        </div>

        <div className="mt-8">
          <SignInForm defaultEmail={LOCAL_DEMO_SIGN_IN_EMAIL} />
        </div>
      </section>
    </main>
  );
}

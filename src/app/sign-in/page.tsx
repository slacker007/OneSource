import { redirect } from "next/navigation";
import Typography from "@mui/material/Typography";

import { PublicAccessShell } from "@/components/auth/public-access-shell";
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
    <PublicAccessShell
      description={
        <>
          Use the seeded local admin account to access OneSource. Sign in with the email{" "}
          <Typography component="span" sx={{ color: "text.primary", fontWeight: 600 }}>
            {LOCAL_DEMO_SIGN_IN_EMAIL}
          </Typography>{" "}
          and the shared local development password documented in the repo.
        </>
      }
      eyebrow="OneSource Access"
      maxWidth={480}
      title="Sign in to OneSource."
    >
      <SignInForm defaultEmail={LOCAL_DEMO_SIGN_IN_EMAIL} />
    </PublicAccessShell>
  );
}

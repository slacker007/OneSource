import { redirect } from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { SignInForm } from "@/components/auth/sign-in-form";
import { Surface } from "@/components/ui/surface";
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
      <Surface
        component="section"
        sx={{
          backdropFilter: "blur(18px)",
          bgcolor: "rgba(252,249,244,0.96)",
          borderRadius: 4,
          boxShadow: "0 28px 80px rgba(14,32,35,0.28)",
          p: 4,
          width: "100%",
          maxWidth: 480,
        }}
      >
        <Stack spacing={3}>
          <div className="space-y-3">
            <Typography
              sx={{
                color: "text.secondary",
                fontSize: "0.82rem",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
              }}
            >
            OneSource Access
            </Typography>
            <Typography
              component="h1"
              sx={{
                fontFamily: "var(--font-heading), sans-serif",
                fontSize: {
                  sm: "2.4rem",
                  xs: "2.1rem",
                },
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
              }}
            >
              Sign in to OneSource.
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.94rem", lineHeight: 1.7 }}>
              Use the seeded local admin account to access OneSource. Sign in with the email{" "}
              <Typography component="span" sx={{ color: "text.primary", fontWeight: 600 }}>
                {LOCAL_DEMO_SIGN_IN_EMAIL}
              </Typography>{" "}
              and the shared local development password documented in the repo.
            </Typography>
          </div>

          <SignInForm defaultEmail={LOCAL_DEMO_SIGN_IN_EMAIL} />
        </Stack>
      </Surface>
    </main>
  );
}

import { PublicAccessShell } from "@/components/auth/public-access-shell";
import { Button } from "@/components/ui/button";
import { PermissionDeniedState } from "@/components/ui/permission-denied-state";

type ForbiddenPageProps = {
  searchParams?: Promise<{
    permission?: string;
  }>;
};

export default async function ForbiddenPage({
  searchParams,
}: ForbiddenPageProps) {
  const resolvedSearchParams = await searchParams;
  const blockedPermission =
    resolvedSearchParams?.permission?.replaceAll("_", " ") ?? "this area";

  return (
    <PublicAccessShell maxWidth={560}>
      <PermissionDeniedState
        action={
          <Button
            href="/"
            tone="primary"
            variant="solid"
          >
            Return to dashboard
          </Button>
        }
        blockedArea={blockedPermission}
        className="w-full"
        title={`You do not have access to ${blockedPermission}.`}
      />
    </PublicAccessShell>
  );
}

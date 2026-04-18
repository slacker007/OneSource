import { redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth/auth-options";

export const dynamic = "force-dynamic";

export default async function AuthenticatedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return children;
}

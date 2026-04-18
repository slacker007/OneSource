import { requireAuthenticatedAppSession } from "@/lib/auth/authorization";

export const dynamic = "force-dynamic";

export default async function AuthenticatedAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAuthenticatedAppSession();

  return children;
}

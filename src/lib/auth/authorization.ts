import "server-only";

import { redirect } from "next/navigation";

import { getServerAuthSession } from "./auth-options";
import {
  getPermissionSnapshot,
  hasAppPermission,
  type AppPermissionKey,
} from "./permissions";

export async function requireAuthenticatedAppSession() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return session;
}

export async function requireAppPermission(permissionKey: AppPermissionKey) {
  const session = await requireAuthenticatedAppSession();

  if (!hasAppPermission(session.user.roleKeys, permissionKey)) {
    redirect(`/forbidden?permission=${encodeURIComponent(permissionKey)}`);
  }

  return {
    session,
    permissionSnapshot: getPermissionSnapshot(session.user.roleKeys),
  };
}

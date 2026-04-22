"use server";

import { revalidatePath } from "next/cache";

import { requireAppPermission } from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import {
  INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE,
  type AdminUserManagementActionState,
  validateInviteUserSubmission,
  validateUpdateUserRolesSubmission,
  validateUserStatusMutation,
} from "@/modules/admin/user-management-form.schema";
import {
  createInvitedWorkspaceUser,
  disableWorkspaceUser,
  reactivateWorkspaceUser,
  updateWorkspaceUserRoles,
} from "@/modules/admin/user-management.service";

export async function createWorkspaceUserAction(
  _state: AdminUserManagementActionState,
  formData: FormData,
): Promise<AdminUserManagementActionState> {
  const { session } = await requireAppPermission("manage_workspace_settings");
  const validation = validateInviteUserSubmission(formData);

  if (!validation.success) {
    return validation.state;
  }

  try {
    const result = await createInvitedWorkspaceUser({
      db: prisma,
      input: {
        email: validation.submission.email,
        name: validation.submission.name,
        organizationId: session.user.organizationId,
        performedByUserId: session.user.id,
        roleKeys: validation.submission.roleKeys,
      },
    });
    revalidatePath("/settings/users");

    return {
      affectedUserId: result.userId,
      fieldErrors: {},
      formError: null,
      successMessage: `Invited ${result.email} with ${result.roleKeys.length === 1 ? "1 role" : `${result.roleKeys.length} roles`}.`,
    };
  } catch (error) {
    return {
      ...INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE,
      formError:
        error instanceof Error
          ? error.message
          : "The workspace user could not be invited.",
    };
  }
}

export async function updateWorkspaceUserRolesAction(
  _state: AdminUserManagementActionState,
  formData: FormData,
): Promise<AdminUserManagementActionState> {
  const { session } = await requireAppPermission("manage_workspace_settings");
  const validation = validateUpdateUserRolesSubmission(formData);

  if (!validation.success) {
    return validation.state;
  }

  try {
    const result = await updateWorkspaceUserRoles({
      db: prisma,
      input: {
        organizationId: session.user.organizationId,
        performedByUserId: session.user.id,
        roleKeys: validation.submission.roleKeys,
        userId: validation.submission.userId,
      },
    });
    revalidatePath("/settings/users");

    return {
      affectedUserId: result.userId,
      fieldErrors: {},
      formError: null,
      successMessage: `Updated roles for ${result.email}.`,
    };
  } catch (error) {
    return {
      affectedUserId: validation.submission.userId,
      fieldErrors: {},
      formError:
        error instanceof Error
          ? error.message
          : "The workspace user roles could not be saved.",
      successMessage: null,
    };
  }
}

export async function disableWorkspaceUserAction(
  _state: AdminUserManagementActionState,
  formData: FormData,
): Promise<AdminUserManagementActionState> {
  const { session } = await requireAppPermission("manage_workspace_settings");
  const validation = validateUserStatusMutation(formData);

  if (!validation.success) {
    return validation.state;
  }

  try {
    const result = await disableWorkspaceUser({
      db: prisma,
      input: {
        organizationId: session.user.organizationId,
        performedByUserId: session.user.id,
        userId: validation.submission.userId,
      },
    });
    revalidatePath("/settings/users");

    return {
      affectedUserId: result.userId,
      fieldErrors: {},
      formError: null,
      successMessage: result.changed
        ? `Disabled ${result.email}.`
        : `${result.email} was already disabled.`,
    };
  } catch (error) {
    return {
      affectedUserId: validation.submission.userId,
      fieldErrors: {},
      formError:
        error instanceof Error
          ? error.message
          : "The workspace user could not be disabled.",
      successMessage: null,
    };
  }
}

export async function reactivateWorkspaceUserAction(
  _state: AdminUserManagementActionState,
  formData: FormData,
): Promise<AdminUserManagementActionState> {
  const { session } = await requireAppPermission("manage_workspace_settings");
  const validation = validateUserStatusMutation(formData);

  if (!validation.success) {
    return validation.state;
  }

  try {
    const result = await reactivateWorkspaceUser({
      db: prisma,
      input: {
        organizationId: session.user.organizationId,
        performedByUserId: session.user.id,
        userId: validation.submission.userId,
      },
    });
    revalidatePath("/settings/users");

    return {
      affectedUserId: result.userId,
      fieldErrors: {},
      formError: null,
      successMessage: result.changed
        ? `Re-enabled ${result.email}.`
        : `${result.email} was already active.`,
    };
  } catch (error) {
    return {
      affectedUserId: validation.submission.userId,
      fieldErrors: {},
      formError:
        error instanceof Error
          ? error.message
          : "The workspace user could not be re-enabled.",
      successMessage: null,
    };
  }
}

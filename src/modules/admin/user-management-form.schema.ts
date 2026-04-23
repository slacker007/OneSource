import { z } from "zod";

const inviteUserSubmissionSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter an email address.")
    .email("Enter a valid email address."),
  name: z
    .string()
    .trim()
    .max(120, "Keep the display name to 120 characters or fewer."),
  roleKeys: z
    .array(z.string().trim().min(1))
    .min(1, "Assign at least one role before inviting a user.")
    .max(12, "Assign no more than 12 roles to one user."),
});

const updateRolesSubmissionSchema = z.object({
  roleKeys: z
    .array(z.string().trim().min(1))
    .min(1, "Assign at least one role before saving the user.")
    .max(12, "Assign no more than 12 roles to one user."),
  userId: z.string().trim().min(1, "Choose a user before saving roles."),
});

const userStatusMutationSchema = z.object({
  userId: z.string().trim().min(1, "Choose a user before saving changes."),
});

export type AdminUserManagementFieldErrors = Partial<
  Record<"email" | "name" | "roleKeys" | "userId", string>
>;

export type AdminUserManagementActionState = {
  affectedUserId: string | null;
  fieldErrors: AdminUserManagementFieldErrors;
  formError: string | null;
  successMessage: string | null;
};

export type InviteUserSubmission = {
  email: string;
  name: string | null;
  roleKeys: string[];
};

export type UpdateUserRolesSubmission = {
  roleKeys: string[];
  userId: string;
};

export const INITIAL_ADMIN_USER_MANAGEMENT_ACTION_STATE: AdminUserManagementActionState =
  {
    affectedUserId: null,
    fieldErrors: {},
    formError: null,
    successMessage: null,
  };

export function validateInviteUserSubmission(
  formData: FormData | Record<string, unknown>,
):
  | { success: true; submission: InviteUserSubmission }
  | { success: false; state: AdminUserManagementActionState } {
  const parsed = inviteUserSubmissionSchema.safeParse(readInviteUserValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      state: {
        affectedUserId: null,
        fieldErrors: mapFieldErrors(parsed.error.issues),
        formError:
          "Correct the highlighted fields before inviting the user.",
        successMessage: null,
      },
    };
  }

  return {
    success: true,
    submission: {
      email: parsed.data.email.toLowerCase(),
      name: toOptionalString(parsed.data.name),
      roleKeys: uniqueStrings(parsed.data.roleKeys),
    },
  };
}

export function validateUpdateUserRolesSubmission(
  formData: FormData | Record<string, unknown>,
):
  | { success: true; submission: UpdateUserRolesSubmission }
  | { success: false; state: AdminUserManagementActionState } {
  const parsed = updateRolesSubmissionSchema.safeParse(
    readUpdateRolesValues(formData),
  );

  if (!parsed.success) {
    return {
      success: false,
      state: {
        affectedUserId: readSingleString(
          formData instanceof FormData ? formData.get("userId") : formData.userId,
        ),
        fieldErrors: mapFieldErrors(parsed.error.issues),
        formError: "Correct the highlighted fields before saving the user.",
        successMessage: null,
      },
    };
  }

  return {
    success: true,
    submission: {
      userId: parsed.data.userId,
      roleKeys: uniqueStrings(parsed.data.roleKeys),
    },
  };
}

export function validateUserStatusMutation(
  formData: FormData | Record<string, unknown>,
):
  | { success: true; submission: { userId: string } }
  | { success: false; state: AdminUserManagementActionState } {
  const parsed = userStatusMutationSchema.safeParse(readUserStatusValues(formData));

  if (!parsed.success) {
    return {
      success: false,
      state: {
        affectedUserId: null,
        fieldErrors: mapFieldErrors(parsed.error.issues),
        formError: "Choose a user before submitting the status change.",
        successMessage: null,
      },
    };
  }

  return {
    success: true,
    submission: {
      userId: parsed.data.userId,
    },
  };
}

function readInviteUserValues(formData: FormData | Record<string, unknown>) {
  return {
    email: readSingleString(
      formData instanceof FormData ? formData.get("email") : formData.email,
    ),
    name: readSingleString(
      formData instanceof FormData ? formData.get("name") : formData.name,
    ),
    roleKeys: readStringArray(
      formData instanceof FormData ? formData.getAll("roleKeys") : formData.roleKeys,
    ),
  };
}

function readUpdateRolesValues(formData: FormData | Record<string, unknown>) {
  return {
    roleKeys: readStringArray(
      formData instanceof FormData ? formData.getAll("roleKeys") : formData.roleKeys,
    ),
    userId: readSingleString(
      formData instanceof FormData ? formData.get("userId") : formData.userId,
    ),
  };
}

function readUserStatusValues(formData: FormData | Record<string, unknown>) {
  return {
    userId: readSingleString(
      formData instanceof FormData ? formData.get("userId") : formData.userId,
    ),
  };
}

function mapFieldErrors(issues: z.ZodIssue[]): AdminUserManagementFieldErrors {
  const fieldErrors: AdminUserManagementFieldErrors = {};

  for (const issue of issues) {
    const fieldName = issue.path[0];

    if (
      typeof fieldName === "string" &&
      (fieldName === "email" ||
        fieldName === "name" ||
        fieldName === "roleKeys" ||
        fieldName === "userId") &&
      !fieldErrors[fieldName]
    ) {
      fieldErrors[fieldName] = issue.message;
    }
  }

  return fieldErrors;
}

function readSingleString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function toOptionalString(value: string) {
  return value.length > 0 ? value : null;
}

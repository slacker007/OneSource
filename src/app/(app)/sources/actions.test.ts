import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const redirectError = new Error("NEXT_REDIRECT");

  return {
    applySourceImport: vi.fn(),
    redirect: vi.fn((path: string) => {
      redirectError.digest = `NEXT_REDIRECT;push;${path};307;`;
      throw redirectError;
    }),
    requireAppPermission: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth/authorization", () => ({
  requireAppPermission: mocks.requireAppPermission,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

vi.mock("@/modules/source-integrations/source-import.service", () => ({
  applySourceImport: mocks.applySourceImport,
}));

import { applySourceImportAction } from "./actions";

describe("sources actions", () => {
  beforeEach(() => {
    mocks.applySourceImport.mockReset();
    mocks.redirect.mockClear();
    mocks.requireAppPermission.mockReset();

    mocks.requireAppPermission.mockResolvedValue({
      session: {
        user: {
          email: "admin@onesource.local",
          id: "user_admin",
          organizationId: "org_default",
        },
      },
    });
  });

  it("redirects with import success details after creating a tracked opportunity", async () => {
    mocks.applySourceImport.mockResolvedValue({
      action: "created",
      targetOpportunityId: "opp_123",
    });

    const formData = new FormData();
    formData.set("returnPath", "/sources?keywords=cloud");
    formData.set("sourceRecordId", "source_123");
    formData.set("mode", "CREATE_OPPORTUNITY");

    await expect(applySourceImportAction(formData)).rejects.toMatchObject({
      digest:
        "NEXT_REDIRECT;push;/sources?keywords=cloud&importStatus=created&opportunityId=opp_123&preview=source_123;307;",
    });

    expect(mocks.applySourceImport).toHaveBeenCalledWith({
      db: {},
      input: {
        actor: {
          identifier: "admin@onesource.local",
          organizationId: "org_default",
          type: "USER",
          userId: "user_admin",
        },
        mode: "CREATE_OPPORTUNITY",
        sourceRecordId: "source_123",
        targetOpportunityId: null,
      },
    });
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/sources?keywords=cloud&importStatus=created&opportunityId=opp_123&preview=source_123",
    );
  });

  it("redirects with an import error when the import service fails", async () => {
    mocks.applySourceImport.mockRejectedValue(
      new Error("The source record is already linked."),
    );

    const formData = new FormData();
    formData.set("returnPath", "/sources?preview=source_123");
    formData.set("sourceRecordId", "source_123");
    formData.set("mode", "CREATE_OPPORTUNITY");

    await expect(applySourceImportAction(formData)).rejects.toMatchObject({
      digest:
        "NEXT_REDIRECT;push;/sources?preview=source_123&importError=The+source+record+is+already+linked.;307;",
    });

    expect(mocks.redirect).toHaveBeenCalledWith(
      "/sources?preview=source_123&importError=The+source+record+is+already+linked.",
    );
  });
});

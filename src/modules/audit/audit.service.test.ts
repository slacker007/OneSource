import { AuditActorType, Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { buildAuditLogCreateInput } from "./audit.service";

describe("audit.service", () => {
  it("builds append-only audit rows with explicit actor, target, and timestamp fields", () => {
    const occurredAt = new Date("2026-04-18T01:30:00.000Z");

    const auditLog = buildAuditLogCreateInput({
      organizationId: "org_123",
      actor: {
        type: AuditActorType.USER,
        userId: "user_123",
        identifier: "alex@onesource.local",
        ipAddress: "127.0.0.1",
        userAgent: "vitest",
      },
      action: "opportunity.update",
      target: {
        type: "opportunity",
        id: "opp_123",
        display: "Enterprise Data Platform Support",
      },
      summary: "Updated opportunity title.",
      metadata: null,
      occurredAt,
    });

    expect(auditLog).toEqual({
      organizationId: "org_123",
      actorUserId: "user_123",
      actorType: AuditActorType.USER,
      actorIdentifier: "alex@onesource.local",
      action: "opportunity.update",
      targetType: "opportunity",
      targetId: "opp_123",
      targetDisplay: "Enterprise Data Platform Support",
      summary: "Updated opportunity title.",
      metadata: Prisma.JsonNull,
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
      occurredAt,
    });
  });
});

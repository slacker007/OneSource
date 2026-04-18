import { describe, expect, it, vi } from "vitest";

import {
  getAdminWorkspaceSnapshot,
  type AdminRepositoryClient,
  type OrganizationAdminRecord,
} from "./admin.repository";

function buildOrganizationAdminRecord(): OrganizationAdminRecord {
  return {
    id: "org_123",
    name: "Default Organization",
    agencies: [
      {
        id: "agency_air_force",
        name: "99th Contracting Squadron",
        organizationCode: "FA4861",
      },
      {
        id: "agency_army",
        name: "PEO Enterprise Information Systems",
        organizationCode: "W91QUZ",
      },
      {
        id: "agency_va",
        name: "Technology Acquisition Center",
        organizationCode: "36C10B",
      },
    ],
    organizationProfile: {
      overview:
        "Mid-sized federal integrator focused on cloud modernization and cyber operations.",
      strategicFocus:
        "Prioritize Air Force, Army, and VA digital-transformation pursuits.",
      targetNaicsCodes: ["541512", "541519"],
      priorityAgencyIds: ["agency_air_force", "agency_army"],
      relationshipAgencyIds: ["agency_army", "agency_va"],
      activeScoringModelKey: "default_capture_v1",
      activeScoringModelVersion: "2026-04-18",
      capabilities: [
        {
          id: "cap_cloud",
          capabilityKey: "cloud-platform-engineering",
          capabilityLabel: "Cloud platform engineering",
          capabilityCategory: "cloud_operations",
          capabilityKeywords: ["cloud operations", "platform engineering"],
          description: "Cloud modernization delivery support.",
        },
      ],
      certifications: [
        {
          id: "cert_iso",
          certificationKey: "iso-27001",
          certificationLabel: "ISO/IEC 27001",
          certificationCode: "ISO-27001",
          issuingBody: "ISO",
          description: "Information-security management baseline.",
        },
      ],
      selectedVehicles: [
        {
          isPreferred: true,
          usageNotes: "Default preferred vehicle for high-fit pursuits.",
          vehicle: {
            id: "vehicle_oasis",
            code: "OASIS-PLUS-UNR",
            name: "OASIS+ Unrestricted",
            vehicleType: "IDIQ",
            awardingAgency: "General Services Administration",
          },
        },
      ],
      scoringCriteria: [
        {
          id: "criterion_capability_fit",
          factorKey: "capability_fit",
          factorLabel: "Capability fit",
          description: "Measures capability match against the opportunity.",
          weight: { toString: () => "30.00" },
          isActive: true,
        },
      ],
    },
    _count: {
      users: 3,
      auditLogs: 18,
    },
    users: [
      {
        id: "user_admin",
        name: "Alex Morgan",
        email: "admin@onesource.local",
        status: "ACTIVE",
        roles: [
          {
            assignedAt: new Date("2026-04-17T12:00:00.000Z"),
            role: {
              key: "admin",
              name: "Admin",
            },
          },
          {
            assignedAt: new Date("2026-04-17T12:01:00.000Z"),
            role: {
              key: "executive",
              name: "Executive",
            },
          },
        ],
      },
      {
        id: "user_capture",
        name: "Morgan Patel",
        email: "morgan.patel@onesource.local",
        status: "ACTIVE",
        roles: [
          {
            assignedAt: new Date("2026-04-17T12:02:00.000Z"),
            role: {
              key: "capture_manager",
              name: "Capture Manager",
            },
          },
        ],
      },
      {
        id: "user_viewer",
        name: null,
        email: "avery.stone@onesource.local",
        status: "INVITED",
        roles: [],
      },
    ],
    auditLogs: [
      {
        id: "audit_1",
        occurredAt: new Date("2026-04-18T01:00:00.000Z"),
        action: "seed.bootstrap",
        actorType: "USER",
        actorIdentifier: "admin@onesource.local",
        targetType: "organization",
        targetId: "org_123",
        targetDisplay: "Default Organization",
        summary:
          "Initialized baseline organization, connector metadata, and multi-source opportunity seed data.",
        metadata: {
          seededOpportunityCount: 5,
        },
        actorUser: {
          name: "Alex Morgan",
          email: "admin@onesource.local",
        },
      },
      {
        id: "audit_2",
        occurredAt: new Date("2026-04-18T00:59:00.000Z"),
        action: "opportunity.stage_transition",
        actorType: "SYSTEM",
        actorIdentifier: null,
        targetType: "opportunity",
        targetId: "opp_123",
        targetDisplay: null,
        summary: null,
        metadata: null,
        actorUser: null,
      },
    ],
  };
}

function createRepositoryClient(record: OrganizationAdminRecord | null) {
  return {
    organization: {
      findUnique: vi.fn().mockResolvedValue(record),
    },
  } as unknown as AdminRepositoryClient;
}

describe("admin.repository", () => {
  it("maps organization users and recent audit events into admin read models", async () => {
    const db = createRepositoryClient(buildOrganizationAdminRecord());

    const snapshot = await getAdminWorkspaceSnapshot({
      db,
      organizationId: "org_123",
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot).toMatchObject({
      organizationName: "Default Organization",
      totalUserCount: 3,
      adminUserCount: 1,
      totalAuditLogCount: 18,
    });
    expect(snapshot?.scoringProfile).toMatchObject({
      activeScoringModelKey: "default_capture_v1",
      activeScoringModelVersion: "2026-04-18",
      targetNaicsCodes: ["541512", "541519"],
      priorityAgencies: [
        { id: "agency_air_force", label: "99th Contracting Squadron (FA4861)" },
        {
          id: "agency_army",
          label: "PEO Enterprise Information Systems (W91QUZ)",
        },
      ],
      relationshipAgencies: [
        {
          id: "agency_army",
          label: "PEO Enterprise Information Systems (W91QUZ)",
        },
        {
          id: "agency_va",
          label: "Technology Acquisition Center (36C10B)",
        },
      ],
    });
    expect(snapshot?.scoringProfile?.capabilities[0]).toMatchObject({
      key: "cloud-platform-engineering",
      category: "cloud_operations",
      keywords: ["cloud operations", "platform engineering"],
    });
    expect(snapshot?.scoringProfile?.scoringCriteria[0]).toMatchObject({
      key: "capability_fit",
      weight: "30.00",
    });

    expect(snapshot?.users[0]).toMatchObject({
      name: "Alex Morgan",
      email: "admin@onesource.local",
      roleKeys: ["admin", "executive"],
      roleLabels: ["Admin", "Executive"],
    });
    expect(snapshot?.users[2]).toMatchObject({
      email: "avery.stone@onesource.local",
      roleKeys: [],
      roleLabels: [],
    });

    expect(snapshot?.recentAuditEvents[0]).toMatchObject({
      action: "seed.bootstrap",
      actionLabel: "Seed / Bootstrap",
      actorLabel: "Alex Morgan",
      targetLabel: "Default Organization",
    });
    expect(snapshot?.recentAuditEvents[0].metadataPreview).toContain(
      "\"seededOpportunityCount\":5",
    );
    expect(snapshot?.recentAuditEvents[1]).toMatchObject({
      actionLabel: "Opportunity / Stage Transition",
      actorLabel: "System",
      targetLabel: "opp_123",
    });
  });

  it("returns null when the organization is missing", async () => {
    const db = createRepositoryClient(null);

    await expect(
      getAdminWorkspaceSnapshot({
        db,
        organizationId: "missing_org",
      }),
    ).resolves.toBeNull();
  });
});

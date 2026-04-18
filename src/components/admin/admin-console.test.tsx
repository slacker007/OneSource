import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AdminConsole } from "./admin-console";

describe("AdminConsole", () => {
  it("renders user-role visibility and recent audit activity", () => {
    render(
      <AdminConsole
        sessionUser={{
          name: "Alex Morgan",
          email: "admin@onesource.local",
        }}
        snapshot={{
          organizationId: "org_123",
          organizationName: "Default Organization",
          totalUserCount: 2,
          adminUserCount: 1,
          totalAuditLogCount: 9,
          scoringProfile: {
            overview:
              "Mid-sized federal integrator focused on cloud modernization and cyber operations.",
            strategicFocus:
              "Prioritize Air Force, Army, and VA digital-transformation pursuits.",
            targetNaicsCodes: ["541512", "541519"],
            activeScoringModelKey: "default_capture_v1",
            activeScoringModelVersion: "2026-04-18",
            goRecommendationThreshold: "70.00",
            deferRecommendationThreshold: "45.00",
            minimumRiskScorePercent: "50.00",
            priorityAgencies: [
              {
                id: "agency_air_force",
                label: "99th Contracting Squadron (FA4861)",
              },
            ],
            relationshipAgencies: [
              {
                id: "agency_army",
                label: "PEO Enterprise Information Systems (W91QUZ)",
              },
            ],
            capabilities: [
              {
                id: "cap_cloud",
                key: "cloud-platform-engineering",
                label: "Cloud platform engineering",
                category: "cloud_operations",
                keywords: ["cloud operations", "platform engineering"],
                description: "Cloud modernization delivery support.",
              },
            ],
            certifications: [
              {
                id: "cert_iso",
                key: "iso-27001",
                label: "ISO/IEC 27001",
                code: "ISO-27001",
                issuingBody: "ISO",
                description: "Information-security management baseline.",
              },
            ],
            selectedVehicles: [
              {
                id: "vehicle_oasis",
                code: "OASIS-PLUS-UNR",
                name: "OASIS+ Unrestricted",
                vehicleType: "IDIQ",
                awardingAgency: "GSA",
                isPreferred: true,
                usageNotes: "Default preferred vehicle for high-fit pursuits.",
              },
            ],
            scoringCriteria: [
              {
                id: "criterion_capability_fit",
                key: "capability_fit",
                label: "Capability fit",
                description:
                  "Measures capability match against the opportunity.",
                weight: "30.00",
                isActive: true,
              },
            ],
          },
          users: [
            {
              id: "user_admin",
              name: "Alex Morgan",
              email: "admin@onesource.local",
              status: "ACTIVE",
              roleKeys: ["admin", "executive"],
              roleLabels: ["Admin", "Executive"],
              roles: [
                {
                  key: "admin",
                  label: "Admin",
                  assignedAt: "2026-04-18T01:00:00.000Z",
                },
                {
                  key: "executive",
                  label: "Executive",
                  assignedAt: "2026-04-18T01:01:00.000Z",
                },
              ],
            },
            {
              id: "user_viewer",
              name: null,
              email: "avery.stone@onesource.local",
              status: "INVITED",
              roleKeys: [],
              roleLabels: [],
              roles: [],
            },
          ],
          recentAuditEvents: [
            {
              id: "audit_1",
              occurredAt: "2026-04-18T01:00:00.000Z",
              action: "seed.bootstrap",
              actionLabel: "Seed / Bootstrap",
              actorType: "USER",
              actorLabel: "Alex Morgan",
              targetLabel: "Default Organization",
              targetType: "organization",
              summary: "Initialized baseline organization.",
              metadataPreview: "{\"seededOpportunityCount\":5}",
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /admin console/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /organization scoring profile/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /assigned roles/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /recent audit activity/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /assigned roles/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /recent audit activity/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /organization capabilities/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /weighted scoring criteria/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/admin@onesource\.local/i)).toHaveLength(2);
    expect(screen.getByText(/default_capture_v1/i)).toBeInTheDocument();
    expect(screen.getByText(/go >= 70\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/risk floor >= 50\.00%/i)).toBeInTheDocument();
    expect(screen.getByText(/cloud platform engineering/i)).toBeInTheDocument();
    expect(screen.getByText(/30\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/no roles assigned/i)).toBeInTheDocument();
    expect(screen.getByText("seed.bootstrap")).toBeInTheDocument();
  });

  it("renders a clear empty state when the organization snapshot is unavailable", () => {
    render(
      <AdminConsole
        sessionUser={{
          email: "admin@onesource.local",
        }}
        snapshot={null}
      />,
    );

    expect(
      screen.getByText(/organization-scoped admin data could not be loaded/i),
    ).toBeInTheDocument();
  });

  it("shows empty shared table states when snapshot lists are empty", async () => {
    const user = userEvent.setup();

    render(
      <AdminConsole
        sessionUser={{
          email: "admin@onesource.local",
        }}
        snapshot={{
          organizationId: "org_123",
          organizationName: "Default Organization",
          totalUserCount: 0,
          adminUserCount: 0,
          totalAuditLogCount: 0,
          scoringProfile: null,
          users: [],
          recentAuditEvents: [],
        }}
      />,
    );

    await user.click(screen.getByRole("heading", { name: /assigned roles/i }));

    expect(
      screen.getByText(/no organization users are available yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no organization scoring profile is available yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no audit events are available yet/i),
    ).toBeInTheDocument();
  });
});

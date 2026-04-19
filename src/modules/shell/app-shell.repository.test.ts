import { describe, expect, it, vi } from "vitest";

import {
  getAppShellSnapshot,
  type AppShellRepositoryClient,
} from "./app-shell.repository";

describe("getAppShellSnapshot", () => {
  it("maps searchable shell sections and notifications", async () => {
    const db = {
      opportunity: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "opp_1",
            title: "VA Intake Modernization BPA",
            solicitationNumber: "36C10B-26-R-0101",
            currentStageLabel: "Capture Active",
            responseDeadlineAt: new Date("2026-05-08T17:00:00.000Z"),
            updatedAt: new Date("2026-04-19T09:00:00.000Z"),
            leadAgency: {
              name: "Technology Acquisition Center",
            },
          },
        ]),
      },
      opportunityTask: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "task_1",
            title: "Confirm teaming posture",
            status: "BLOCKED",
            priority: "CRITICAL",
            dueAt: new Date("2026-04-18T17:00:00.000Z"),
            deadlineReminderState: "OVERDUE",
            opportunity: {
              id: "opp_1",
              title: "VA Intake Modernization BPA",
            },
          },
          {
            id: "task_2",
            title: "Update capture brief",
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueAt: new Date("2026-04-22T17:00:00.000Z"),
            deadlineReminderState: "UPCOMING",
            opportunity: {
              id: "opp_2",
              title: "Air Force Cloud Boundary",
            },
          },
        ]),
      },
      knowledgeAsset: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "knowledge_1",
            title: "Zero Trust Transition Narrative",
            assetType: "WIN_THEME",
            updatedAt: new Date("2026-04-17T15:00:00.000Z"),
          },
        ]),
      },
      sourceSavedSearch: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "saved_search_1",
            name: "Daily VA cloud search",
            sourceSystem: "sam_gov",
            canonicalFilters: {
              keywords: "cloud intake",
              postedDateFrom: "2026-04-01",
              postedDateTo: "2026-04-19",
              procurementTypes: ["o", "k"],
              pageSize: 25,
              pageOffset: 0,
            },
            lastExecutedAt: new Date("2026-04-18T12:00:00.000Z"),
            updatedAt: new Date("2026-04-18T12:00:00.000Z"),
          },
        ]),
      },
      sourceSyncRun: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "sync_1",
            sourceSystem: "sam_gov",
            status: "FAILED",
            errorCode: "sam_gov_http_429",
            errorMessage: "SAM.gov returned HTTP 429.",
            requestedAt: new Date("2026-04-19T08:00:00.000Z"),
            completedAt: new Date("2026-04-19T08:00:10.000Z"),
            savedSearch: {
              name: "Daily VA cloud search",
            },
          },
        ]),
      },
    } satisfies AppShellRepositoryClient;

    const snapshot = await getAppShellSnapshot({
      db,
      organizationId: "org_123",
      permissions: {
        allowDecisionSupport: true,
        allowManagePipeline: true,
        allowManageSourceSearches: true,
        allowWorkspaceSettings: false,
      },
      userId: "user_123",
    });

    expect(snapshot.commandSections.map((section) => section.key)).toEqual([
      "opportunities",
      "tasks",
      "knowledge",
      "saved_searches",
    ]);
    expect(snapshot.commandSections[0]?.items[0]).toMatchObject({
      category: "opportunity",
      href: "/opportunities/opp_1",
      label: "VA Intake Modernization BPA",
      navHref: "/opportunities",
      supportingText: "36C10B-26-R-0101",
    });
    expect(snapshot.commandSections[1]?.items[0]).toMatchObject({
      category: "task",
      href: "/opportunities/opp_1",
      supportingText: "Overdue reminder",
    });
    expect(snapshot.commandSections[2]?.items[0]).toMatchObject({
      category: "knowledge",
      href: "/knowledge?query=Zero%20Trust%20Transition%20Narrative",
      supportingText: "Win theme",
    });
    expect(snapshot.commandSections[3]?.items[0]?.href).toContain(
      "/sources?source=sam_gov",
    );
    expect(snapshot.commandSections[3]?.items[0]?.href).toContain(
      "ptype=o",
    );
    expect(snapshot.notifications.totalCount).toBe(3);
    expect(snapshot.notifications.items[0]).toMatchObject({
      href: "/opportunities/opp_1",
      title: "Critical task overdue",
      tone: "danger",
    });
    expect(snapshot.notifications.items[2]).toMatchObject({
      href: "/sources",
      title: "Saved search issue: Daily VA cloud search",
      tone: "warning",
    });
  });

  it("omits saved-search data for users without source-search visibility", async () => {
    const db = {
      opportunity: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      opportunityTask: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      knowledgeAsset: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      sourceSavedSearch: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      sourceSyncRun: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    } satisfies AppShellRepositoryClient;

    const snapshot = await getAppShellSnapshot({
      db,
      organizationId: "org_123",
      permissions: {
        allowDecisionSupport: false,
        allowManagePipeline: false,
        allowManageSourceSearches: false,
        allowWorkspaceSettings: false,
      },
      userId: "user_123",
    });

    expect(snapshot.commandSections).toEqual([]);
    expect(snapshot.notifications).toEqual({
      items: [],
      totalCount: 0,
    });
    expect(db.sourceSavedSearch.findMany).not.toHaveBeenCalled();
    expect(db.sourceSyncRun.findMany).not.toHaveBeenCalled();
  });
});

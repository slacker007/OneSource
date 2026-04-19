import type { Prisma } from "@prisma/client";

import type { AppShellCommandSection, AppShellSnapshot } from "./app-shell.types";

const APP_SHELL_COMMAND_LIMIT = 5;
const APP_SHELL_NOTIFICATION_LIMIT = 6;

type AppShellPermissions = {
  allowDecisionSupport: boolean;
  allowManagePipeline: boolean;
  allowManageSourceSearches: boolean;
  allowWorkspaceSettings: boolean;
};

type AppShellRepositoryParams = {
  db: AppShellRepositoryClient;
  organizationId: string;
  permissions: AppShellPermissions;
  userId: string;
};

export type AppShellOpportunityRecord = {
  currentStageLabel: string | null;
  id: string;
  leadAgency: {
    name: string;
  } | null;
  responseDeadlineAt: Date | null;
  solicitationNumber: string | null;
  title: string;
  updatedAt: Date;
};

export type AppShellTaskRecord = {
  deadlineReminderState: "NONE" | "OVERDUE" | "UPCOMING";
  dueAt: Date | null;
  id: string;
  opportunity: {
    id: string;
    title: string;
  };
  priority: "CRITICAL" | "HIGH" | "LOW" | "MEDIUM";
  status:
    | "BLOCKED"
    | "CANCELLED"
    | "COMPLETED"
    | "IN_PROGRESS"
    | "NOT_STARTED";
  title: string;
};

export type AppShellKnowledgeAssetRecord = {
  assetType: string;
  id: string;
  title: string;
  updatedAt: Date;
};

export type AppShellSavedSearchRecord = {
  canonicalFilters: Prisma.JsonValue;
  id: string;
  lastExecutedAt: Date | null;
  name: string;
  sourceSystem: string;
  updatedAt: Date;
};

export type AppShellSourceSyncRunRecord = {
  completedAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
  id: string;
  requestedAt: Date;
  savedSearch: {
    name: string;
  } | null;
  sourceSystem: string;
  status: "FAILED" | "QUEUED" | "RUNNING" | "SUCCEEDED";
};

export type AppShellRepositoryClient = {
  knowledgeAsset: {
    findMany(args: unknown): Promise<AppShellKnowledgeAssetRecord[]>;
  };
  opportunity: {
    findMany(args: unknown): Promise<AppShellOpportunityRecord[]>;
  };
  opportunityTask: {
    findMany(args: unknown): Promise<AppShellTaskRecord[]>;
  };
  sourceSavedSearch: {
    findMany(args: unknown): Promise<AppShellSavedSearchRecord[]>;
  };
  sourceSyncRun: {
    findMany(args: unknown): Promise<AppShellSourceSyncRunRecord[]>;
  };
};

export async function getAppShellSnapshot({
  db,
  organizationId,
  permissions,
  userId,
}: AppShellRepositoryParams): Promise<AppShellSnapshot> {
  const [
    opportunities,
    assignedTasks,
    knowledgeAssets,
    savedSearches,
    failedSyncRuns,
  ] = await Promise.all([
    db.opportunity.findMany({
      where: {
        organizationId,
        currentStageKey: {
          notIn: ["awarded", "lost", "no_bid"],
        },
      },
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
      take: APP_SHELL_COMMAND_LIMIT,
      select: {
        id: true,
        title: true,
        solicitationNumber: true,
        currentStageLabel: true,
        responseDeadlineAt: true,
        updatedAt: true,
        leadAgency: {
          select: {
            name: true,
          },
        },
      },
    }),
    db.opportunityTask.findMany({
      where: {
        organizationId,
        assigneeUserId: userId,
        status: {
          notIn: ["COMPLETED", "CANCELLED"],
        },
      },
      orderBy: [
        { deadlineReminderState: "asc" },
        { dueAt: "asc" },
        { updatedAt: "desc" },
      ],
      take: APP_SHELL_COMMAND_LIMIT,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueAt: true,
        deadlineReminderState: true,
        opportunity: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    db.knowledgeAsset.findMany({
      where: {
        organizationId,
        isArchived: false,
      },
      orderBy: [{ updatedAt: "desc" }, { title: "asc" }],
      take: APP_SHELL_COMMAND_LIMIT,
      select: {
        id: true,
        title: true,
        assetType: true,
        updatedAt: true,
      },
    }),
    permissions.allowManageSourceSearches || permissions.allowWorkspaceSettings
      ? db.sourceSavedSearch.findMany({
          where: {
            organizationId,
          },
          orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
          take: APP_SHELL_COMMAND_LIMIT,
          select: {
            id: true,
            name: true,
            sourceSystem: true,
            canonicalFilters: true,
            lastExecutedAt: true,
            updatedAt: true,
          },
        })
      : Promise.resolve([]),
    permissions.allowManageSourceSearches || permissions.allowWorkspaceSettings
      ? db.sourceSyncRun.findMany({
          where: {
            organizationId,
            status: "FAILED",
          },
          orderBy: [{ requestedAt: "desc" }],
          take: 2,
          select: {
            id: true,
            sourceSystem: true,
            status: true,
            errorCode: true,
            errorMessage: true,
            requestedAt: true,
            completedAt: true,
            savedSearch: {
              select: {
                name: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const notificationItems = [
    ...assignedTasks
      .filter((task) => task.deadlineReminderState === "OVERDUE")
      .slice(0, 3)
      .map((task) => ({
        href: `/opportunities/${task.opportunity.id}`,
        id: `task-overdue-${task.id}`,
        summary: `${task.opportunity.title}${task.dueAt ? ` · Due ${formatShortDate(task.dueAt)}` : ""}`,
        timestamp: toIsoString(task.dueAt),
        title: `${formatTaskPriority(task.priority)} task overdue`,
        tone: "danger" as const,
      })),
    ...assignedTasks
      .filter((task) => task.deadlineReminderState === "UPCOMING")
      .slice(0, 2)
      .map((task) => ({
        href: `/opportunities/${task.opportunity.id}`,
        id: `task-upcoming-${task.id}`,
        summary: `${task.title}${task.dueAt ? ` · Due ${formatShortDate(task.dueAt)}` : ""}`,
        timestamp: toIsoString(task.dueAt),
        title: `Upcoming task on ${task.opportunity.title}`,
        tone: "warning" as const,
      })),
    ...failedSyncRuns.map((run) => ({
      href: permissions.allowWorkspaceSettings ? "/settings" : "/sources",
      id: `sync-failed-${run.id}`,
      summary:
        run.errorMessage ??
        run.errorCode ??
        `${formatSourceSystemLabel(run.sourceSystem)} sync failed.`,
      timestamp: toIsoString(run.completedAt ?? run.requestedAt),
      title: run.savedSearch?.name
        ? `Saved search issue: ${run.savedSearch.name}`
        : `${formatSourceSystemLabel(run.sourceSystem)} connector issue`,
      tone: "warning" as const,
    })),
  ].slice(0, APP_SHELL_NOTIFICATION_LIMIT);

  const commandSections = [
      {
        key: "opportunities",
        label: "Pinned pursuits",
        items: opportunities.map((opportunity) => ({
          id: `opportunity-${opportunity.id}`,
          category: "opportunity" as const,
          description: [
            opportunity.currentStageLabel ?? "Tracked pursuit",
            opportunity.leadAgency?.name ?? null,
            opportunity.responseDeadlineAt
              ? `Deadline ${formatShortDate(opportunity.responseDeadlineAt)}`
              : null,
          ]
            .filter(Boolean)
            .join(" · "),
          href: `/opportunities/${opportunity.id}`,
          label: opportunity.title,
          navHref: "/opportunities",
          keywords: [
            opportunity.title,
            opportunity.solicitationNumber ?? "",
            opportunity.currentStageLabel ?? "",
            opportunity.leadAgency?.name ?? "",
          ].filter(Boolean),
          supportingText:
            opportunity.solicitationNumber ??
            (opportunity.responseDeadlineAt
              ? `Updated ${formatShortDate(opportunity.updatedAt)}`
              : null),
        })),
      } satisfies AppShellCommandSection,
      {
        key: "tasks",
        label: "Assigned tasks",
        items: assignedTasks.map((task) => ({
          id: `task-${task.id}`,
          category: "task" as const,
          description: [
            task.opportunity.title,
            formatTaskPriority(task.priority),
            task.dueAt ? `Due ${formatShortDate(task.dueAt)}` : null,
          ]
            .filter(Boolean)
            .join(" · "),
          href: `/opportunities/${task.opportunity.id}`,
          label: task.title,
          navHref: "/tasks",
          keywords: [
            task.title,
            task.opportunity.title,
            task.priority,
            task.status,
          ],
          supportingText:
            task.deadlineReminderState === "OVERDUE"
              ? "Overdue reminder"
              : task.deadlineReminderState === "UPCOMING"
                ? "Upcoming reminder"
                : formatTaskStatus(task.status),
        })),
      } satisfies AppShellCommandSection,
      {
        key: "knowledge",
        label: "Recent knowledge",
        items: knowledgeAssets.map((asset) => ({
          id: `knowledge-${asset.id}`,
          category: "knowledge" as const,
          description: `${formatKnowledgeAssetType(asset.assetType)} · Updated ${formatShortDate(asset.updatedAt)}`,
          href: `/knowledge?query=${encodeURIComponent(asset.title)}`,
          label: asset.title,
          navHref: "/knowledge",
          keywords: [asset.title, asset.assetType, formatKnowledgeAssetType(asset.assetType)],
          supportingText: formatKnowledgeAssetType(asset.assetType),
        })),
      } satisfies AppShellCommandSection,
      {
        key: "saved_searches",
        label: "Saved searches",
        items: savedSearches.map((savedSearch) => ({
          id: `saved-search-${savedSearch.id}`,
          category: "saved_search" as const,
          description: [
            formatSourceSystemLabel(savedSearch.sourceSystem),
            readSavedSearchKeywords(savedSearch.canonicalFilters),
            savedSearch.lastExecutedAt
              ? `Last run ${formatShortDate(savedSearch.lastExecutedAt)}`
              : "Not run yet",
          ]
            .filter(Boolean)
            .join(" · "),
          href: buildSavedSearchHref(savedSearch),
          label: savedSearch.name,
          navHref: "/sources",
          keywords: [
            savedSearch.name,
            formatSourceSystemLabel(savedSearch.sourceSystem),
            readSavedSearchKeywords(savedSearch.canonicalFilters),
          ].filter((keyword): keyword is string => Boolean(keyword)),
          supportingText: formatSourceSystemLabel(savedSearch.sourceSystem),
        })),
      } satisfies AppShellCommandSection,
    ].filter((section) => section.items.length > 0);

  return {
    commandSections,
    notifications: {
      items: notificationItems,
      totalCount: notificationItems.length,
    },
  };
}

function buildSavedSearchHref(savedSearch: AppShellSavedSearchRecord) {
  const params = new URLSearchParams();
  params.set("source", savedSearch.sourceSystem);

  const filters = readJsonRecord(savedSearch.canonicalFilters);
  appendSearchParamIfPresent(params, "keywords", readString(filters.keywords));
  appendSearchParamIfPresent(params, "postedFrom", readString(filters.postedDateFrom));
  appendSearchParamIfPresent(params, "postedTo", readString(filters.postedDateTo));
  appendSearchParamIfPresent(params, "rdlfrom", readString(filters.responseDeadlineFrom));
  appendSearchParamIfPresent(params, "rdlto", readString(filters.responseDeadlineTo));
  appendSearchParamIfPresent(params, "noticeid", readString(filters.noticeId));
  appendSearchParamIfPresent(
    params,
    "solnum",
    readString(filters.solicitationNumber),
  );
  appendSearchParamIfPresent(
    params,
    "organizationName",
    readString(filters.organizationName),
  );
  appendSearchParamIfPresent(
    params,
    "organizationCode",
    readString(filters.organizationCode),
  );
  appendSearchParamIfPresent(params, "ncode", readString(filters.naicsCode));
  appendSearchParamIfPresent(
    params,
    "ccode",
    readString(filters.classificationCode),
  );
  appendSearchParamIfPresent(
    params,
    "typeOfSetAside",
    readString(filters.setAsideCode),
  );
  appendSearchParamIfPresent(
    params,
    "typeOfSetAsideDescription",
    readString(filters.setAsideDescription),
  );
  appendSearchParamIfPresent(
    params,
    "state",
    readString(filters.placeOfPerformanceState),
  );
  appendSearchParamIfPresent(
    params,
    "zip",
    readString(filters.placeOfPerformanceZip),
  );
  appendSearchParamIfPresent(params, "status", readString(filters.status));

  const procurementTypes = readStringArray(filters.procurementTypes);
  for (const procurementType of procurementTypes) {
    params.append("ptype", procurementType);
  }

  const pageSize = readNumber(filters.pageSize);
  if (pageSize !== null) {
    params.set("limit", String(pageSize));
  }

  const pageOffset = readNumber(filters.pageOffset);
  if (pageOffset !== null) {
    params.set("offset", String(pageOffset));
  }

  const queryString = params.toString();
  return queryString ? `/sources?${queryString}` : "/sources";
}

function appendSearchParamIfPresent(
  params: URLSearchParams,
  key: string,
  value: string | null,
) {
  if (!value) {
    return;
  }

  params.set(key, value);
}

function readSavedSearchKeywords(value: Prisma.JsonValue) {
  const filters = readJsonRecord(value);
  return readString(filters.keywords);
}

function readJsonRecord(value: Prisma.JsonValue) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, Prisma.JsonValue>;
}

function readString(value: Prisma.JsonValue | undefined) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNumber(value: Prisma.JsonValue | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readStringArray(value: Prisma.JsonValue | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function formatTaskPriority(value: AppShellTaskRecord["priority"]) {
  switch (value) {
    case "CRITICAL":
      return "Critical";
    case "HIGH":
      return "High";
    case "LOW":
      return "Low";
    default:
      return "Medium";
  }
}

function formatTaskStatus(value: AppShellTaskRecord["status"]) {
  switch (value) {
    case "NOT_STARTED":
      return "Not started";
    case "IN_PROGRESS":
      return "In progress";
    case "BLOCKED":
      return "Blocked";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
  }
}

function formatKnowledgeAssetType(value: string) {
  switch (value) {
    case "PAST_PERFORMANCE_SNIPPET":
      return "Past performance";
    case "WIN_THEME":
      return "Win theme";
    case "BOILERPLATE":
      return "Boilerplate";
    default:
      return value
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

function formatSourceSystemLabel(value: string) {
  switch (value) {
    case "sam_gov":
      return "SAM.gov";
    case "usaspending_api":
      return "USAspending";
    case "gsa_ebuy":
      return "GSA eBuy";
    case "csv_upload":
      return "CSV import";
    default:
      return value;
  }
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(value);
}

function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null;
}

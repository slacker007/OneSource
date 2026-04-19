export type AppShellCommandCategory =
  | "knowledge"
  | "opportunity"
  | "quick_create"
  | "saved_search"
  | "task"
  | "view";

export type AppShellWorkbenchItem = {
  category: AppShellCommandCategory;
  description: string;
  href: string;
  label: string;
  navHref: string;
  supportingText: string | null;
};

export type AppShellCommandItem = AppShellWorkbenchItem & {
  id: string;
  keywords: string[];
};

export type AppShellCommandSection = {
  key: "knowledge" | "opportunities" | "saved_searches" | "tasks";
  label: string;
  items: AppShellCommandItem[];
};

export type AppShellNotificationTone = "accent" | "danger" | "warning";

export type AppShellNotificationItem = {
  href: string;
  id: string;
  summary: string;
  timestamp: string | null;
  title: string;
  tone: AppShellNotificationTone;
};

export type AppShellSnapshot = {
  commandSections: AppShellCommandSection[];
  notifications: {
    items: AppShellNotificationItem[];
    totalCount: number;
  };
};

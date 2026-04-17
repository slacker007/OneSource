export const SYSTEM_ROLE_DEFINITIONS = [
  {
    key: "admin",
    name: "Admin",
    description: "Manages workspace configuration, users, and audit access.",
  },
  {
    key: "executive",
    name: "Executive",
    description:
      "Reviews pipeline health, go or no-go decisions, and outcomes.",
  },
  {
    key: "business_development",
    name: "Business Development",
    description:
      "Owns early opportunity intake, qualification, and portfolio flow.",
  },
  {
    key: "capture_manager",
    name: "Capture Manager",
    description:
      "Leads capture strategy, stage movement, and pursuit execution.",
  },
  {
    key: "proposal_manager",
    name: "Proposal Manager",
    description:
      "Coordinates proposal readiness, schedules, and submission work.",
  },
  {
    key: "contributor",
    name: "Contributor",
    description: "Supports assigned tasks, notes, and document collaboration.",
  },
  {
    key: "viewer",
    name: "Viewer",
    description:
      "Has read-only access to permitted opportunities and dashboards.",
  },
];

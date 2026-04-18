import { SectionPlaceholder } from "@/components/layout/section-placeholder";

export const dynamic = "force-dynamic";

export default function TasksPage() {
  return (
    <SectionPlaceholder
      description="Capture execution work will converge here once Phase 5 adds task CRUD, milestones, activity entries, and reminder jobs. The shell now reserves a first-class route for that operational view."
      eyebrow="Tasks"
      highlights={[
        {
          label: "Execution focus",
          value: "Task board",
          detail:
            "Assignee, due date, status, priority, and opportunity linkage will surface here once the CRUD slice lands.",
        },
        {
          label: "Milestone follow-up",
          value: "Capture timeline",
          detail:
            "Decision checkpoints, response deadlines, and proposal milestones are planned as the next execution layers.",
        },
        {
          label: "Current state",
          value: "Responsive route",
          detail:
            "This section is already reachable from both the desktop sidebar and the mobile navigation drawer.",
        },
      ]}
      title="Execution queue"
    />
  );
}

import type { HomeDashboardSnapshot } from "@/modules/opportunities/opportunity.types";

const stageCardTones = [
  "bg-accent-soft text-accent-strong",
  "bg-[#efe1d3] text-[#7e431f]",
  "bg-[#dfe8ec] text-[#20465a]",
];

type AppShellPreviewProps = {
  snapshot: HomeDashboardSnapshot | null;
};

export function AppShellPreview({ snapshot }: AppShellPreviewProps) {
  const focusOpportunity = snapshot?.focusOpportunity ?? null;
  const priorities = snapshot
    ? [
        {
          label: "Pipeline health",
          value: `${snapshot.activeOpportunityCount} active pursuit${snapshot.activeOpportunityCount === 1 ? "" : "s"}`,
          detail: `${snapshot.opportunitiesRequiringAttentionCount} item${snapshot.opportunitiesRequiringAttentionCount === 1 ? "" : "s"} currently need capture-team attention.`,
        },
        {
          label: "Near-term deadlines",
          value: `${snapshot.upcomingDeadlineCount} response deadline${snapshot.upcomingDeadlineCount === 1 ? "" : "s"} due soon`,
          detail:
            focusOpportunity?.responseDeadlineAt
              ? `Closest deadline is ${formatShortDate(focusOpportunity.responseDeadlineAt)} for ${focusOpportunity.title}.`
              : "No active deadlines are stored in the current seeded workspace.",
        },
        {
          label: "Source coverage",
          value: `${snapshot.enabledConnectorCount} connector${snapshot.enabledConnectorCount === 1 ? "" : "s"} enabled`,
          detail:
            snapshot.connectors.length > 0
              ? `Typed repository access now wraps ${snapshot.connectors.length} persisted connector record${snapshot.connectors.length === 1 ? "" : "s"}.`
              : "No connector configurations are stored yet.",
        },
      ]
    : [
        {
          label: "Pipeline health",
          value: "Awaiting seeded data",
          detail:
            "The typed repository layer is wired in; load seed data to populate the workspace snapshot.",
        },
        {
          label: "Near-term deadlines",
          value: "No response dates yet",
          detail:
            "The home page now handles an empty persisted state without falling back to raw Prisma model payloads.",
        },
        {
          label: "Source coverage",
          value: "Connector data unavailable",
          detail:
            "Connector summaries will appear here once the organization seed has been applied.",
        },
      ];

  const stageCards = snapshot?.stageSummaries.slice(0, 3) ?? [];
  const decisionQueue = snapshot?.decisionQueue ?? [];
  const focusTasks = snapshot?.focusTasks ?? [];
  const focusMilestones = snapshot?.focusMilestones ?? [];

  return (
    <main className="shell-grid flex-1 px-4 py-5 sm:px-6 lg:px-8">
      <div className="border-border bg-surface mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] border shadow-[0_30px_120px_rgba(20,37,34,0.14)] lg:flex-row">
        <aside
          className="border-border flex w-full shrink-0 flex-col justify-between border-b bg-[rgba(15,28,31,0.96)] px-6 py-6 text-stone-100 lg:w-72 lg:border-r lg:border-b-0"
          data-panel
        >
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-[#dca167]" />
                OneSource
              </div>
              <div className="space-y-3">
                <p className="font-heading text-3xl leading-tight font-semibold">
                  Capture intelligence for the next serious bid.
                </p>
                <p className="max-w-xs text-sm leading-6 text-stone-300">
                  The first authenticated shell is live. Future slices can now
                  layer protected opportunity views, scoring, and workflow
                  controls on top of the seeded workspace baseline.
                </p>
              </div>
            </div>

            <nav aria-label="Primary" className="space-y-3 text-sm">
              {[
                "Dashboard",
                "Opportunities",
                "Sources",
                "Tasks",
                "Analytics",
              ].map((item, index) => (
                <div
                  key={item}
                  className={`rounded-2xl px-4 py-3 ${
                    index === 0
                      ? "bg-white/10 text-white"
                      : "text-stone-300 transition-colors hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item}
                </div>
              ))}
            </nav>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs tracking-[0.24em] text-stone-400 uppercase">
              Current loop
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-200">
              `P2-01` adds Auth.js sign-in, sign-out, JWT-backed session
              handling, and route protection so anonymous users cannot access
              the app shell.
            </p>
          </div>
        </aside>

        <section className="bg-surface-strong flex-1 px-6 py-6 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6">
            <header className="border-border flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <p className="text-muted text-sm tracking-[0.28em] uppercase">
                  Platform preview
                </p>
                <div className="space-y-2">
                  <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                    Government opportunity tracking with audit-ready decisions.
                  </h1>
                  <p className="text-muted max-w-3xl text-base leading-7">
                    Authenticated users can now enter the application through a
                    protected shell while later slices continue building on the
                    typed opportunity, connector, and workspace foundation.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="border-border text-foreground rounded-full border bg-white px-4 py-2 font-medium">
                  Status: Auth gate active
                </div>
                <div className="bg-accent rounded-full px-4 py-2 font-medium text-white">
                  Next: Permissions
                </div>
              </div>
            </header>

            <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
              <div className="grid gap-4 md:grid-cols-3">
                {priorities.map((item) => (
                  <article
                    key={item.label}
                    className="border-border rounded-[24px] border bg-white p-5 shadow-[0_14px_36px_rgba(19,36,34,0.06)]"
                  >
                    <p className="text-muted text-sm tracking-[0.18em] uppercase">
                      {item.label}
                    </p>
                    <p className="font-heading text-foreground mt-4 text-2xl font-semibold">
                      {item.value}
                    </p>
                    <p className="text-muted mt-2 text-sm leading-6">
                      {item.detail}
                    </p>
                  </article>
                ))}
              </div>

              <article className="border-border rounded-[28px] border bg-[linear-gradient(135deg,rgba(32,95,85,0.97),rgba(16,58,53,1))] p-6 text-white shadow-[0_22px_60px_rgba(16,58,53,0.32)]">
                <p className="text-sm tracking-[0.24em] text-white/70 uppercase">
                  Decision queue
                </p>
                {focusOpportunity ? (
                  <>
                    <p className="font-heading mt-4 text-3xl leading-tight font-semibold">
                      {focusOpportunity.title}
                    </p>
                    <div className="mt-4 space-y-2 text-sm text-white/80">
                      <p>
                        {focusOpportunity.currentStageLabel}
                        {focusOpportunity.leadAgency
                          ? ` for ${focusOpportunity.leadAgency.name}`
                          : ""}
                      </p>
                      {focusOpportunity.score?.totalScore ? (
                        <p>
                          Current score {focusOpportunity.score.totalScore}
                          {focusOpportunity.score.maximumScore
                            ? ` / ${focusOpportunity.score.maximumScore}`
                            : ""}
                          {focusOpportunity.score.recommendationOutcome
                            ? ` with ${focusOpportunity.score.recommendationOutcome} recommendation`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-6 space-y-3 text-sm text-white/80">
                      {decisionQueue.map((opportunity, index) => (
                        <p key={opportunity.id}>
                          {index + 1}. {opportunity.title}
                        </p>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-heading mt-4 text-3xl leading-tight font-semibold">
                      No persisted opportunities yet.
                    </p>
                    <p className="mt-6 text-sm text-white/80">
                      Run the seed workflow to populate the typed dashboard
                      snapshot with opportunities, tasks, milestones, and bid
                      decisions.
                    </p>
                  </>
                )}
              </article>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <article className="border-border rounded-[28px] border bg-white p-6 shadow-[0_14px_40px_rgba(19,36,34,0.06)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted text-sm tracking-[0.22em] uppercase">
                      Pipeline snapshot
                    </p>
                    <p className="font-heading mt-2 text-2xl font-semibold">
                      Current stage distribution
                    </p>
                  </div>
                  <div className="bg-accent-soft text-accent-strong rounded-full px-4 py-2 text-sm font-medium">
                    Typed DTOs
                  </div>
                </div>
                {stageCards.length > 0 ? (
                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {stageCards.map((item, index) => (
                      <div
                        key={item.stageKey}
                        className={`rounded-3xl px-5 py-6 ${stageCardTones[index % stageCardTones.length]}`}
                      >
                        <p className="text-sm tracking-[0.18em] uppercase opacity-75">
                          {item.stageLabel}
                        </p>
                        <p className="font-heading mt-4 text-4xl font-semibold">
                          {item.opportunityCount}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted mt-6 text-sm leading-6">
                    Seeded opportunity records will appear here once the
                    organization has active pursuits in the database.
                  </p>
                )}
              </article>

              <article className="border-border rounded-[28px] border bg-[#f6efe4] p-6 shadow-[0_14px_40px_rgba(67,49,33,0.08)]">
                <p className="text-sm tracking-[0.22em] text-[#8b6e56] uppercase">
                  Execution focus
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="font-heading text-foreground text-2xl font-semibold">
                      Open capture tasks
                    </p>
                    {focusTasks.length > 0 ? (
                      <ul className="text-muted mt-4 space-y-3 text-sm leading-6">
                        {focusTasks.map((task) => (
                          <li
                            key={task.id}
                            className="rounded-2xl border border-black/6 bg-white/70 px-4 py-3"
                          >
                            <p className="text-foreground font-medium">
                              {task.title}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em]">
                              {task.priority}
                              {task.dueAt ? ` · due ${formatShortDate(task.dueAt)}` : ""}
                              {task.assigneeName ? ` · ${task.assigneeName}` : ""}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted mt-4 text-sm leading-6">
                        No active tasks are stored for the current focus
                        opportunity.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="font-heading text-foreground text-2xl font-semibold">
                      Upcoming milestones
                    </p>
                    {focusMilestones.length > 0 ? (
                      <div className="mt-4 space-y-3">
                        {focusMilestones.map((milestone) => (
                          <div
                            key={milestone.id}
                            className="flex items-center justify-between rounded-2xl border border-black/6 bg-white/70 px-4 py-3"
                          >
                            <span className="text-foreground text-sm font-medium">
                              {milestone.title}
                            </span>
                            <span className="text-warning rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase">
                              {formatShortDate(milestone.targetDate)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted mt-4 text-sm leading-6">
                        No active milestones are stored for the current focus
                        opportunity.
                      </p>
                    )}
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function formatShortDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoDate));
}

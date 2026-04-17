const priorities = [
  {
    label: "Pipeline health",
    value: "28 active pursuits",
    detail: "9 require go/no-go review within 5 business days.",
  },
  {
    label: "Near-term deadlines",
    value: "6 submissions due",
    detail: "Highest urgency is DHS zero trust support, due Apr 24.",
  },
  {
    label: "Source coverage",
    value: "SAM.gov ready",
    detail: "Connector and normalized ingestion land in later phases.",
  },
];

const stageCards = [
  { stage: "Qualified", count: 14, tone: "bg-accent-soft text-accent-strong" },
  { stage: "Capture", count: 8, tone: "bg-[#efe1d3] text-[#7e431f]" },
  { stage: "Proposal", count: 4, tone: "bg-[#dfe8ec] text-[#20465a]" },
];

const tasks = [
  "Approve scoring weights for cyber recompetes",
  "Confirm incumbent and vehicle access assumptions",
  "Draft timeline for CMS data modernization bid",
];

const milestones = [
  { title: "Go/no-go board", date: "Apr 22" },
  { title: "Draft review", date: "Apr 25" },
  { title: "Submission", date: "Apr 30" },
];

export function AppShellPreview() {
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
                  The repo is now scaffolded with the app, styling, linting,
                  unit tests, and browser smoke coverage needed for Phase 0.
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
              `P0-01` establishes the application shell and verification
              workflow before database, auth, and connector work begin.
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
                    This starter shell anchors the repo with a credible
                    homepage, shared visual direction, and testable scaffolding
                    for the modules that follow.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="border-border text-foreground rounded-full border bg-white px-4 py-2 font-medium">
                  Status: Foundation active
                </div>
                <div className="bg-accent rounded-full px-4 py-2 font-medium text-white">
                  Next: Docker + env validation
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
                <p className="font-heading mt-4 text-3xl leading-tight font-semibold">
                  3 opportunities need executive review this week.
                </p>
                <div className="mt-6 space-y-3 text-sm text-white/80">
                  <p>1. DHS enterprise monitoring BPA</p>
                  <p>2. CMS data modernization task order</p>
                  <p>3. Army cloud operations recompete</p>
                </div>
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
                    Placeholder data
                  </div>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  {stageCards.map((item) => (
                    <div
                      key={item.stage}
                      className={`rounded-3xl px-5 py-6 ${item.tone}`}
                    >
                      <p className="text-sm tracking-[0.18em] uppercase opacity-75">
                        {item.stage}
                      </p>
                      <p className="font-heading mt-4 text-4xl font-semibold">
                        {item.count}
                      </p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="border-border rounded-[28px] border bg-[#f6efe4] p-6 shadow-[0_14px_40px_rgba(67,49,33,0.08)]">
                <p className="text-sm tracking-[0.22em] text-[#8b6e56] uppercase">
                  Execution focus
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="font-heading text-foreground text-2xl font-semibold">
                      Today&apos;s priority tasks
                    </p>
                    <ul className="text-muted mt-4 space-y-3 text-sm leading-6">
                      {tasks.map((task) => (
                        <li
                          key={task}
                          className="rounded-2xl border border-black/6 bg-white/70 px-4 py-3"
                        >
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="font-heading text-foreground text-2xl font-semibold">
                      Upcoming milestones
                    </p>
                    <div className="mt-4 space-y-3">
                      {milestones.map((milestone) => (
                        <div
                          key={milestone.title}
                          className="flex items-center justify-between rounded-2xl border border-black/6 bg-white/70 px-4 py-3"
                        >
                          <span className="text-foreground text-sm font-medium">
                            {milestone.title}
                          </span>
                          <span className="text-warning rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase">
                            {milestone.date}
                          </span>
                        </div>
                      ))}
                    </div>
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

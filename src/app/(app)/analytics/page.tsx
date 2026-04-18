import { SectionPlaceholder } from "@/components/layout/section-placeholder";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  return (
    <SectionPlaceholder
      description="Pipeline and decision analytics land here. The shared shell now exposes a stable analytics route before Phase 9 fills it with real conversion, aging, and outcome views."
      eyebrow="Analytics"
      highlights={[
        {
          label: "Phase 9 target",
          value: "Pipeline health",
          detail:
            "Stage counts, conversion rates, aging, and deadline pressure will render from persisted opportunity data.",
        },
        {
          label: "Decision lens",
          value: "Bid quality",
          detail:
            "Go/no-go volume, score distribution, and effort-versus-outcome analysis are planned for the next analytics slices.",
        },
        {
          label: "Current state",
          value: "Route ready",
          detail:
            "Navigation, responsive layout, and protected access are in place so later analytics work can drop into a stable shell.",
        },
      ]}
      title="Analytics workspace"
    />
  );
}

import { SectionPlaceholder } from "@/components/layout/section-placeholder";

export const dynamic = "force-dynamic";

export default function SourcesPage() {
  return (
    <SectionPlaceholder
      description="External search, result review, and import promotion will live here. The shell now reserves a dedicated source-intake route ahead of the Phase 4 and Phase 7 connector work."
      eyebrow="Sources"
      highlights={[
        {
          label: "Planned flow",
          value: "Search and preview",
          detail:
            "Connector-backed search, result preview, and pull-into-pipeline actions start with the `sam.gov` integration slices.",
        },
        {
          label: "Connector baseline",
          value: "Source-aware schema",
          detail:
            "Connector metadata, saved search envelopes, raw payload retention, and import-decision persistence are already in the database.",
        },
        {
          label: "Current state",
          value: "Navigation ready",
          detail:
            "The route now exists for desktop and small-screen navigation and can accept connector UI without shell refactoring.",
        },
      ]}
      title="Source intake"
    />
  );
}

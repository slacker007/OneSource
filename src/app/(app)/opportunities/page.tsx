import { SectionPlaceholder } from "@/components/layout/section-placeholder";

export const dynamic = "force-dynamic";

export default function OpportunitiesPage() {
  return (
    <SectionPlaceholder
      description="This route is reserved for the canonical opportunities list. The authenticated shell now gives the list page a stable URL and navigation target before the Phase 4 list, filters, and pagination arrive."
      eyebrow="Opportunities"
      highlights={[
        {
          label: "Next slice",
          value: "P4-01",
          detail:
            "Search, sort, filter, pagination, and URL-synced query state will live on this page.",
        },
        {
          label: "Data model",
          value: "Canonical records",
          detail:
            "Opportunity, lineage, task, milestone, and decision persistence already exist underneath this placeholder.",
        },
        {
          label: "Why now",
          value: "Truthful navigation",
          detail:
            "Users can move through the major workspace sections without hitting dead labels or unfinished routes.",
        },
      ]}
      title="Opportunity pipeline"
    />
  );
}

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  KNOWLEDGE_ASSET_TYPE_LABELS,
  type KnowledgeLibrarySnapshot,
} from "@/modules/knowledge/knowledge.types";

type KnowledgeLibraryProps = {
  allowManageKnowledge?: boolean;
  notice?: {
    title: string;
    message: string;
    tone: "accent" | "warning" | "danger";
  } | null;
  snapshot: KnowledgeLibrarySnapshot | null;
};

export function KnowledgeLibrary({
  allowManageKnowledge = false,
  notice = null,
  snapshot,
}: KnowledgeLibraryProps) {
  if (!snapshot) {
    return (
      <section className="space-y-4">
        <p className="text-muted text-sm tracking-[0.26em] uppercase">
          Knowledge
        </p>
        <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
          Knowledge library
        </h1>
        <ErrorState
          message="The knowledge library could not load an organization-scoped snapshot. Re-seed the local database or verify the authenticated user still belongs to the default workspace."
          title="Knowledge data is unavailable"
        />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="border-border bg-surface rounded-[28px] border px-6 py-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Knowledge system</Badge>
              <Badge tone="muted">Reusable content</Badge>
              <Badge tone="warning">Opportunity-linked</Badge>
            </div>
            <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
              Knowledge library
            </h1>
            <p className="text-muted max-w-3xl text-sm leading-7">
              Capture reusable past performance, boilerplate, and win themes in
              one organization-scoped library. Assets now carry both freeform
              tags and structured agency, capability, contract-type, and vehicle
              coverage so the team can narrow reusable content faster.
            </p>
          </div>

          <div className="space-y-3">
            {allowManageKnowledge ? (
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)]"
                href="/knowledge/new"
              >
                Create knowledge asset
              </Link>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Assets"
                supportingText="Reusable records visible in this workspace"
                value={String(snapshot.totalCount)}
              />
              <SummaryCard
                label="Tag labels"
                supportingText="Distinct freeform and structured labels in the current result set"
                value={String(snapshot.totalTagCount)}
              />
              <SummaryCard
                label="Linked pursuits"
                supportingText="Distinct opportunities referenced by current assets"
                value={String(snapshot.totalLinkedOpportunityCount)}
              />
              <SummaryCard
                label="Active filters"
                supportingText={
                  snapshot.availableFilterCount > 0
                    ? "Applied from the URL query string"
                    : "Showing the full library"
                }
                value={String(snapshot.availableFilterCount)}
              />
            </div>
          </div>
        </div>
      </header>

      {notice ? (
        <Banner
          message={notice.message}
          title={notice.title}
          tone={notice.tone}
        />
      ) : null}

      <section className="border-border bg-surface rounded-[32px] border px-6 py-6 shadow-[0_20px_60px_rgba(20,37,34,0.08)] sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Filters
            </p>
            <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
              Find reusable content quickly
            </h2>
            <p className="text-muted max-w-2xl text-sm leading-6">
              Filter the current library by keyword, asset type, freeform tag,
              agency, capability, contract type, vehicle, or linked opportunity.
            </p>
          </div>

          <Link
            className="text-sm font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
            href="/knowledge"
          >
            Clear filters
          </Link>
        </div>

        <form
          action="/knowledge"
          className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4"
        >
          <FormField
            hint="Matches title, summary, body text, tags, and linked opportunity titles."
            htmlFor="knowledge-query"
            label="Search"
          >
            <Input
              defaultValue={snapshot.query.query ?? ""}
              id="knowledge-query"
              name="q"
              placeholder="Search reusable content"
              type="search"
            />
          </FormField>

          <FormField htmlFor="knowledge-type" label="Asset type">
            <Select
              defaultValue={snapshot.query.assetType ?? ""}
              id="knowledge-type"
              name="type"
            >
              <option value="">All asset types</option>
              {snapshot.filterOptions.assetTypes.map((assetType) => (
                <option key={assetType.value} value={assetType.value}>
                  {assetType.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField htmlFor="knowledge-tag" label="Tag">
            <Select
              defaultValue={snapshot.query.tag ?? ""}
              id="knowledge-tag"
              name="tag"
            >
              <option value="">All tags</option>
              {snapshot.filterOptions.tags.map((tag) => (
                <option key={tag.value} value={tag.value}>
                  {tag.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField htmlFor="knowledge-agency" label="Agency">
            <Select
              defaultValue={snapshot.query.agencyId ?? ""}
              id="knowledge-agency"
              name="agency"
            >
              <option value="">All agencies</option>
              {snapshot.filterOptions.agencies.map((agency) => (
                <option key={agency.value} value={agency.value}>
                  {agency.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField htmlFor="knowledge-capability" label="Capability">
            <Select
              defaultValue={snapshot.query.capabilityKey ?? ""}
              id="knowledge-capability"
              name="capability"
            >
              <option value="">All capabilities</option>
              {snapshot.filterOptions.capabilities.map((capability) => (
                <option key={capability.value} value={capability.value}>
                  {capability.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField htmlFor="knowledge-contract-type" label="Contract type">
            <Select
              defaultValue={snapshot.query.contractType ?? ""}
              id="knowledge-contract-type"
              name="contractType"
            >
              <option value="">All contract types</option>
              {snapshot.filterOptions.contractTypes.map((contractType) => (
                <option key={contractType.value} value={contractType.value}>
                  {contractType.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField htmlFor="knowledge-vehicle" label="Vehicle">
            <Select
              defaultValue={snapshot.query.vehicleCode ?? ""}
              id="knowledge-vehicle"
              name="vehicle"
            >
              <option value="">All vehicles</option>
              {snapshot.filterOptions.vehicles.map((vehicle) => (
                <option key={vehicle.value} value={vehicle.value}>
                  {vehicle.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField htmlFor="knowledge-opportunity" label="Linked opportunity">
            <Select
              defaultValue={snapshot.query.opportunityId ?? ""}
              id="knowledge-opportunity"
              name="opportunity"
            >
              <option value="">All linked opportunities</option>
              {snapshot.filterOptions.opportunities.map((opportunity) => (
                <option key={opportunity.value} value={opportunity.value}>
                  {opportunity.label}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="flex items-end xl:col-span-4">
            <button
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)]"
              type="submit"
            >
              Apply filters
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Results
            </p>
            <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
              {snapshot.totalCount === 1
                ? "1 knowledge asset"
                : `${snapshot.totalCount} knowledge assets`}
            </h2>
          </div>

          {snapshot.availableFilterCount > 0 ? (
            <div className="flex flex-wrap gap-2">
              {buildActiveFilterBadges(snapshot).map((badge) => (
                <Badge key={badge}>{badge}</Badge>
              ))}
            </div>
          ) : null}
        </div>

        <DataTable
          ariaLabel="Knowledge asset results"
          columns={[
            {
              key: "asset",
              header: "Asset",
              cell: (asset) => (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge>
                      {KNOWLEDGE_ASSET_TYPE_LABELS[asset.assetType]}
                    </Badge>
                    {asset.tags.map((tag) => (
                      <Badge key={tag} tone="muted">
                        {tag}
                      </Badge>
                    ))}
                    {asset.facets.agencies.map((agency) => (
                      <Badge key={`${asset.id}-${agency}`} tone="accent">
                        {agency}
                      </Badge>
                    ))}
                    {asset.facets.capabilities.map((capability) => (
                      <Badge key={`${asset.id}-${capability}`} tone="warning">
                        {capability}
                      </Badge>
                    ))}
                    {asset.facets.contractTypes.map((contractType) => (
                      <Badge key={`${asset.id}-${contractType}`} tone="muted">
                        {contractType}
                      </Badge>
                    ))}
                    {asset.facets.vehicles.map((vehicle) => (
                      <Badge key={`${asset.id}-${vehicle}`} tone="accent">
                        {vehicle}
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <p className="text-foreground font-medium">{asset.title}</p>
                    {asset.summary ? (
                      <p className="text-muted text-sm leading-6">
                        {asset.summary}
                      </p>
                    ) : null}
                  </div>
                </div>
              ),
            },
            {
              key: "content",
              header: "Reusable content",
              cell: (asset) => (
                <p className="text-muted text-sm leading-6">
                  {asset.bodyPreview}
                </p>
              ),
            },
            {
              key: "opportunities",
              header: "Linked opportunities",
              cell: (asset) =>
                asset.linkedOpportunities.length > 0 ? (
                  <div className="space-y-2">
                    {asset.linkedOpportunities.map((opportunity) => (
                      <div key={opportunity.id} className="space-y-1">
                        <p className="text-foreground font-medium">
                          {opportunity.title}
                        </p>
                        <p className="text-muted text-xs">
                          {opportunity.currentStageLabel}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-sm">
                    Not linked to a tracked pursuit yet.
                  </p>
                ),
            },
            {
              key: "updated",
              header: "Updated",
              cell: (asset) => (
                <div className="space-y-2">
                  <p className="text-foreground font-medium">
                    {formatUtcDate(asset.updatedAt)}
                  </p>
                  <p className="text-muted text-xs">
                    {asset.updatedByLabel
                      ? `Last updated by ${asset.updatedByLabel}`
                      : "Updater unavailable"}
                  </p>
                  {allowManageKnowledge ? (
                    <Link
                      className="text-sm font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
                      href={`/knowledge/${asset.id}/edit`}
                    >
                      Edit asset
                    </Link>
                  ) : null}
                </div>
              ),
            },
          ]}
          emptyState={
            <EmptyState
              message="Create a reusable knowledge asset or clear the filters to restore the full library."
              title="No knowledge assets match the current view"
            />
          }
          getRowKey={(asset) => asset.id}
          rows={snapshot.results}
        />
      </section>
    </section>
  );
}

function SummaryCard({
  label,
  supportingText,
  value,
}: {
  label: string;
  supportingText: string;
  value: string;
}) {
  return (
    <article className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-white px-4 py-4">
      <p className="text-muted text-xs tracking-[0.18em] uppercase">{label}</p>
      <p className="font-heading text-foreground mt-3 text-3xl font-semibold tracking-[-0.04em]">
        {value}
      </p>
      <p className="text-muted mt-2 text-xs leading-5">{supportingText}</p>
    </article>
  );
}

function Banner({
  message,
  title,
  tone,
}: {
  message: string;
  title: string;
  tone: "accent" | "warning" | "danger";
}) {
  return (
    <section className="border-border rounded-[28px] border bg-white px-6 py-5 shadow-[0_14px_34px_rgba(20,37,34,0.06)]">
      <div className="flex flex-wrap gap-3">
        <Badge tone={tone}>{title}</Badge>
      </div>
      <p className="text-muted mt-3 text-sm leading-6">{message}</p>
    </section>
  );
}

function buildActiveFilterBadges(snapshot: KnowledgeLibrarySnapshot) {
  const badges: string[] = [];

  if (snapshot.query.query) {
    badges.push(`Search: ${snapshot.query.query}`);
  }

  if (snapshot.query.assetType) {
    badges.push(KNOWLEDGE_ASSET_TYPE_LABELS[snapshot.query.assetType]);
  }

  if (snapshot.query.tag) {
    badges.push(`Tag: ${snapshot.query.tag}`);
  }

  if (snapshot.query.agencyId) {
    const agencyLabel =
      snapshot.filterOptions.agencies.find(
        (agency) => agency.value === snapshot.query.agencyId,
      )?.label ?? snapshot.query.agencyId;
    badges.push(`Agency: ${agencyLabel}`);
  }

  if (snapshot.query.capabilityKey) {
    const capabilityLabel =
      snapshot.filterOptions.capabilities.find(
        (capability) => capability.value === snapshot.query.capabilityKey,
      )?.label ?? snapshot.query.capabilityKey;
    badges.push(`Capability: ${capabilityLabel}`);
  }

  if (snapshot.query.contractType) {
    const contractTypeLabel =
      snapshot.filterOptions.contractTypes.find(
        (contractType) => contractType.value === snapshot.query.contractType,
      )?.label ?? snapshot.query.contractType;
    badges.push(`Contract type: ${contractTypeLabel}`);
  }

  if (snapshot.query.opportunityId) {
    const opportunityLabel =
      snapshot.filterOptions.opportunities.find(
        (opportunity) => opportunity.value === snapshot.query.opportunityId,
      )?.label ?? snapshot.query.opportunityId;
    badges.push(`Opportunity: ${opportunityLabel}`);
  }

  if (snapshot.query.vehicleCode) {
    const vehicleLabel =
      snapshot.filterOptions.vehicles.find(
        (vehicle) => vehicle.value === snapshot.query.vehicleCode,
      )?.label ?? snapshot.query.vehicleCode;
    badges.push(`Vehicle: ${vehicleLabel}`);
  }

  return badges;
}

function formatUtcDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

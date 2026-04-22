import type { ReactNode } from "react";

import { KnowledgeCopyButton } from "@/components/knowledge/knowledge-copy-button";
import { Button } from "@/components/ui/button";
import {
  ActiveFilterChipBar,
  type ActiveFilterChip,
} from "@/components/ui/active-filter-chip-bar";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FeedbackBanner } from "@/components/ui/feedback-banner";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  PreviewPanel,
  type PreviewPanelMetadataItem,
} from "@/components/ui/preview-panel";
import {
  SavedViewControls,
  type SavedViewControlItem,
} from "@/components/ui/saved-view-controls";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import type {
  KnowledgeAssetListQuery,
  KnowledgeAssetSummary,
  KnowledgeFacetOption,
  KnowledgeLibrarySnapshot,
} from "@/modules/knowledge/knowledge.types";
import {
  KNOWLEDGE_ASSET_TYPE_LABELS,
  KNOWLEDGE_ASSET_TYPES,
} from "@/modules/knowledge/knowledge.types";

export type KnowledgeLibraryViewState = {
  previewAssetId: string | null;
};

type KnowledgeLibraryProps = {
  allowManageKnowledge?: boolean;
  notice?: {
    title: string;
    message: string;
    tone: "accent" | "warning" | "danger";
  } | null;
  snapshot: KnowledgeLibrarySnapshot | null;
  viewState: KnowledgeLibraryViewState;
};

export function KnowledgeLibrary({
  allowManageKnowledge = false,
  notice = null,
  snapshot,
  viewState,
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

  const selectedAsset =
    snapshot.results.find((asset) => asset.id === viewState.previewAssetId) ??
    snapshot.results[0] ??
    null;
  const resetHref = buildKnowledgeLibraryHref(snapshot.query, viewState, {
    agencyId: null,
    assetType: null,
    capabilityKey: null,
    contractType: null,
    opportunityId: null,
    previewAssetId: null,
    query: null,
    tag: null,
    vehicleCode: null,
  });
  const activeFilterChips = buildActiveFilterChips(snapshot, viewState);
  const assetViewItems = buildAssetViewItems(snapshot, viewState);
  const activeViewLabel = snapshot.query.assetType
    ? KNOWLEDGE_ASSET_TYPE_LABELS[snapshot.query.assetType]
    : "All asset types";

  return (
    <section className="space-y-6">
      <Surface component="header" sx={{ px: { sm: 4, xs: 3 }, py: 3 }}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>Knowledge</Badge>
              <Badge tone="muted">Strategic asset browser</Badge>
              <Badge tone="accent">Preview-first</Badge>
            </div>
            <div className="space-y-2">
              <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
                Knowledge library
              </h1>
              <p className="text-muted max-w-3xl text-sm leading-7">
                Scan reusable win themes, past performance, and boilerplate from
                one asset browser, then keep the selected narrative visible
                while narrowing by agency, capability, contract type, vehicle,
                and linked pursuit context.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 xl:items-end">
            {allowManageKnowledge ? (
              <Button href="/knowledge/new">
                Create knowledge asset
              </Button>
            ) : null}
            <p className="text-right text-sm text-muted">
              Library workspace:{" "}
              <span className="font-medium text-foreground">
                {snapshot.organization.name}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Asset view"
            supportingText="Selected browse lane for the current scan"
            value={activeViewLabel}
          />
          <SummaryCard
            label="Results"
            supportingText="Assets returned by the current query"
            value={String(snapshot.totalCount)}
          />
          <SummaryCard
            label="Linked pursuits"
            supportingText="Distinct tracked opportunities referenced by the current result set"
            value={String(snapshot.totalLinkedOpportunityCount)}
          />
          <SummaryCard
            label="Active filters"
            supportingText={
              snapshot.availableFilterCount > 0
                ? "Layered narrowing on top of the selected asset view"
                : "Showing the full library"
            }
            value={String(snapshot.availableFilterCount)}
          />
        </div>

        <div className="mt-6">
          <SavedViewControls items={assetViewItems} label="Asset views" />
        </div>
      </Surface>

      {notice ? (
        <FeedbackBanner
          message={notice.message}
          title={notice.title}
          tone={
            notice.tone === "accent"
              ? "success"
              : notice.tone === "warning"
                ? "warning"
                : "danger"
          }
        />
      ) : null}

      <details className="border-border bg-surface rounded-[24px] border px-5 py-4 shadow-[0_14px_36px_rgba(20,37,34,0.06)] xl:hidden">
        <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
          Open filters and taxonomy
        </summary>
        <div className="mt-4">
          <KnowledgeFilterRail
            idPrefix="mobile"
            query={snapshot.query}
            resetHref={resetHref}
            snapshot={snapshot}
            viewState={viewState}
          />
        </div>
      </details>

      <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_24rem]">
        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <KnowledgeFilterRail
              idPrefix="desktop"
              query={snapshot.query}
              resetHref={resetHref}
              snapshot={snapshot}
              viewState={viewState}
            />
          </div>
        </aside>

        <section className="space-y-4">
          <Surface component="section" sx={{ px: { sm: 3, xs: 2.5 }, py: 2.5 }}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-muted text-xs tracking-[0.24em] uppercase">
                    Asset queue
                  </p>
                  <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
                    {snapshot.totalCount === 1
                      ? "1 knowledge asset"
                      : `${snapshot.totalCount} knowledge assets`}
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    Select one row to keep its reusable narrative and linked
                    pursuits visible beside the browse table.
                  </p>
                </div>

                <div className="space-y-2 lg:text-right">
                  <p className="text-muted text-xs tracking-[0.2em] uppercase">
                    Preview focus
                  </p>
                  <p className="text-sm text-foreground">
                    {selectedAsset ? selectedAsset.title : "Choose a result"}
                  </p>
                </div>
              </div>

              <ActiveFilterChipBar
                chips={activeFilterChips}
                clearHref={resetHref}
                emptyLabel="No active filter chips beyond the selected asset view."
              />
            </div>
          </Surface>

          <DataTable
            ariaLabel="Knowledge asset results"
            caption="Knowledge asset results with reusable content, structured coverage, linked pursuits, and preview actions."
            columns={[
              {
                key: "asset",
                header: "Asset",
                className: "min-w-[20rem]",
                cell: (asset) => <KnowledgeAssetCell asset={asset} />,
              },
              {
                key: "coverage",
                header: "Coverage",
                className: "min-w-[16rem]",
                cell: (asset) => <KnowledgeCoverageCell asset={asset} />,
              },
              {
                key: "pursuits",
                header: "Linked pursuits",
                className: "min-w-[14rem]",
                cell: (asset) => <KnowledgeLinkedPursuitsCell asset={asset} />,
              },
              {
                key: "actions",
                header: "Last updated",
                className: "min-w-[12rem]",
                cell: (asset) => (
                  <KnowledgeActionsCell
                    allowManageKnowledge={allowManageKnowledge}
                    asset={asset}
                    previewHref={buildKnowledgeLibraryHref(
                      snapshot.query,
                      viewState,
                      {
                        previewAssetId: asset.id,
                      },
                    )}
                  />
                ),
              },
            ]}
            emptyState={
              <EmptyState
                action={
                  <Button density="compact" href={resetHref}>
                    Reset the library view
                  </Button>
                }
                message="Create a reusable knowledge asset or clear the current filters to restore the full strategic library."
                title="No knowledge assets match the current view"
              />
            }
            getRowKey={(asset) => asset.id}
            rows={snapshot.results}
            selectedRowId={selectedAsset?.id ?? null}
          />
        </section>

        {selectedAsset ? (
          <PreviewPanel
            actions={
              <>
                <KnowledgeCopyButton
                  label="Copy reusable content"
                  text={selectedAsset.body}
                />
                {allowManageKnowledge ? (
                  <Button
                    density="compact"
                    href={`/knowledge/${selectedAsset.id}/edit`}
                    tone="neutral"
                    variant="outlined"
                  >
                    Edit asset
                  </Button>
                ) : null}
              </>
            }
            className="xl:sticky xl:top-24"
            description={
              selectedAsset.summary ??
              "Reusable content, structured retrieval coverage, and linked pursuits remain visible here while you browse."
            }
            eyebrow="Selected asset"
            label="Selected asset"
            metadata={buildPreviewMetadata(selectedAsset)}
            title={selectedAsset.title}
          >
            <PreviewSection title="Reusable content">
              <Surface
                sx={{
                  bgcolor: "rgba(18, 33, 40, 0.035)",
                  borderRadius: 2.5,
                  px: 2,
                  py: 2,
                }}
              >
                {selectedAsset.body}
              </Surface>
            </PreviewSection>

            <PreviewSection title="Structured coverage">
              <div className="space-y-3">
                <CoverageList
                  emptyLabel="No agency coverage tagged"
                  label="Agencies"
                  values={selectedAsset.facets.agencies}
                />
                <CoverageList
                  emptyLabel="No capability coverage tagged"
                  label="Capabilities"
                  values={selectedAsset.facets.capabilities}
                />
                <CoverageList
                  emptyLabel="No contract type coverage tagged"
                  label="Contract types"
                  values={selectedAsset.facets.contractTypes}
                />
                <CoverageList
                  emptyLabel="No vehicle coverage tagged"
                  label="Vehicles"
                  values={selectedAsset.facets.vehicles}
                />
                <CoverageList
                  emptyLabel="No freeform tags"
                  label="Freeform tags"
                  values={selectedAsset.tags}
                />
              </div>
            </PreviewSection>

            <PreviewSection title="Linked pursuits">
              {selectedAsset.linkedOpportunities.length > 0 ? (
                <div className="space-y-3">
                  {selectedAsset.linkedOpportunities.map((opportunity) => (
                    <article
                      className="px-4 py-4"
                      key={opportunity.id}
                    >
                      <Surface
                        sx={{
                          bgcolor: "rgba(18, 33, 40, 0.035)",
                          borderRadius: 2.5,
                          px: 2,
                          py: 2,
                        }}
                      >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <Button
                          href={`/opportunities/${opportunity.id}`}
                          tone="neutral"
                          variant="text"
                        >
                          {opportunity.title}
                        </Button>
                        <Badge tone="muted">
                          {opportunity.currentStageLabel}
                        </Badge>
                      </div>
                      </Surface>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted">
                  This asset is not linked to a tracked pursuit yet.
                </p>
              )}
            </PreviewSection>
          </PreviewPanel>
        ) : null}
      </div>
    </section>
  );
}

function KnowledgeFilterRail({
  idPrefix,
  query,
  resetHref,
  snapshot,
  viewState,
}: {
  idPrefix: string;
  query: KnowledgeAssetListQuery;
  resetHref: string;
  snapshot: KnowledgeLibrarySnapshot;
  viewState: KnowledgeLibraryViewState;
}) {
  return (
    <Surface component="section" sx={{ px: 2.5, py: 2.5 }}>
      <div className="space-y-2">
        <p className="text-muted text-xs tracking-[0.22em] uppercase">
          Filter rail
        </p>
        <h2 className="font-heading text-xl font-semibold tracking-[-0.03em] text-foreground">
          Refine the library
        </h2>
        <p className="text-sm leading-6 text-muted">
          Keep search and structured filters close by, then jump between the
          densest agency, capability, contract-type, and vehicle slices without
          leaving the queue.
        </p>
      </div>

      <form action="/knowledge" className="mt-5 space-y-4">
        <FormField
          hint="Matches asset title, summary, body text, tags, and linked pursuit titles."
          htmlFor={`${idPrefix}-knowledge-query`}
          label="Search"
        >
          <Input
            defaultValue={query.query ?? ""}
            id={`${idPrefix}-knowledge-query`}
            name="q"
            placeholder="Search knowledge assets"
            type="search"
          />
        </FormField>

        <FormField htmlFor={`${idPrefix}-knowledge-type`} label="Asset type">
          <Select
            defaultValue={query.assetType ?? ""}
            id={`${idPrefix}-knowledge-type`}
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

        <FormField htmlFor={`${idPrefix}-knowledge-tag`} label="Tag">
          <Select
            defaultValue={query.tag ?? ""}
            id={`${idPrefix}-knowledge-tag`}
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

        <FormField htmlFor={`${idPrefix}-knowledge-agency`} label="Agency">
          <Select
            defaultValue={query.agencyId ?? ""}
            id={`${idPrefix}-knowledge-agency`}
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

        <FormField
          htmlFor={`${idPrefix}-knowledge-capability`}
          label="Capability"
        >
          <Select
            defaultValue={query.capabilityKey ?? ""}
            id={`${idPrefix}-knowledge-capability`}
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

        <FormField
          htmlFor={`${idPrefix}-knowledge-contract-type`}
          label="Contract type"
        >
          <Select
            defaultValue={query.contractType ?? ""}
            id={`${idPrefix}-knowledge-contract-type`}
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

        <FormField htmlFor={`${idPrefix}-knowledge-vehicle`} label="Vehicle">
          <Select
            defaultValue={query.vehicleCode ?? ""}
            id={`${idPrefix}-knowledge-vehicle`}
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

        <FormField
          htmlFor={`${idPrefix}-knowledge-opportunity`}
          label="Linked pursuit"
        >
          <Select
            defaultValue={query.opportunityId ?? ""}
            id={`${idPrefix}-knowledge-opportunity`}
            name="opportunity"
          >
            <option value="">All linked pursuits</option>
            {snapshot.filterOptions.opportunities.map((opportunity) => (
              <option key={opportunity.value} value={opportunity.value}>
                {opportunity.label}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="space-y-3">
          <Button fullWidth type="submit">
            Apply filters
          </Button>
          <Button
            density="compact"
            fullWidth
            href={resetHref}
            tone="neutral"
            variant="outlined"
          >
            Clear all filters
          </Button>
        </div>
      </form>

      <div className="mt-6 space-y-5 border-border border-t pt-5">
        <TaxonomyShortcutSection
          activeValue={query.agencyId}
          description="Jump straight into the agencies already represented in the workspace."
          emptyMessage="No agencies are available in this workspace."
          field="agencyId"
          options={snapshot.filterOptions.agencies}
          query={query}
          title="Agency coverage"
          viewState={viewState}
        />
        <TaxonomyShortcutSection
          activeValue={query.capabilityKey}
          description="Use capability slices to line up reusable narratives with the active pursuit gap."
          emptyMessage="No capabilities are configured yet."
          field="capabilityKey"
          options={snapshot.filterOptions.capabilities}
          query={query}
          title="Capabilities"
          viewState={viewState}
        />
        <TaxonomyShortcutSection
          activeValue={query.contractType}
          description="Pull up assets already tagged for the contract posture you are working."
          emptyMessage="No contract types have been observed yet."
          field="contractType"
          options={snapshot.filterOptions.contractTypes}
          query={query}
          title="Contract types"
          viewState={viewState}
        />
        <TaxonomyShortcutSection
          activeValue={query.vehicleCode}
          description="Move directly into the vehicles where reusable language has already proven useful."
          emptyMessage="No vehicles are available in this workspace."
          field="vehicleCode"
          options={snapshot.filterOptions.vehicles}
          query={query}
          title="Vehicles"
          viewState={viewState}
        />
      </div>
    </Surface>
  );
}

function TaxonomyShortcutSection({
  activeValue,
  description,
  emptyMessage,
  field,
  options,
  query,
  title,
  viewState,
}: {
  activeValue: string | null;
  description: string;
  emptyMessage: string;
  field: "agencyId" | "capabilityKey" | "contractType" | "vehicleCode";
  options: KnowledgeFacetOption[];
  query: KnowledgeAssetListQuery;
  title: string;
  viewState: KnowledgeLibraryViewState;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold tracking-[0.02em] text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-6 text-muted">{description}</p>
      </div>

      {options.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const nextValue = activeValue === option.value ? null : option.value;

            return (
              <Button
                aria-current={activeValue === option.value ? "page" : undefined}
                density="compact"
                href={buildKnowledgeLibraryHref(query, viewState, {
                  [field]: nextValue,
                  previewAssetId: null,
                })}
                key={option.value}
                title={option.description ?? option.label}
                tone="neutral"
                variant={activeValue === option.value ? "soft" : "outlined"}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm leading-6 text-muted">{emptyMessage}</p>
      )}
    </section>
  );
}

function KnowledgeAssetCell({ asset }: { asset: KnowledgeAssetSummary }) {
  const hiddenTagCount = Math.max(asset.tags.length - 2, 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Badge>{KNOWLEDGE_ASSET_TYPE_LABELS[asset.assetType]}</Badge>
        {asset.tags.slice(0, 2).map((tag) => (
          <Badge key={`${asset.id}-${tag}`} tone="muted">
            {tag}
          </Badge>
        ))}
        {hiddenTagCount > 0 ? (
          <Badge tone="muted">+{hiddenTagCount} more tags</Badge>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <p className="font-medium text-foreground">{asset.title}</p>
        <p className="text-sm leading-6 text-muted">
          {asset.summary ?? asset.bodyPreview}
        </p>
      </div>
    </div>
  );
}

function KnowledgeCoverageCell({ asset }: { asset: KnowledgeAssetSummary }) {
  return (
    <div className="space-y-2">
      <CoverageSummaryLine
        emptyLabel="No agency coverage"
        label="Agencies"
        values={asset.facets.agencies}
      />
      <CoverageSummaryLine
        emptyLabel="No capability coverage"
        label="Capabilities"
        values={asset.facets.capabilities}
      />
      <CoverageSummaryLine
        emptyLabel="No contract types"
        label="Contract types"
        values={asset.facets.contractTypes}
      />
      <CoverageSummaryLine
        emptyLabel="No vehicles"
        label="Vehicles"
        values={asset.facets.vehicles}
      />
    </div>
  );
}

function KnowledgeLinkedPursuitsCell({
  asset,
}: {
  asset: KnowledgeAssetSummary;
}) {
  if (asset.linkedOpportunities.length === 0) {
    return (
      <p className="text-sm leading-6 text-muted">
        Not linked to a tracked pursuit yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {asset.linkedOpportunities.map((opportunity) => (
        <div key={opportunity.id} className="space-y-1">
          <p className="font-medium text-foreground">{opportunity.title}</p>
          <p className="text-xs text-muted">{opportunity.currentStageLabel}</p>
        </div>
      ))}
    </div>
  );
}

function KnowledgeActionsCell({
  allowManageKnowledge,
  asset,
  previewHref,
}: {
  allowManageKnowledge: boolean;
  asset: KnowledgeAssetSummary;
  previewHref: string;
}) {
  return (
    <div className="space-y-2">
      <p className="font-medium text-foreground">{formatUtcDate(asset.updatedAt)}</p>
      <p className="text-xs text-muted">
        {asset.updatedByLabel
          ? `Last updated by ${asset.updatedByLabel}`
          : "Updater unavailable"}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button density="compact" href={previewHref} variant="text">
          Preview asset
        </Button>
        {allowManageKnowledge ? (
          <Button
            density="compact"
            href={`/knowledge/${asset.id}/edit`}
            tone="neutral"
            variant="text"
          >
            Edit
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function PreviewSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold tracking-[0.02em] text-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function CoverageList({
  emptyLabel,
  label,
  values,
}: {
  emptyLabel: string;
  label: string;
  values: string[];
}) {
  return (
    <div className="space-y-2">
      <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-muted uppercase">
        {label}
      </p>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={`${label}-${value}`} tone="muted">
              {value}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-muted">{emptyLabel}</p>
      )}
    </div>
  );
}

function CoverageSummaryLine({
  emptyLabel,
  label,
  values,
}: {
  emptyLabel: string;
  label: string;
  values: string[];
}) {
  return (
    <div className="space-y-1">
      <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-muted uppercase">
        {label}
      </p>
      <p className="text-sm leading-6 text-foreground">
        {values.length > 0 ? values.join(", ") : emptyLabel}
      </p>
    </div>
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
    <Surface component="article" sx={{ borderRadius: 3, px: 2, py: 2 }}>
      <p className="text-muted text-xs tracking-[0.18em] uppercase">{label}</p>
      <p className="font-heading text-foreground mt-3 text-3xl font-semibold tracking-[-0.04em]">
        {value}
      </p>
      <p className="text-muted mt-2 text-xs leading-5">{supportingText}</p>
    </Surface>
  );
}

function buildAssetViewItems(
  snapshot: KnowledgeLibrarySnapshot,
  viewState: KnowledgeLibraryViewState,
): SavedViewControlItem[] {
  return [
    {
      active: snapshot.query.assetType == null,
      href: buildKnowledgeLibraryHref(snapshot.query, viewState, {
        assetType: null,
        previewAssetId: null,
      }),
      label: "All assets",
    },
    ...KNOWLEDGE_ASSET_TYPES.map((assetType) => ({
      active: snapshot.query.assetType === assetType,
      href: buildKnowledgeLibraryHref(snapshot.query, viewState, {
        assetType,
        previewAssetId: null,
      }),
      label: KNOWLEDGE_ASSET_TYPE_LABELS[assetType],
    })),
  ];
}

function buildActiveFilterChips(
  snapshot: KnowledgeLibrarySnapshot,
  viewState: KnowledgeLibraryViewState,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (snapshot.query.query) {
    chips.push({
      href: buildKnowledgeLibraryHref(snapshot.query, viewState, {
        previewAssetId: null,
        query: null,
      }),
      label: `Search: ${snapshot.query.query}`,
    });
  }

  if (snapshot.query.assetType) {
    chips.push({
      href: buildKnowledgeLibraryHref(snapshot.query, viewState, {
        assetType: null,
        previewAssetId: null,
      }),
      label: KNOWLEDGE_ASSET_TYPE_LABELS[snapshot.query.assetType],
    });
  }

  if (snapshot.query.tag) {
    chips.push({
      href: buildKnowledgeLibraryHref(snapshot.query, viewState, {
        previewAssetId: null,
        tag: null,
      }),
      label: `Tag: ${snapshot.query.tag}`,
    });
  }

  if (snapshot.query.agencyId) {
    chips.push({
      href: buildKnowledgeLibraryHref(snapshot.query, viewState, {
        agencyId: null,
        previewAssetId: null,
      }),
      label: `Agency: ${resolveOptionLabel(
        snapshot.filterOptions.agencies,
        snapshot.query.agencyId,
      )}`,
    });
  }

  if (snapshot.query.capabilityKey) {
    chips.push({
      href: buildKnowledgeLibraryHref(snapshot.query, viewState, {
        capabilityKey: null,
        previewAssetId: null,
      }),
      label: `Capability: ${resolveOptionLabel(
        snapshot.filterOptions.capabilities,
        snapshot.query.capabilityKey,
      )}`,
    });
  }

  if (snapshot.query.contractType) {
    chips.push({
      href: buildKnowledgeLibraryHref(snapshot.query, viewState, {
        contractType: null,
        previewAssetId: null,
      }),
      label: `Contract type: ${resolveOptionLabel(
        snapshot.filterOptions.contractTypes,
        snapshot.query.contractType,
      )}`,
    });
  }

  if (snapshot.query.opportunityId) {
    chips.push({
      href: buildKnowledgeLibraryHref(snapshot.query, viewState, {
        opportunityId: null,
        previewAssetId: null,
      }),
      label: `Pursuit: ${
        snapshot.filterOptions.opportunities.find(
          (opportunity) => opportunity.value === snapshot.query.opportunityId,
        )?.label ?? snapshot.query.opportunityId
      }`,
    });
  }

  if (snapshot.query.vehicleCode) {
    chips.push({
      href: buildKnowledgeLibraryHref(snapshot.query, viewState, {
        previewAssetId: null,
        vehicleCode: null,
      }),
      label: `Vehicle: ${resolveOptionLabel(
        snapshot.filterOptions.vehicles,
        snapshot.query.vehicleCode,
      )}`,
    });
  }

  return chips;
}

function buildKnowledgeLibraryHref(
  query: KnowledgeAssetListQuery,
  viewState: KnowledgeLibraryViewState,
  overrides: Partial<KnowledgeAssetListQuery> & {
    previewAssetId?: string | null;
  },
) {
  const nextQuery = {
    ...query,
    ...overrides,
  };
  const nextPreviewAssetId =
    overrides.previewAssetId === undefined
      ? viewState.previewAssetId
      : overrides.previewAssetId;
  const params = new URLSearchParams();

  if (nextQuery.query) {
    params.set("q", nextQuery.query);
  }

  if (nextQuery.assetType) {
    params.set("type", nextQuery.assetType);
  }

  if (nextQuery.tag) {
    params.set("tag", nextQuery.tag);
  }

  if (nextQuery.agencyId) {
    params.set("agency", nextQuery.agencyId);
  }

  if (nextQuery.capabilityKey) {
    params.set("capability", nextQuery.capabilityKey);
  }

  if (nextQuery.contractType) {
    params.set("contractType", nextQuery.contractType);
  }

  if (nextQuery.opportunityId) {
    params.set("opportunity", nextQuery.opportunityId);
  }

  if (nextQuery.vehicleCode) {
    params.set("vehicle", nextQuery.vehicleCode);
  }

  if (nextPreviewAssetId) {
    params.set("preview", nextPreviewAssetId);
  }

  const queryString = params.toString();
  return queryString ? `/knowledge?${queryString}` : "/knowledge";
}

function buildPreviewMetadata(
  asset: KnowledgeAssetSummary,
): PreviewPanelMetadataItem[] {
  return [
    {
      label: "Asset type",
      value: KNOWLEDGE_ASSET_TYPE_LABELS[asset.assetType],
    },
    {
      label: "Updated",
      value: formatUtcDate(asset.updatedAt),
    },
    {
      label: "Updated by",
      value: asset.updatedByLabel ?? "Unknown actor",
    },
    {
      label: "Linked pursuits",
      value: String(asset.linkedOpportunities.length),
    },
    {
      label: "Structured facets",
      value: String(
        asset.facets.agencies.length +
          asset.facets.capabilities.length +
          asset.facets.contractTypes.length +
          asset.facets.vehicles.length,
      ),
    },
    {
      label: "Freeform tags",
      value: String(asset.tags.length),
    },
  ];
}

function resolveOptionLabel(
  options: KnowledgeFacetOption[],
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatUtcDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

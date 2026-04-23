"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import MuiDrawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  DataGrid,
  type GridColDef,
} from "@mui/x-data-grid";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import {
  ActiveFilterChipBar,
  type ActiveFilterChip,
} from "@/components/ui/active-filter-chip-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
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
  OpportunityListItemSummary,
  OpportunityListQuery,
  OpportunityListSavedViewKey,
  OpportunityListSnapshot,
} from "@/modules/opportunities/opportunity.types";
import { onesourceTokens } from "@/theme/onesource-theme";

export type OpportunityListViewState = {
  density: "compact" | "comfortable";
  previewOpportunityId: string | null;
};

type OpportunityListProps = {
  snapshot: OpportunityListSnapshot | null;
  viewState: OpportunityListViewState;
};

export function OpportunityList({ snapshot, viewState }: OpportunityListProps) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showDesktopFilters, setShowDesktopFilters] = useState(false);

  if (!snapshot) {
    return (
      <Stack component="section" spacing={2.5}>
        <Typography
          sx={{
            color: onesourceTokens.color.text.muted,
            fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
            fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
          }}
        >
          Pipeline
        </Typography>
        <Surface sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h1">Opportunity pipeline</Typography>
          <ErrorState
            className="mt-4"
            message="The opportunities queue could not load an organization-scoped snapshot. Re-seed the local database or verify the authenticated user still belongs to the default workspace."
            title="Opportunity data is unavailable"
          />
        </Surface>
      </Stack>
    );
  }

  const showingFrom =
    snapshot.totalCount === 0
      ? 0
      : (snapshot.query.page - 1) * snapshot.query.pageSize + 1;
  const showingTo =
    snapshot.totalCount === 0
      ? 0
      : showingFrom + snapshot.pageResultCount - 1;
  const previewOpportunity =
    snapshot.results.find(
      (opportunity) => opportunity.id === viewState.previewOpportunityId,
    ) ?? null;
  const activeSavedView = resolveActiveSavedView(snapshot);
  const activeFilterChips = buildActiveFilterChips(snapshot.query, viewState);
  const savedViewItems = buildSavedViewItems(snapshot, viewState);
  const densityOptions = buildDensityOptions(snapshot.query, viewState);
  const sortOptions = buildSortOptions(snapshot.query, viewState);
  const resetHref = buildOpportunityListHref(snapshot.query, viewState, {
    agencyId: null,
    dueWindow: "all",
    naicsCode: null,
    page: 1,
    previewOpportunityId: null,
    query: null,
    savedViewKey: null,
    sort: "updated_desc",
    sourceSystem: null,
    stageKey: null,
  });
  const visibleDeadlineCount = snapshot.results.filter(
    (opportunity) => opportunity.responseDeadlineAt,
  ).length;
  const visibleGoCount = snapshot.results.filter((opportunity) => {
    const outcome =
      opportunity.bidDecision?.finalOutcome ??
      opportunity.score?.recommendationOutcome ??
      null;

    return outcome === "GO";
  }).length;
  const previewHref = previewOpportunity
    ? buildOpportunityListHref(snapshot.query, viewState, {
        page: snapshot.query.page,
        previewOpportunityId: previewOpportunity.id,
      })
    : null;
  const closePreviewHref = buildOpportunityListHref(snapshot.query, viewState, {
    page: snapshot.query.page,
    previewOpportunityId: null,
  });
  const gridColumns: GridColDef<OpportunityListItemSummary>[] = [
    {
      field: "pursuit",
      flex: 1.8,
      headerName: "Pursuit",
      minWidth: 360,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ py: 1.25 }}>
          <Typography sx={{ fontSize: "0.95rem", fontWeight: 600 }}>
            {row.title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
            {row.leadAgency?.name ?? "No lead agency assigned"}
            {row.solicitationNumber ? ` · Solicitation ${row.solicitationNumber}` : ""}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", mt: 1.25 }}>
            {row.naicsCode ? <Badge tone="muted">NAICS {row.naicsCode}</Badge> : null}
            {row.vehicles.slice(0, 1).map((vehicle) => (
              <Badge key={vehicle.id} tone="muted">
                {vehicle.code}
              </Badge>
            ))}
            {row.tasks.length > 0 ? (
              <Badge tone="muted">{row.tasks.length} open tasks</Badge>
            ) : null}
          </Stack>
          {row.sourceSummaryText ? (
            <Typography color="text.secondary" sx={{ mt: 1.25 }} variant="body2">
              {truncateText(row.sourceSummaryText, 150)}
            </Typography>
          ) : null}
        </Box>
      ),
    },
    {
      field: "deadline",
      headerName: "Deadline",
      minWidth: 150,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack spacing={1} sx={{ py: 1.5 }}>
          <Typography sx={{ fontSize: "0.94rem", fontWeight: 600 }}>
            {row.responseDeadlineAt
              ? formatShortDate(row.responseDeadlineAt)
              : "Not set"}
          </Typography>
          <Badge tone={getDueBadgeTone(row.responseDeadlineAt)}>
            {getDueLabel(row.responseDeadlineAt)}
          </Badge>
        </Stack>
      ),
    },
    {
      field: "stage",
      headerName: "Stage",
      minWidth: 180,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack spacing={1} sx={{ py: 1.5 }}>
          <Badge tone="muted">{row.currentStageLabel}</Badge>
          <Typography color="text.secondary" variant="caption">
            Updated {formatShortDate(row.updatedAt)}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "source",
      headerName: "Source",
      minWidth: 160,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack spacing={1} sx={{ py: 1.5 }}>
          <Badge tone="warning">{row.sourceDisplayLabel}</Badge>
          <Typography color="text.secondary" variant="caption">
            {row.leadAgency?.organizationCode ?? "No agency code"}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "score",
      headerName: "Decision",
      minWidth: 150,
      sortable: false,
      renderCell: ({ row }) => {
        const scoreValue = row.score?.totalScore
          ? `${row.score.totalScore}/100`
          : "Unscored";
        const decisionLabel =
          row.bidDecision?.finalOutcome ??
          row.score?.recommendationOutcome ??
          "Pending";

        return (
          <Stack spacing={1} sx={{ py: 1.5 }}>
            <Typography sx={{ fontSize: "0.94rem", fontWeight: 600 }}>
              {scoreValue}
            </Typography>
            <Badge tone="accent">{decisionLabel}</Badge>
          </Stack>
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 170,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", py: 1.5 }}>
          <Button
            density="compact"
            href={buildOpportunityListHref(snapshot.query, viewState, {
              page: snapshot.query.page,
              previewOpportunityId: row.id,
            })}
            tone="neutral"
            variant="soft"
          >
            Preview
          </Button>
          <Button density="compact" href={`/opportunities/${row.id}`} variant="text">
            Workspace
          </Button>
          <Button
            density="compact"
            href={`/opportunities/${row.id}/edit`}
            tone="neutral"
            variant="text"
          >
            Edit
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <Stack component="section" spacing={2.5}>
      <Box
        component="header"
        sx={{
          borderBottom: `1px solid ${onesourceTokens.color.border.subtle}`,
          pb: 2.5,
        }}
      >
        <Stack spacing={3}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2.5}
            sx={{ alignItems: { lg: "flex-end" }, justifyContent: "space-between" }}
          >
            <Stack spacing={1.5}>
              <Typography
                sx={{
                  color: onesourceTokens.color.text.muted,
                  fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
                  fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                }}
              >
                Pipeline
              </Typography>
              <Typography variant="h1">Opportunity pipeline</Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 760 }} variant="body1">
                Scan the pipeline, narrow the queue quickly, and move into capture work
                without losing context.
              </Typography>
            </Stack>

            <Stack spacing={1.5} sx={{ alignItems: { lg: "flex-end" } }}>
              <Stack direction="row" spacing={1.25} sx={{ flexWrap: "wrap" }}>
                <Button
                  density="compact"
                  onClick={() => {
                    if (window.matchMedia("(min-width:1200px)").matches) {
                      setShowDesktopFilters((current) => !current);
                      return;
                    }

                    setFiltersOpen(true);
                  }}
                  tone="neutral"
                  variant="outlined"
                >
                  <FilterListRoundedIcon fontSize="small" />
                  {showDesktopFilters ? "Hide filters" : "Show filters"}
                </Button>
                <Button href="/opportunities/new">Create tracked opportunity</Button>
              </Stack>
              <Typography color="text.secondary" variant="body2">
                Workspace:{" "}
                <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>
                  {snapshot.organization.name}
                </Box>
              </Typography>
            </Stack>
          </Stack>

          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2}
            sx={{ alignItems: { lg: "center" }, justifyContent: "space-between" }}
          >
            <SavedViewControls items={savedViewItems} label="Saved views" />
            <DensityToggleInline options={densityOptions} />
          </Stack>

          <Box
            sx={{
              borderBottom: `1px solid ${onesourceTokens.color.border.subtle}`,
              borderTop: `1px solid ${onesourceTokens.color.border.subtle}`,
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
              py: 1.5,
            }}
          >
            <InlineStat
              label="Queue"
              supportingText="Current saved view"
              value={activeSavedView?.label ?? "Custom view"}
            />
            <InlineStat
              label="Results"
              supportingText={`Showing ${snapshot.totalCount} total matches`}
              value={`${showingFrom}-${showingTo}`}
            />
            <InlineStat
              label="Visible deadlines"
              supportingText="Response dates on this page"
              value={String(visibleDeadlineCount)}
            />
            <InlineStat
              label="Visible go calls"
              supportingText="Current GO posture on this page"
              value={String(visibleGoCount)}
            />
          </Box>
        </Stack>
      </Box>

      <Drawer
        description="Adjust search, stage, source, due-window, and sort controls without leaving the queue."
        eyebrow="Pipeline filters"
        hideAbove="lg"
        onClose={() => setFiltersOpen(false)}
        open={filtersOpen}
        title="Refine the queue"
        width={360}
      >
        <OpportunityFilterPanel
          idPrefix="mobile"
          layout="drawer"
          onSubmitComplete={() => setFiltersOpen(false)}
          query={snapshot.query}
          resetHref={resetHref}
          snapshot={snapshot}
          viewState={viewState}
        />
      </Drawer>

      {showDesktopFilters ? (
        <Box sx={{ display: { xs: "none", lg: "block" } }}>
          <OpportunityFilterPanel
            idPrefix="desktop"
            layout="inline"
            query={snapshot.query}
            resetHref={resetHref}
            snapshot={snapshot}
            viewState={viewState}
          />
        </Box>
      ) : null}

      <Stack spacing={2}>
        <Stack spacing={1.5}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={2}
            sx={{ alignItems: { lg: "flex-start" }, justifyContent: "space-between" }}
          >
            <Stack spacing={0.75}>
              <Typography
                sx={{
                  color: onesourceTokens.color.text.muted,
                  fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
                  fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Active queue
              </Typography>
              <Typography variant="h4">
                Showing {showingFrom}-{showingTo} of {snapshot.totalCount} pursuits
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Select a row to open the side preview, then move into the workspace
                when you need to act.
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography
                sx={{
                  color: onesourceTokens.color.text.muted,
                  fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
                  fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Sort by
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {sortOptions.map((option) => (
                  <Button
                    aria-current={option.active ? "page" : undefined}
                    density="compact"
                    href={option.href}
                    key={option.label}
                    tone={option.active ? "primary" : "neutral"}
                    variant={option.active ? "soft" : "outlined"}
                  >
                    {option.label}
                  </Button>
                ))}
              </Stack>
            </Stack>
          </Stack>

          <ActiveFilterChipBar
            chips={activeFilterChips}
            clearHref={resetHref}
            emptyLabel="No extra filters applied."
          />
        </Stack>

        {snapshot.results.length > 0 ? (
          <>
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              <Surface
                sx={{
                  overflow: "hidden",
                  p: 0,
                }}
              >
                <DataGrid
                  aria-label="Opportunity pipeline results"
                  autoHeight
                  columns={gridColumns}
                  density={viewState.density === "compact" ? "compact" : "comfortable"}
                  disableColumnFilter
                  disableColumnMenu
                  disableDensitySelector
                  disableRowSelectionOnClick={false}
                  getRowHeight={() => "auto"}
                  getRowClassName={(params) =>
                    params.id === previewOpportunity?.id ? "onesource-selected-row" : ""
                  }
                  hideFooter
                  rows={snapshot.results}
                  sx={{
                    border: 0,
                    "& .MuiDataGrid-cell": {
                      alignItems: "flex-start",
                      borderBottomColor: onesourceTokens.color.border.subtle,
                      py: 0.5,
                    },
                    "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                      outline: "none",
                    },
                    "& .MuiDataGrid-columnHeader": {
                      backgroundColor: onesourceTokens.color.surface.warm,
                      borderBottomColor: onesourceTokens.color.border.subtle,
                    },
                    "& .MuiDataGrid-columnHeaderTitle": {
                      fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
                      fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
                      letterSpacing: onesourceTokens.typographyRole.eyebrow.letterSpacing,
                      textTransform: "uppercase",
                    },
                    "& .MuiDataGrid-row": {
                      cursor: "pointer",
                    },
                    "& .onesource-selected-row": {
                      backgroundColor: onesourceTokens.interaction.selectedOverlay,
                    },
                    "& .onesource-selected-row:hover": {
                      backgroundColor: onesourceTokens.interaction.selectedOverlay,
                    },
                  }}
                  onRowClick={(params) => {
                    router.push(
                      buildOpportunityListHref(snapshot.query, viewState, {
                        page: snapshot.query.page,
                        previewOpportunityId: String(params.id),
                      }),
                    );
                  }}
                />
              </Surface>
            </Box>

            <Stack spacing={1.5} sx={{ display: { xs: "flex", md: "none" } }}>
              {snapshot.results.map((opportunity) => (
                <MobileOpportunityCard
                  href={buildOpportunityListHref(snapshot.query, viewState, {
                    page: snapshot.query.page,
                    previewOpportunityId: opportunity.id,
                  })}
                  isSelected={opportunity.id === previewOpportunity?.id}
                  key={opportunity.id}
                  opportunity={opportunity}
                />
              ))}
            </Stack>
          </>
        ) : (
          <EmptyState
            action={
              <Button density="compact" href={resetHref}>
                Reset to all opportunities
              </Button>
            }
            message="Adjust the current filters or return to the default queue to restore tracked pursuits."
            title="No opportunities match this filter set"
          />
        )}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
        >
          <Typography color="text.secondary" variant="body2">
            Page {snapshot.query.page} of {snapshot.pageCount}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <PaginationLink
              disabled={snapshot.query.page <= 1}
              href={buildOpportunityListHref(snapshot.query, viewState, {
                page: snapshot.query.page - 1,
                previewOpportunityId: null,
              })}
            >
              Previous
            </PaginationLink>

            {Array.from({ length: snapshot.pageCount }, (_, index) => index + 1).map(
              (pageNumber) => (
                <PaginationLink
                  active={pageNumber === snapshot.query.page}
                  href={buildOpportunityListHref(snapshot.query, viewState, {
                    page: pageNumber,
                    previewOpportunityId: null,
                  })}
                  key={pageNumber}
                >
                  {String(pageNumber)}
                </PaginationLink>
              ),
            )}

            <PaginationLink
              disabled={snapshot.query.page >= snapshot.pageCount}
              href={buildOpportunityListHref(snapshot.query, viewState, {
                page: snapshot.query.page + 1,
                previewOpportunityId: null,
              })}
            >
              Next
            </PaginationLink>
          </Stack>
        </Stack>
      </Stack>

      <OpportunityPreviewDrawer
        onClose={() => router.push(closePreviewHref)}
        open={Boolean(previewOpportunity)}
        opportunity={previewOpportunity}
        previewHref={previewHref}
      />
    </Stack>
  );
}

function OpportunityFilterPanel({
  idPrefix,
  layout = "drawer",
  onSubmitComplete,
  query,
  resetHref,
  snapshot,
  viewState,
}: {
  idPrefix: string;
  layout?: "drawer" | "inline";
  onSubmitComplete?: () => void;
  query: OpportunityListQuery;
  resetHref: string;
  snapshot: OpportunityListSnapshot;
  viewState: OpportunityListViewState;
}) {
  return (
    <Box
      component="section"
      sx={{
        bgcolor:
          layout === "inline"
            ? onesourceTokens.color.surface.warm
            : onesourceTokens.color.surface.raised,
        border: `1px solid ${onesourceTokens.color.border.subtle}`,
        borderRadius: `${onesourceTokens.radius.panel}px`,
        px: { sm: 3, xs: 2.5 },
        py: 2.5,
      }}
    >
      <Stack spacing={2}>
        <Stack spacing={1}>
          <Typography
            sx={{
              color: onesourceTokens.color.text.muted,
              fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
              fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Queue controls
          </Typography>
          <Typography variant="h6">Refine the pipeline</Typography>
          <Typography color="text.secondary" variant="body2">
            Search, stage, source, deadline window, and NAICS stay URL-backed.
          </Typography>
        </Stack>

        <Box
          action="/opportunities"
          component="form"
          onSubmit={() => onSubmitComplete?.()}
          sx={{ display: "grid", gap: 2 }}
        >
          <input name="density" type="hidden" value={viewState.density} />
          {query.savedViewKey && query.savedViewKey !== "all" ? (
            <input name="view" type="hidden" value={query.savedViewKey} />
          ) : null}

          <FormField
            hint="Search title, solicitation number, agency name, and brief summary."
            htmlFor={`${idPrefix}-opportunity-query`}
            label="Search"
          >
            <Input
              defaultValue={query.query ?? ""}
              id={`${idPrefix}-opportunity-query`}
              name="q"
              placeholder="Search pursuits"
              type="search"
            />
          </FormField>

          <FormField
            hint="Use NAICS when you need a fast market-fit filter."
            htmlFor={`${idPrefix}-opportunity-naics`}
            label="NAICS"
          >
            <Input
              defaultValue={query.naicsCode ?? ""}
              id={`${idPrefix}-opportunity-naics`}
              name="naics"
              placeholder="541512"
            />
          </FormField>

          <FormField htmlFor={`${idPrefix}-opportunity-agency`} label="Agency">
            <Select
              defaultValue={query.agencyId ?? ""}
              id={`${idPrefix}-opportunity-agency`}
              name="agency"
            >
              <option value="">All agencies</option>
              {snapshot.filterOptions.agencies.map((agency) => (
                <option key={agency.value} value={agency.value}>
                  {agency.label} ({agency.count})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField htmlFor={`${idPrefix}-opportunity-stage`} label="Stage">
            <Select
              defaultValue={query.stageKey ?? ""}
              id={`${idPrefix}-opportunity-stage`}
              name="stage"
            >
              <option value="">All stages</option>
              {snapshot.filterOptions.stages.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label} ({stage.count})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField htmlFor={`${idPrefix}-opportunity-source`} label="Source">
            <Select
              defaultValue={query.sourceSystem ?? ""}
              id={`${idPrefix}-opportunity-source`}
              name="source"
            >
              <option value="">All sources</option>
              {snapshot.filterOptions.sources.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label} ({source.count})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField htmlFor={`${idPrefix}-opportunity-due`} label="Due window">
            <Select
              defaultValue={query.dueWindow}
              id={`${idPrefix}-opportunity-due`}
              name="due"
            >
              {snapshot.filterOptions.dueWindows.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField htmlFor={`${idPrefix}-opportunity-sort`} label="Sort">
            <Select
              defaultValue={query.sort}
              id={`${idPrefix}-opportunity-sort`}
              name="sort"
            >
              {snapshot.filterOptions.sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </FormField>

          <Stack spacing={1.5}>
            <Button type="submit">Apply filters</Button>
            <Button density="compact" href={resetHref} tone="neutral" variant="outlined">
              Reset to all opportunities
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

function OpportunityPreviewSurface({
  opportunity,
  previewHref,
  variant = "panel",
}: {
  opportunity: OpportunityListItemSummary;
  previewHref: string | null;
  variant?: "drawer" | "panel";
}) {
  const actions = (
    <>
      {previewHref ? (
        <Button density="compact" href={previewHref} tone="neutral" variant="soft">
          Open brief
        </Button>
      ) : null}
      <Button density="compact" href={`/opportunities/${opportunity.id}`}>
        Open workspace
      </Button>
      <Button
        density="compact"
        href={`/opportunities/${opportunity.id}/edit`}
        tone="neutral"
        variant="outlined"
      >
        Edit record
      </Button>
    </>
  );
  const description =
    opportunity.sourceSummaryText ??
    "Open the workspace for scoring, stage movement, tasks, and documents.";
  const metadata = buildPreviewMetadata(opportunity);
  const body = (
    <Stack spacing={1.25}>
      <Typography variant="h6">Capture brief</Typography>
      <DetailLine
        label="Recommendation"
        value={
          opportunity.bidDecision?.finalOutcome ??
          opportunity.score?.recommendationOutcome ??
          "Pending review"
        }
      />
      <DetailLine
        label="Vehicles"
        value={
          opportunity.vehicles.length > 0
            ? opportunity.vehicles.map((vehicle) => vehicle.code).join(", ")
            : "No vehicle recorded"
        }
      />
      <DetailLine
        label="Open work"
        value={`${opportunity.tasks.length} tasks and ${opportunity.milestones.length} milestones`}
      />
      {opportunity.sourceSummaryText ? (
        <Typography color="text.secondary" variant="body2">
          {truncateText(opportunity.sourceSummaryText, 180)}
        </Typography>
      ) : null}
    </Stack>
  );

  if (variant === "drawer") {
    return (
      <Box
        aria-label="Selected pursuit"
        component="aside"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          height: "100%",
          overflowY: "auto",
          px: { sm: 3, xs: 2.5 },
          py: 2.5,
        }}
      >
        <Stack spacing={1.5}>
          <Typography
            color="text.secondary"
            sx={{ letterSpacing: "0.2em" }}
            variant="overline"
          >
            Selected pursuit
          </Typography>
          <Stack spacing={1}>
            <Typography component="h2" variant="h2">
              {opportunity.title}
            </Typography>
            <Box color="text.secondary" sx={{ fontSize: "0.95rem", lineHeight: 1.75 }}>
              {description}
            </Box>
          </Stack>
        </Stack>

        {metadata.length > 0 ? (
          <Box>
            <Divider />
            <Box
              component="dl"
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))", xs: "1fr" },
                py: 2.25,
              }}
            >
              {metadata.map((item) => (
                <Box key={item.label}>
                  <Typography
                    color="text.secondary"
                    component="dt"
                    sx={{ letterSpacing: "0.18em" }}
                    variant="overline"
                  >
                    {item.label}
                  </Typography>
                  <Box
                    color="text.primary"
                    component="dd"
                    sx={{ mt: 0.75, fontSize: "0.95rem", lineHeight: 1.7, ml: 0 }}
                  >
                    {item.value}
                  </Box>
                </Box>
              ))}
            </Box>
            <Divider />
          </Box>
        ) : null}

        <Stack direction="row" sx={{ columnGap: 1.5, flexWrap: "wrap", rowGap: 1.5 }}>
          {actions}
        </Stack>

        {body}
      </Box>
    );
  }

  return (
    <PreviewPanel
      actions={actions}
      description={description}
      eyebrow="Selected pursuit"
      label="Selected pursuit"
      metadata={metadata}
      title={opportunity.title}
    >
      {body}
    </PreviewPanel>
  );
}

function OpportunityPreviewDrawer({
  onClose,
  open,
  opportunity,
  previewHref,
}: {
  onClose: () => void;
  open: boolean;
  opportunity: OpportunityListItemSummary | null;
  previewHref: string | null;
}) {
  return (
    <MuiDrawer
      anchor="right"
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          "aria-label": "Opportunity preview drawer",
        },
      }}
      sx={{
        "& .MuiDrawer-paper": {
          bgcolor: onesourceTokens.color.surface.default,
          borderLeft: `1px solid ${onesourceTokens.color.border.subtle}`,
          maxWidth: "100vw",
          width: { xs: "100vw", sm: 440, lg: 480 },
        },
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          borderBottom: `1px solid ${onesourceTokens.color.border.subtle}`,
          display: "flex",
          justifyContent: "space-between",
          px: { sm: 3, xs: 2.5 },
          py: 1.5,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: onesourceTokens.color.text.muted,
              fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
              fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Pursuit preview
          </Typography>
          <Typography sx={{ mt: 0.5 }} variant="h6">
            Review without leaving the queue
          </Typography>
        </Box>
        <IconButton
          aria-label="Close opportunity preview"
          onClick={onClose}
          sx={{ color: "text.primary" }}
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Box>

      {opportunity ? (
        <OpportunityPreviewSurface
          opportunity={opportunity}
          previewHref={previewHref}
          variant="drawer"
        />
      ) : null}
    </MuiDrawer>
  );
}

function MobileOpportunityCard({
  href,
  isSelected,
  opportunity,
}: {
  href: string;
  isSelected: boolean;
  opportunity: OpportunityListItemSummary;
}) {
  const decisionLabel =
    opportunity.bidDecision?.finalOutcome ??
    opportunity.score?.recommendationOutcome ??
    "Pending";

  return (
    <Surface
      component="article"
      sx={{
        borderColor: isSelected
          ? onesourceTokens.color.accent.main
          : onesourceTokens.color.border.subtle,
        p: 2.5,
      }}
      tone={isSelected ? "warm" : "default"}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Badge tone="muted">{opportunity.currentStageLabel}</Badge>
          <Badge tone={getDueBadgeTone(opportunity.responseDeadlineAt)}>
            {getDueLabel(opportunity.responseDeadlineAt)}
          </Badge>
          <Badge tone="warning">{opportunity.sourceDisplayLabel}</Badge>
        </Stack>

        <Box>
          <Typography variant="h6">{opportunity.title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
            {opportunity.leadAgency?.name ?? "No lead agency assigned"}
            {opportunity.solicitationNumber ? ` · ${opportunity.solicitationNumber}` : ""}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {opportunity.naicsCode ? (
            <Badge tone="muted">NAICS {opportunity.naicsCode}</Badge>
          ) : null}
          <Badge tone="accent">{decisionLabel}</Badge>
          {opportunity.score?.totalScore ? (
            <Badge tone="muted">{opportunity.score.totalScore}/100</Badge>
          ) : null}
        </Stack>

        {opportunity.sourceSummaryText ? (
          <Typography color="text.secondary" variant="body2">
            {truncateText(opportunity.sourceSummaryText, 180)}
          </Typography>
        ) : null}

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Button density="compact" href={href} tone="neutral" variant="soft">
            Preview
          </Button>
          <Button density="compact" href={`/opportunities/${opportunity.id}`} variant="text">
            Open workspace
          </Button>
          <Button
            density="compact"
            href={`/opportunities/${opportunity.id}/edit`}
            tone="neutral"
            variant="text"
          >
            Edit
          </Button>
        </Stack>
      </Stack>
    </Surface>
  );
}

function InlineStat({
  label,
  supportingText,
  value,
}: {
  label: string;
  supportingText: string;
  value: string;
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        px: { sm: 1.25, xs: 0 },
        py: 0.5,
      }}
    >
      <Typography
        sx={{
          color: onesourceTokens.color.text.muted,
          fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
          fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ mt: 0.75 }} variant="h6">
        {value}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.25 }} variant="body2">
        {supportingText}
      </Typography>
    </Box>
  );
}

function DensityToggleInline({
  options,
}: {
  options: Array<{
    active: boolean;
    href: string;
    label: string;
  }>;
}) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
      <Typography
        sx={{
          color: onesourceTokens.color.text.muted,
          fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
          fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        Density
      </Typography>
      <Stack direction="row" spacing={1}>
        {options.map((option) => (
          <Button
            aria-current={option.active ? "page" : undefined}
            density="compact"
            href={option.href}
            key={option.label}
            tone={option.active ? "primary" : "neutral"}
            variant={option.active ? "soft" : "outlined"}
          >
            {option.label}
          </Button>
        ))}
      </Stack>
    </Stack>
  );
}

function PaginationLink({
  active = false,
  children,
  disabled = false,
  href,
}: {
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  href: string;
}) {
  if (disabled) {
    return (
      <Surface
        component="span"
        density="compact"
        sx={{
          alignItems: "center",
          color: "text.secondary",
          display: "inline-flex",
          minWidth: 44,
          px: 1.5,
          py: 0.75,
        }}
        tone="muted"
      >
        {children}
      </Surface>
    );
  }

  return (
    <Button
      density="compact"
      href={href}
      sx={{ minWidth: 44 }}
      tone={active ? "primary" : "neutral"}
      variant={active ? "solid" : "outlined"}
    >
      {children}
    </Button>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography
        sx={{
          color: onesourceTokens.color.text.muted,
          fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
          fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ mt: 0.5 }} variant="body2">
        {value}
      </Typography>
    </Box>
  );
}

function buildActiveFilterChips(
  query: OpportunityListQuery,
  viewState: OpportunityListViewState,
) {
  const chips: ActiveFilterChip[] = [];

  if (query.savedViewKey && query.savedViewKey !== "all") {
    chips.push({
      href: buildOpportunityListHref(query, viewState, {
        agencyId: null,
        dueWindow: "all",
        naicsCode: null,
        page: 1,
        previewOpportunityId: null,
        query: null,
        savedViewKey: null,
        sort: "updated_desc",
        sourceSystem: null,
        stageKey: null,
      }),
      label: `Queue · ${getSavedViewLabel(query.savedViewKey)}`,
    });
  }

  if (query.query) {
    chips.push({
      href: buildOpportunityListHref(query, viewState, {
        page: 1,
        previewOpportunityId: null,
        query: null,
      }),
      label: `Search · ${query.query}`,
    });
  }

  if (query.naicsCode) {
    chips.push({
      href: buildOpportunityListHref(query, viewState, {
        naicsCode: null,
        page: 1,
        previewOpportunityId: null,
      }),
      label: `NAICS · ${query.naicsCode}`,
    });
  }

  if (query.agencyId) {
    chips.push({
      href: buildOpportunityListHref(query, viewState, {
        agencyId: null,
        page: 1,
        previewOpportunityId: null,
      }),
      label: "Agency filter",
    });
  }

  if (query.stageKey) {
    chips.push({
      href: buildOpportunityListHref(query, viewState, {
        page: 1,
        previewOpportunityId: null,
        stageKey: null,
      }),
      label: `Stage · ${humanizeQueryValue(query.stageKey)}`,
    });
  }

  if (query.sourceSystem) {
    chips.push({
      href: buildOpportunityListHref(query, viewState, {
        page: 1,
        previewOpportunityId: null,
        sourceSystem: null,
      }),
      label: `Source · ${humanizeQueryValue(query.sourceSystem)}`,
    });
  }

  if (query.dueWindow !== "all") {
    chips.push({
      href: buildOpportunityListHref(query, viewState, {
        dueWindow: "all",
        page: 1,
        previewOpportunityId: null,
      }),
      label: `Due · ${humanizeDueWindow(query.dueWindow)}`,
    });
  }

  if (query.sort !== "updated_desc") {
    chips.push({
      href: buildOpportunityListHref(query, viewState, {
        page: 1,
        previewOpportunityId: null,
        sort: "updated_desc",
      }),
      label: `Sort · ${humanizeQueryValue(query.sort)}`,
    });
  }

  return chips;
}

function buildOpportunityListHref(
  query: OpportunityListQuery,
  viewState: OpportunityListViewState,
  overrides: Partial<OpportunityListQuery> & {
    density?: OpportunityListViewState["density"];
    previewOpportunityId?: string | null;
  },
) {
  const nextQuery = {
    ...query,
    ...overrides,
  };
  const nextDensity = overrides.density ?? viewState.density;
  const nextPreviewOpportunityId =
    "previewOpportunityId" in overrides
      ? (overrides.previewOpportunityId ?? null)
      : viewState.previewOpportunityId;
  const params = new URLSearchParams();

  if (nextQuery.savedViewKey && nextQuery.savedViewKey !== "all") {
    params.set("view", nextQuery.savedViewKey);
  }

  if (nextQuery.query) {
    params.set("q", nextQuery.query);
  }

  if (nextQuery.naicsCode) {
    params.set("naics", nextQuery.naicsCode);
  }

  if (nextQuery.agencyId) {
    params.set("agency", nextQuery.agencyId);
  }

  if (nextQuery.stageKey) {
    params.set("stage", nextQuery.stageKey);
  }

  if (nextQuery.sourceSystem) {
    params.set("source", nextQuery.sourceSystem);
  }

  if (nextQuery.dueWindow !== "all") {
    params.set("due", nextQuery.dueWindow);
  }

  if (nextQuery.sort !== "updated_desc") {
    params.set("sort", nextQuery.sort);
  }

  if (nextQuery.page > 1) {
    params.set("page", String(nextQuery.page));
  }

  if (nextDensity !== "compact") {
    params.set("density", nextDensity);
  }

  if (nextPreviewOpportunityId) {
    params.set("preview", nextPreviewOpportunityId);
  }

  const queryString = params.toString();
  return queryString.length > 0 ? `/opportunities?${queryString}` : "/opportunities";
}

function buildSavedViewItems(
  snapshot: OpportunityListSnapshot,
  viewState: OpportunityListViewState,
) {
  const activeSavedViewKey = resolveActiveSavedViewKey(snapshot.query);

  return snapshot.savedViews.map(
    (savedView): SavedViewControlItem => ({
      active: savedView.key === activeSavedViewKey,
      href: buildOpportunityListHref(snapshot.query, viewState, {
        ...buildPresetQuery(snapshot.query, savedView.key),
        previewOpportunityId: null,
      }),
      label: savedView.label,
      supportingText: `${savedView.count} · ${savedView.supportingText}`,
    }),
  );
}

function buildDensityOptions(
  query: OpportunityListQuery,
  viewState: OpportunityListViewState,
) {
  return [
    {
      active: viewState.density === "compact",
      href: buildOpportunityListHref(query, viewState, {
        density: "compact",
      }),
      label: "Compact",
    },
    {
      active: viewState.density === "comfortable",
      href: buildOpportunityListHref(query, viewState, {
        density: "comfortable",
      }),
      label: "Comfortable",
    },
  ];
}

function buildSortOptions(
  query: OpportunityListQuery,
  viewState: OpportunityListViewState,
) {
  return [
    {
      active: query.sort === "updated_desc",
      href: buildOpportunityListHref(query, viewState, {
        page: 1,
        previewOpportunityId: null,
        sort: "updated_desc",
      }),
      label: "Recently updated",
    },
    {
      active: query.sort === "deadline_asc",
      href: buildOpportunityListHref(query, viewState, {
        page: 1,
        previewOpportunityId: null,
        sort: "deadline_asc",
      }),
      label: "Soonest deadline",
    },
    {
      active: query.sort === "stage_asc",
      href: buildOpportunityListHref(query, viewState, {
        page: 1,
        previewOpportunityId: null,
        sort: "stage_asc",
      }),
      label: "Stage",
    },
  ];
}

function buildPreviewMetadata(
  opportunity: OpportunityListItemSummary,
): PreviewPanelMetadataItem[] {
  return [
    {
      label: "Stage",
      value: opportunity.currentStageLabel,
    },
    {
      label: "Deadline",
      value: opportunity.responseDeadlineAt
        ? formatShortDate(opportunity.responseDeadlineAt)
        : "Not set",
    },
    {
      label: "Source",
      value: opportunity.sourceDisplayLabel,
    },
    {
      label: "Lead agency",
      value: opportunity.leadAgency?.name ?? "No agency assigned",
    },
  ];
}

function buildPresetQuery(
  query: OpportunityListQuery,
  savedViewKey: OpportunityListSavedViewKey,
): OpportunityListQuery {
  const baseQuery: OpportunityListQuery = {
    savedViewKey,
    agencyId: null,
    dueWindow: "all",
    naicsCode: null,
    page: 1,
    pageSize: query.pageSize,
    query: null,
    sort: "updated_desc",
    sourceSystem: null,
    stageKey: null,
  };

  switch (savedViewKey) {
    case "due_soon":
      return {
        ...baseQuery,
        dueWindow: "next_30_days",
        sort: "deadline_asc",
      };
    case "qualified":
      return {
        ...baseQuery,
        stageKey: "qualified",
      };
    case "proposal_sprint":
      return {
        ...baseQuery,
        stageKey: "proposal_in_development",
        sort: "deadline_asc",
      };
    case "all":
    default:
      return baseQuery;
  }
}

function resolveActiveSavedView(snapshot: OpportunityListSnapshot) {
  const activeSavedViewKey = resolveActiveSavedViewKey(snapshot.query);

  return (
    snapshot.savedViews.find((savedView) => savedView.key === activeSavedViewKey) ??
    null
  );
}

function resolveActiveSavedViewKey(query: OpportunityListQuery) {
  if (query.savedViewKey) {
    return query.savedViewKey;
  }

  const candidateKeys: OpportunityListSavedViewKey[] = [
    "all",
    "due_soon",
    "qualified",
    "proposal_sprint",
  ];

  return (
    candidateKeys.find((savedViewKey) => queryMatchesPreset(query, savedViewKey)) ??
    null
  );
}

function queryMatchesPreset(
  query: OpportunityListQuery,
  savedViewKey: OpportunityListSavedViewKey,
) {
  const presetQuery = buildPresetQuery(query, savedViewKey);

  return (
    query.query === presetQuery.query &&
    query.agencyId === presetQuery.agencyId &&
    query.naicsCode === presetQuery.naicsCode &&
    query.stageKey === presetQuery.stageKey &&
    query.sourceSystem === presetQuery.sourceSystem &&
    query.dueWindow === presetQuery.dueWindow &&
    query.sort === presetQuery.sort
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getDueBadgeTone(responseDeadlineAt: string | null) {
  if (!responseDeadlineAt) {
    return "muted" as const;
  }

  return new Date(responseDeadlineAt) < new Date() ? "danger" : "accent";
}

function getDueLabel(responseDeadlineAt: string | null) {
  if (!responseDeadlineAt) {
    return "No deadline";
  }

  return new Date(responseDeadlineAt) < new Date() ? "Past due" : "Scheduled";
}

function humanizeDueWindow(value: OpportunityListQuery["dueWindow"]) {
  switch (value) {
    case "next_30_days":
      return "Next 30 days";
    case "next_60_days":
      return "Next 60 days";
    case "no_deadline":
      return "No deadline";
    case "overdue":
      return "Overdue";
    case "all":
    default:
      return "All deadlines";
  }
}

function humanizeQueryValue(value: string) {
  return value
    .split(/[_-]+/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getSavedViewLabel(value: OpportunityListSavedViewKey) {
  switch (value) {
    case "due_soon":
      return "Due soon";
    case "qualified":
      return "Qualified review";
    case "proposal_sprint":
      return "Proposal sprint";
    case "all":
    default:
      return "All pursuits";
  }
}

function truncateText(value: string, length: number) {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length - 1).trimEnd()}…`;
}

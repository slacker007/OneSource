import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  CanonicalSourceSearchQuery,
  SourceSearchSnapshot,
} from "@/modules/source-integrations/source-search.service";

type SourceSearchProps = {
  snapshot: SourceSearchSnapshot | null;
};

export function SourceSearch({ snapshot }: SourceSearchProps) {
  if (!snapshot) {
    return (
      <section className="space-y-4">
        <p className="text-muted text-sm tracking-[0.26em] uppercase">Sources</p>
        <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
          External source search
        </h1>
        <ErrorState
          message="The source-search page could not load connector metadata for the authenticated workspace. Re-seed the database or verify the default organization still exists."
          title="Source connector data is unavailable"
        />
      </section>
    );
  }

  const searchableConnectors = snapshot.connectors.filter(
    (connector) => connector.supportsSearch,
  );
  const emptyState = buildResultEmptyState(snapshot);

  return (
    <section className="space-y-6">
      <header className="border-border bg-surface rounded-[28px] border px-6 py-6 shadow-[0_16px_40px_rgba(20,37,34,0.08)] sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>External search</Badge>
              <Badge tone="muted">Connector-ready DTOs</Badge>
              <Badge tone="warning">Mocked `sam.gov` responses</Badge>
            </div>
            <h1 className="font-heading text-foreground text-4xl font-semibold tracking-[-0.04em]">
              External source search
            </h1>
            <p className="text-muted max-w-3xl text-sm leading-7">
              Search configured opportunity sources with a typed canonical query,
              then translate that query into the explicit `sam.gov` request
              shape. This slice keeps execution mocked so the UI, validation,
              and connector boundaries are real before the live adapter lands.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Connector"
              value={snapshot.activeConnector?.sourceDisplayName ?? "Unknown"}
              supportingText={
                snapshot.activeConnector?.connectorVersion ??
                "Version not available"
              }
            />
            <SummaryCard
              label="Execution"
              value={formatExecutionMode(snapshot.executionMode)}
              supportingText={snapshot.resultCountLabel}
            />
            <SummaryCard
              label="Workspace"
              value={snapshot.organization.name}
              supportingText={`${searchableConnectors.length} searchable connectors configured`}
            />
          </div>
        </div>
      </header>

      {(snapshot.validationErrors.length > 0 ||
        snapshot.executionMode === "unsupported_connector") && (
        <ErrorState
          action={
            snapshot.validationErrors.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-[rgb(133,69,49)]">
                {snapshot.validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : undefined
          }
          message={snapshot.executionMessage}
          title={
            snapshot.executionMode === "unsupported_connector"
              ? "Selected connector is not executable yet"
              : "Search query needs correction"
          }
        />
      )}

      <section className="border-border bg-surface rounded-[32px] border px-6 py-6 shadow-[0_20px_60px_rgba(20,37,34,0.08)] sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <p className="text-muted text-xs tracking-[0.24em] uppercase">
              Search filters
            </p>
            <h2 className="font-heading text-foreground text-2xl font-semibold tracking-[-0.03em]">
              `sam.gov` keyword and structured filters
            </h2>
            <p className="text-muted max-w-3xl text-sm leading-6">
              This surface now supports the explicit Phase 4 filter set: posted
              dates, response deadlines, notice ID, solicitation number,
              procurement types, organization metadata, NAICS, classification
              code, set-aside, place of performance, status, page size, and
              offset.
            </p>
          </div>

          <Link
            className="text-sm font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
            href="/sources"
          >
            Reset search
          </Link>
        </div>

        <form action="/sources" className="mt-6 space-y-6">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <FormField
              hint="The route already knows about other configured connectors, but only mocked sam.gov execution is wired in this slice."
              htmlFor="source-connector"
              label="Source connector"
            >
              <Select
                defaultValue={snapshot.formValues.source}
                id="source-connector"
                name="source"
              >
                {searchableConnectors.map((connector) => (
                  <option
                    disabled={!connector.isEnabled}
                    key={connector.id}
                    value={connector.sourceSystemKey}
                  >
                    {connector.sourceDisplayName}
                    {connector.sourceSystemKey === "sam_gov"
                      ? " (mocked execution)"
                      : " (coming later)"}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              hint="Matches the outbound `title` parameter for sam.gov."
              htmlFor="source-keywords"
              label="Keywords"
            >
              <Input
                defaultValue={snapshot.formValues.keywords}
                id="source-keywords"
                name="keywords"
                placeholder="cloud operations"
                type="search"
              />
            </FormField>

            <FormField
              hint="Required by the current sam.gov search contract."
              htmlFor="source-posted-from"
              label="Posted from"
            >
              <Input
                defaultValue={snapshot.formValues.postedFrom}
                id="source-posted-from"
                name="postedFrom"
                type="date"
              />
            </FormField>

            <FormField
              hint="Required by the current sam.gov search contract."
              htmlFor="source-posted-to"
              label="Posted to"
            >
              <Input
                defaultValue={snapshot.formValues.postedTo}
                id="source-posted-to"
                name="postedTo"
                type="date"
              />
            </FormField>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <FormField htmlFor="source-notice-id" label="Notice ID">
              <Input
                defaultValue={snapshot.formValues.noticeid}
                id="source-notice-id"
                name="noticeid"
                placeholder="FA4861-26-R-0001"
              />
            </FormField>

            <FormField htmlFor="source-solicitation" label="Solicitation number">
              <Input
                defaultValue={snapshot.formValues.solnum}
                id="source-solicitation"
                name="solnum"
                placeholder="36C10B26Q0142"
              />
            </FormField>

            <FormField htmlFor="source-org-name" label="Organization name">
              <Input
                defaultValue={snapshot.formValues.organizationName}
                id="source-org-name"
                name="organizationName"
                placeholder="Department of Veterans Affairs"
              />
            </FormField>

            <FormField htmlFor="source-org-code" label="Organization code">
              <Input
                defaultValue={snapshot.formValues.organizationCode}
                id="source-org-code"
                name="organizationCode"
                placeholder="36C10B"
              />
            </FormField>

            <FormField htmlFor="source-state" label="Place of performance state">
              <Input
                defaultValue={snapshot.formValues.state}
                id="source-state"
                maxLength={2}
                name="state"
                placeholder="VA"
              />
            </FormField>

            <FormField htmlFor="source-zip" label="Place of performance ZIP">
              <Input
                defaultValue={snapshot.formValues.zip}
                id="source-zip"
                name="zip"
                placeholder="22350"
              />
            </FormField>

            <FormField htmlFor="source-naics" label="NAICS code">
              <Input
                defaultValue={snapshot.formValues.ncode}
                id="source-naics"
                name="ncode"
                placeholder="541512"
              />
            </FormField>

            <FormField htmlFor="source-ccode" label="Classification code">
              <Input
                defaultValue={snapshot.formValues.ccode}
                id="source-ccode"
                name="ccode"
                placeholder="D302"
              />
            </FormField>

            <FormField htmlFor="source-set-aside" label="Set-aside code">
              <Input
                defaultValue={snapshot.formValues.typeOfSetAside}
                id="source-set-aside"
                name="typeOfSetAside"
                placeholder="SDVOSB"
              />
            </FormField>

            <FormField
              htmlFor="source-set-aside-description"
              label="Set-aside description"
            >
              <Input
                defaultValue={snapshot.formValues.typeOfSetAsideDescription}
                id="source-set-aside-description"
                name="typeOfSetAsideDescription"
                placeholder="Small business"
              />
            </FormField>

            <FormField htmlFor="source-rdlfrom" label="Response deadline from">
              <Input
                defaultValue={snapshot.formValues.rdlfrom}
                id="source-rdlfrom"
                name="rdlfrom"
                type="date"
              />
            </FormField>

            <FormField htmlFor="source-rdlto" label="Response deadline to">
              <Input
                defaultValue={snapshot.formValues.rdlto}
                id="source-rdlto"
                name="rdlto"
                type="date"
              />
            </FormField>

            <FormField htmlFor="source-status" label="Status">
              <Select
                defaultValue={snapshot.formValues.status}
                id="source-status"
                name="status"
              >
                {snapshot.activeCapability.statusOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField htmlFor="source-limit" label="Page size">
              <Select
                defaultValue={snapshot.formValues.limit}
                id="source-limit"
                name="limit"
              >
                {snapshot.activeCapability.pageSizeOptions.map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
                <option value="250">250</option>
                <option value="500">500</option>
                <option value="1000">1000</option>
              </Select>
            </FormField>

            <FormField
              hint="Maps directly to the sam.gov `offset` parameter."
              htmlFor="source-offset"
              label="Offset"
            >
              <Input
                defaultValue={snapshot.formValues.offset}
                id="source-offset"
                min={0}
                name="offset"
                step={1}
                type="number"
              />
            </FormField>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-foreground text-sm font-medium">
              Procurement types
            </legend>
            <p className="text-muted text-xs leading-5">
              `ptype[]` is modeled as a real multi-select instead of a single
              value so the form already matches the upstream contract.
            </p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {snapshot.activeCapability.procurementTypes.map((option) => (
                <label
                  className="border-border flex gap-3 rounded-[20px] border bg-white px-4 py-3 text-sm shadow-[0_12px_24px_rgba(20,37,34,0.05)]"
                  htmlFor={`ptype-${option.value}`}
                  key={option.value}
                >
                  <input
                    defaultChecked={snapshot.formValues.ptype.includes(option.value)}
                    id={`ptype-${option.value}`}
                    name="ptype"
                    type="checkbox"
                    value={option.value}
                  />
                  <span className="space-y-1">
                    <span className="block font-medium">{option.label}</span>
                    <span className="text-muted block text-xs leading-5">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[rgb(19,78,68)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_30px_rgba(19,78,68,0.22)] transition hover:bg-[rgb(16,66,57)]"
              type="submit"
            >
              Search external opportunities
            </button>
            <Link
              className="border-border text-muted inline-flex min-h-12 items-center justify-center rounded-full border bg-white px-5 py-3 text-sm font-medium"
              href="/sources"
            >
              Clear all filters
            </Link>
          </div>
        </form>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-muted text-xs tracking-[0.24em] uppercase">
                Results
              </p>
              <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
                {snapshot.resultCountLabel}
              </h2>
            </div>

            {snapshot.query ? (
              <div className="flex flex-wrap gap-2">
                {buildActiveFilterBadges(snapshot.query).map((badge) => (
                  <Badge key={badge}>{badge}</Badge>
                ))}
              </div>
            ) : null}
          </div>

          <DataTable
            ariaLabel="External source search results"
            columns={[
              {
                key: "notice",
                header: "Notice",
                className: "min-w-[12rem]",
                cell: (result) => (
                  <div>
                    <p className="font-medium">{result.noticeId}</p>
                    <p className="text-muted text-xs">
                      {result.solicitationNumber ?? "No solicitation number"}
                    </p>
                  </div>
                ),
              },
              {
                key: "opportunity",
                header: "Opportunity",
                className: "min-w-[22rem]",
                cell: (result) => (
                  <div className="space-y-2">
                    <a
                      className="font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
                      href={result.uiLink}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {result.title}
                    </a>
                    <p className="text-muted text-xs">{result.organizationName}</p>
                    <p className="text-sm leading-6 text-foreground">
                      {result.summary}
                    </p>
                  </div>
                ),
              },
              {
                key: "dates",
                header: "Dates",
                className: "min-w-[10rem]",
                cell: (result) => (
                  <div className="space-y-2">
                    <p className="font-medium">
                      Posted {formatShortDate(result.postedDate)}
                    </p>
                    <p className="text-muted text-xs">
                      {result.responseDeadline
                        ? `Due ${formatShortDate(result.responseDeadline)}`
                        : "No deadline returned"}
                    </p>
                  </div>
                ),
              },
              {
                key: "classification",
                header: "Type",
                className: "min-w-[10rem]",
                cell: (result) => (
                  <div className="space-y-2">
                    <Badge tone="muted">{result.procurementTypeLabel}</Badge>
                    <p className="text-muted text-xs uppercase">
                      {result.status}
                    </p>
                  </div>
                ),
              },
              {
                key: "location",
                header: "Location",
                className: "min-w-[10rem]",
                cell: (result) => (
                  <div className="space-y-2">
                    <p className="font-medium">
                      {result.placeOfPerformanceState ?? "No state"}
                    </p>
                    <p className="text-muted text-xs">
                      {result.placeOfPerformanceZip ?? "No ZIP"}
                    </p>
                  </div>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                className: "min-w-[12rem]",
                cell: () => (
                  <button
                    className="border-border text-muted inline-flex min-h-11 w-full items-center justify-center rounded-full border bg-[rgba(15,28,31,0.03)] px-4 py-2 text-sm font-medium"
                    disabled
                    type="button"
                  >
                    Preview in P4-01b
                  </button>
                ),
              },
            ]}
            emptyState={emptyState}
            getRowKey={(result) => result.id}
            rows={snapshot.results}
          />
        </section>

        <section className="space-y-4">
          <div className="border-border rounded-[28px] border bg-white p-5 shadow-[0_14px_40px_rgba(19,36,34,0.06)]">
            <p className="text-muted text-xs tracking-[0.22em] uppercase">
              Execution summary
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{formatExecutionMode(snapshot.executionMode)}</Badge>
              <Badge tone="muted">
                {snapshot.activeConnector?.sourceDisplayName ?? "Connector unknown"}
              </Badge>
              <Badge tone="warning">
                {snapshot.executedAt
                  ? `Ran ${formatDateTime(snapshot.executedAt)}`
                  : "Not executed"}
              </Badge>
            </div>
            <p className="text-muted mt-4 text-sm leading-6">
              {snapshot.executionMessage}
            </p>
          </div>

          <div className="border-border rounded-[28px] border bg-white p-5 shadow-[0_14px_40px_rgba(19,36,34,0.06)]">
            <p className="text-muted text-xs tracking-[0.22em] uppercase">
              Connector capability
            </p>
            <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Search contract ready for live adapter work
            </h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-foreground">
              {snapshot.activeCapability.supportedFilterLabels.map((label) => (
                <li key={label}>• {label}</li>
              ))}
            </ul>
          </div>

          <div className="border-border rounded-[28px] border bg-white p-5 shadow-[0_14px_40px_rgba(19,36,34,0.06)]">
            <p className="text-muted text-xs tracking-[0.22em] uppercase">
              Outbound request
            </p>
            <h2 className="font-heading text-foreground mt-2 text-2xl font-semibold tracking-[-0.03em]">
              Translated `sam.gov` query
            </h2>
            {snapshot.outboundRequest ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-muted text-xs tracking-[0.18em] uppercase">
                    Endpoint
                  </dt>
                  <dd className="mt-1 break-all text-foreground">
                    {snapshot.outboundRequest.endpoint}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted text-xs tracking-[0.18em] uppercase">
                    Query params
                  </dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(snapshot.outboundRequest.queryParams).map(
                      ([key, value]) => (
                        <Badge key={key} tone="muted">
                          {Array.isArray(value)
                            ? `${key}: ${value.join(", ")}`
                            : `${key}: ${value}`}
                        </Badge>
                      ),
                    )}
                  </dd>
                </div>
              </dl>
            ) : (
              <EmptyState
                className="mt-4"
                message="A translated outbound request will appear here once the query validates and an executable connector is selected."
                title="No request generated"
              />
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function buildResultEmptyState(snapshot: SourceSearchSnapshot) {
  if (snapshot.executionMode === "invalid_query") {
    return (
      <EmptyState
        message="Correct the highlighted query issues above, then rerun the search."
        title="Search did not execute"
      />
    );
  }

  if (snapshot.executionMode === "unsupported_connector") {
    return (
      <EmptyState
        message="Leave the connector set to SAM.gov for now, or wait for a later slice to add another executable adapter."
        title="Connector execution is pending"
      />
    );
  }

  return (
    <EmptyState
      action={
        <Link
          className="text-sm font-medium text-[rgb(19,78,68)] underline-offset-4 hover:underline"
          href="/sources"
        >
          Reset to the default mock query
        </Link>
      }
      message="No mocked source records matched this filter set. Adjust the posted dates, remove a structured filter, or switch back to the default query."
      title="No external opportunities matched"
    />
  );
}

function buildActiveFilterBadges(query: CanonicalSourceSearchQuery) {
  const badges: string[] = [`posted: ${query.postedDateFrom} to ${query.postedDateTo}`];

  if (query.keywords) {
    badges.push(`keywords: ${query.keywords}`);
  }

  if (query.procurementTypes.length > 0) {
    badges.push(`ptype: ${query.procurementTypes.join(", ")}`);
  }

  if (query.organizationName) {
    badges.push(`org: ${query.organizationName}`);
  }

  if (query.placeOfPerformanceState) {
    badges.push(`state: ${query.placeOfPerformanceState}`);
  }

  if (query.status) {
    badges.push(`status: ${query.status}`);
  }

  if (query.noticeId) {
    badges.push(`notice: ${query.noticeId}`);
  }

  return badges;
}

function formatExecutionMode(
  mode: SourceSearchSnapshot["executionMode"],
) {
  switch (mode) {
    case "mocked_sam_gov":
      return "Mocked search";
    case "unsupported_connector":
      return "Connector pending";
    case "invalid_query":
      return "Validation blocked";
    default:
      return "Unknown";
  }
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
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
    <div className="rounded-[24px] border border-[rgba(15,28,31,0.08)] bg-white px-4 py-4 text-sm shadow-[0_12px_30px_rgba(20,37,34,0.06)]">
      <p className="text-muted text-xs tracking-[0.2em] uppercase">{label}</p>
      <p className="text-foreground mt-2 font-semibold">{value}</p>
      <p className="text-muted mt-1 leading-6">{supportingText}</p>
    </div>
  );
}

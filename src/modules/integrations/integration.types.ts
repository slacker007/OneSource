export type IntegrationDomain =
  | "crm"
  | "document_repository"
  | "communication";

export type IntegrationDirection = "outbound" | "inbound" | "bidirectional";

export type IntegrationDispatchStatus =
  | "dry_run"
  | "queued"
  | "success"
  | "skipped";

export type IntegrationOperationSummary = {
  key: string;
  label: string;
  description: string;
};

export type IntegrationAdapterDescriptor<TDomain extends IntegrationDomain> = {
  key: string;
  domain: TDomain;
  displayName: string;
  provider: string;
  direction: IntegrationDirection;
  summary: string;
  operations: IntegrationOperationSummary[];
};

export type IntegrationDispatchResult<TDomain extends IntegrationDomain> = {
  adapterKey: string;
  domain: TDomain;
  status: IntegrationDispatchStatus;
  summary: string;
  externalReference: string | null;
  payloadPreview: Record<string, unknown>;
};

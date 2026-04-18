import type {
  OpportunityFormAgencyOption,
  OpportunityFormSnapshot,
} from "./opportunity.types";
import {
  buildOpportunityDraftStorageKey,
  EMPTY_OPPORTUNITY_FORM_VALUES,
  formatOpportunityDateInputValue,
} from "./opportunity-form.schema";

type OpportunityFormOrganizationRecord = {
  id: string;
  name: string;
  slug: string;
  agencies: Array<{
    id: string;
    name: string;
    organizationCode: string | null;
  }>;
};

type OpportunityFormOpportunityRecord = {
  id: string;
  title: string;
  description: string | null;
  leadAgencyId: string | null;
  responseDeadlineAt: Date | null;
  solicitationNumber: string | null;
  naicsCode: string | null;
  currentStageKey: string | null;
  currentStageLabel: string | null;
  originSourceSystem: string | null;
  updatedAt: Date;
};

const organizationFormArgs = {
  select: {
    id: true,
    name: true,
    slug: true,
    agencies: {
      orderBy: [{ name: "asc" }, { organizationCode: "asc" }],
      select: {
        id: true,
        name: true,
        organizationCode: true,
      },
    },
  },
} as const;

const editableOpportunityArgs = {
  select: {
    id: true,
    title: true,
    description: true,
    leadAgencyId: true,
    responseDeadlineAt: true,
    solicitationNumber: true,
    naicsCode: true,
    currentStageKey: true,
    currentStageLabel: true,
    originSourceSystem: true,
    updatedAt: true,
  },
} as const;

export type OpportunityFormRepositoryClient = {
  organization: {
    findUnique(args: {
      where: {
        id: string;
      };
    } & typeof organizationFormArgs): Promise<OpportunityFormOrganizationRecord | null>;
  };
  opportunity: {
    findFirst(args: {
      where: {
        id: string;
        organizationId: string;
      };
    } & typeof editableOpportunityArgs): Promise<OpportunityFormOpportunityRecord | null>;
  };
};

export async function getCreateOpportunityFormSnapshot({
  db,
  organizationId,
}: {
  db: OpportunityFormRepositoryClient;
  organizationId: string;
}): Promise<OpportunityFormSnapshot | null> {
  const organization = await loadOpportunityFormOrganization({
    db,
    organizationId,
  });

  if (!organization) {
    return null;
  }

  return {
    agencyOptions: buildAgencyOptions(organization.agencies),
    currentStageKey: "identified",
    currentStageLabel: "Identified",
    draftStorageKey: buildOpportunityDraftStorageKey({
      mode: "create",
    }),
    initialValues: EMPTY_OPPORTUNITY_FORM_VALUES,
    mode: "create",
    opportunityId: null,
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    },
    originSourceSystem: null,
    updatedAt: null,
  };
}

export async function getEditOpportunityFormSnapshot({
  db,
  opportunityId,
  organizationId,
}: {
  db: OpportunityFormRepositoryClient;
  opportunityId: string;
  organizationId: string;
}): Promise<OpportunityFormSnapshot | null> {
  const [organization, opportunity] = await Promise.all([
    loadOpportunityFormOrganization({
      db,
      organizationId,
    }),
    db.opportunity.findFirst({
      where: {
        id: opportunityId,
        organizationId,
      },
      ...editableOpportunityArgs,
    }),
  ]);

  if (!organization || !opportunity) {
    return null;
  }

  return {
    agencyOptions: buildAgencyOptions(organization.agencies),
    currentStageKey: opportunity.currentStageKey ?? "identified",
    currentStageLabel:
      opportunity.currentStageLabel ??
      humanizeStageKey(opportunity.currentStageKey) ??
      "Identified",
    draftStorageKey: buildOpportunityDraftStorageKey({
      mode: "edit",
      opportunityId: opportunity.id,
    }),
    initialValues: {
      title: opportunity.title,
      description: opportunity.description ?? "",
      leadAgencyId: opportunity.leadAgencyId ?? "",
      responseDeadlineAt: formatOpportunityDateInputValue(
        opportunity.responseDeadlineAt,
      ),
      solicitationNumber: opportunity.solicitationNumber ?? "",
      naicsCode: opportunity.naicsCode ?? "",
    },
    mode: "edit",
    opportunityId: opportunity.id,
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    },
    originSourceSystem: opportunity.originSourceSystem,
    updatedAt: opportunity.updatedAt.toISOString(),
  };
}

async function loadOpportunityFormOrganization({
  db,
  organizationId,
}: {
  db: OpportunityFormRepositoryClient;
  organizationId: string;
}) {
  return db.organization.findUnique({
    where: {
      id: organizationId,
    },
    ...organizationFormArgs,
  });
}

function buildAgencyOptions(
  agencies: OpportunityFormOrganizationRecord["agencies"],
): OpportunityFormAgencyOption[] {
  return agencies.map((agency) => ({
    value: agency.id,
    label:
      agency.organizationCode != null
        ? `${agency.name} (${agency.organizationCode})`
        : agency.name,
  }));
}

function humanizeStageKey(stageKey: string | null) {
  if (!stageKey) {
    return null;
  }

  return stageKey
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

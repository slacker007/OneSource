"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useMemo, useState } from "react";

import type {
  AdminAuditEventSummary,
  AdminAuditSettingsSnapshot,
} from "@/modules/admin/admin.types";
import {
  formatEnumLabel,
  formatUtcTimestamp,
} from "@/components/admin/admin-shared";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PAGE_HEADER_SURFACE_SX } from "@/components/ui/page-header";
import { Surface } from "@/components/ui/surface";
import { onesourceTokens } from "@/theme/onesource-theme";

type AdminAuditSettingsProps = {
  snapshot: AdminAuditSettingsSnapshot | null;
};

export function AdminAuditSettings({ snapshot }: AdminAuditSettingsProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const selectedEvent =
    snapshot?.recentAuditEvents.find((event) => event.id === selectedEventId) ??
    null;

  const auditGridColumns = useMemo<GridColDef<AdminAuditEventSummary>[]>(
    () => [
      {
        field: "actionLabel",
        flex: 1.55,
        headerName: "Action",
        minWidth: 340,
        renderCell: ({ row }) => (
          <Stack spacing={0.65} sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.9rem",
                fontWeight: 750,
                lineHeight: 1.25,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.actionLabel}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.76rem",
                fontWeight: 700,
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.action}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                fontSize: "0.84rem",
                lineHeight: 1.5,
                overflow: "hidden",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
              }}
            >
              {row.summary ?? "No audit summary was recorded."}
            </Typography>
          </Stack>
        ),
        sortable: false,
      },
      {
        field: "actorLabel",
        flex: 0.65,
        headerName: "Actor",
        minWidth: 190,
        renderCell: ({ row }) => (
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "0.87rem", fontWeight: 650 }}>
              {row.actorLabel}
            </Typography>
            <Typography color="text.secondary" variant="caption">
              {formatEnumLabel(row.actorType)}
            </Typography>
          </Stack>
        ),
        sortable: false,
      },
      {
        field: "targetLabel",
        flex: 0.85,
        headerName: "Target",
        minWidth: 260,
        renderCell: ({ row }) => (
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.87rem",
                fontWeight: 650,
                overflowWrap: "anywhere",
              }}
            >
              {row.targetLabel}
            </Typography>
            <Typography color="text.secondary" variant="caption">
              {formatEnumLabel(row.targetType)}
            </Typography>
          </Stack>
        ),
        sortable: false,
      },
      {
        field: "occurredAt",
        flex: 0.7,
        headerName: "Occurred",
        minWidth: 215,
        renderCell: ({ row }) => (
          <Typography sx={{ fontSize: "0.86rem", fontWeight: 650 }}>
            {formatUtcTimestamp(row.occurredAt)}
          </Typography>
        ),
        sortable: false,
      },
      {
        field: "metadataJson",
        headerName: "Metadata",
        minWidth: 130,
        renderCell: ({ row }) =>
          (row.metadataJson ?? row.metadataPreview) ? (
            <Tooltip title="View metadata">
              <IconButton
                aria-label={`View metadata for ${row.actionLabel}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedEventId(row.id);
                }}
                size="small"
                sx={{
                  border: `1px solid ${onesourceTokens.color.border.subtle}`,
                  borderRadius: `${onesourceTokens.radius.button}px`,
                  color: onesourceTokens.color.text.primary,
                  height: 38,
                  width: 38,
                  "&:hover": {
                    bgcolor: onesourceTokens.color.surface.muted,
                    borderColor: onesourceTokens.color.border.strong,
                  },
                }}
              >
                <VisibilityRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Typography color="text.secondary" variant="caption">
              None
            </Typography>
          ),
        sortable: false,
        width: 130,
      },
    ],
    [],
  );

  if (!snapshot) {
    return (
      <Stack component="section" spacing={2}>
        <Surface sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h1"
            sx={{ fontSize: { xs: "2rem", sm: "2.35rem" } }}
          >
            Audit settings are unavailable
          </Typography>
          <ErrorState
            className="mt-4"
            message="The audit workspace could not be loaded for this organization."
            title="Audit settings are unavailable"
          />
        </Surface>
      </Stack>
    );
  }

  return (
    <Stack component="section" spacing={3}>
      <Surface
        component="header"
        sx={{
          borderRadius: `${onesourceTokens.radius.button}px`,
          boxShadow: onesourceTokens.elevation.hero,
          ...PAGE_HEADER_SURFACE_SX,
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Badge>Settings</Badge>
            <Badge tone="muted">{snapshot.organizationName}</Badge>
            <Badge>Audit</Badge>
          </Stack>
          <Stack spacing={1.5}>
            <Typography variant="h1">Audit activity</Typography>
            <Typography color="text.secondary" sx={{ maxWidth: "62rem" }}>
              Inspect recent organization-scoped mutations without mixing audit
              review into connector, scoring, or user-management work.
            </Typography>
          </Stack>
        </Stack>
      </Surface>

      <Surface
        aria-labelledby="audit-activity-grid-heading"
        component="section"
        sx={{
          borderRadius: `${onesourceTokens.radius.button}px`,
          overflow: "hidden",
          p: 0,
        }}
      >
        <Box
          sx={{
            alignItems: { md: "center" },
            borderBottom: `1px solid ${onesourceTokens.color.border.subtle}`,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            justifyContent: "space-between",
            px: { xs: 2.5, sm: 3 },
            py: 2.5,
          }}
        >
          <Stack spacing={0.75}>
            <Typography
              id="audit-activity-grid-heading"
              sx={{
                color: onesourceTokens.color.text.muted,
                fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
                fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Audit activity
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {snapshot.totalAuditLogCount} total organization-scoped events
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "baseline",
            }}
          >
            <Typography
              sx={{
                fontSize: "1.5rem",
                fontWeight: 750,
                lineHeight: 1,
              }}
            >
              {snapshot.recentAuditEvents.length}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: "0.85rem", fontWeight: 600 }}
            >
              shown
            </Typography>
          </Stack>
        </Box>

        {snapshot.recentAuditEvents.length > 0 ? (
          <DataGrid
            aria-label="Audit activity"
            autoHeight
            columns={auditGridColumns}
            density="compact"
            disableColumnFilter
            disableColumnMenu
            disableDensitySelector
            disableRowSelectionOnClick
            getRowId={(row) => row.id}
            hideFooterSelectedRowCount
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 10,
                  page: 0,
                },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            pagination
            rowHeight={106}
            rows={snapshot.recentAuditEvents}
            sx={{
              border: 0,
              borderRadius: 0,
              minHeight: 360,
              "& .MuiDataGrid-cell": {
                alignItems: "center",
                display: "flex",
                py: 1,
              },
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                outline: "none",
              },
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: onesourceTokens.color.surface.muted,
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                color: onesourceTokens.color.text.muted,
                fontSize: "0.76rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              },
              "& .MuiDataGrid-footerContainer": {
                borderTopColor: onesourceTokens.color.border.subtle,
              },
              "& .MuiDataGrid-row": {
                cursor: "default",
              },
            }}
          />
        ) : (
          <Box sx={{ px: 3, py: 4 }}>
            <EmptyState
              message="Audit rows will appear here once write flows emit organization-scoped events."
              title="No audit events are available yet"
            />
          </Box>
        )}
      </Surface>

      <AuditMetadataDrawer
        event={selectedEvent}
        onClose={() => setSelectedEventId(null)}
      />
    </Stack>
  );
}

function AuditMetadataDrawer({
  event,
  onClose,
}: {
  event: AdminAuditEventSummary | null;
  onClose: () => void;
}) {
  const metadata = event?.metadataJson ?? event?.metadataPreview ?? null;

  return (
    <Drawer
      anchor="left"
      onClose={onClose}
      open={Boolean(event)}
      slotProps={{
        paper: {
          "aria-label": "Audit metadata",
          role: "dialog",
        },
      }}
      sx={{
        "& .MuiDrawer-paper": {
          bgcolor: onesourceTokens.color.surface.raised,
          borderRight: `1px solid ${onesourceTokens.color.border.subtle}`,
          maxWidth: "92vw",
          px: 3,
          py: 3,
          width: 520,
        },
      }}
    >
      {event ? (
        <Stack spacing={2.5}>
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
          >
            <Stack spacing={0.8}>
              <Typography
                sx={{
                  color: onesourceTokens.color.text.muted,
                  fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
                  fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                Audit metadata
              </Typography>
              <Typography variant="h2">{event.actionLabel}</Typography>
            </Stack>
            <IconButton aria-label="Close audit metadata" onClick={onClose}>
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Surface
            density="compact"
            tone="muted"
            sx={{ boxShadow: "none", p: 2 }}
          >
            <Stack spacing={1}>
              <MetadataLine label="Actor" value={event.actorLabel} />
              <MetadataLine label="Target" value={event.targetLabel} />
              <MetadataLine
                label="Occurred"
                value={formatUtcTimestamp(event.occurredAt)}
              />
              <MetadataLine label="Action key" value={event.action} />
            </Stack>
          </Surface>

          <Box
            sx={{
              bgcolor: onesourceTokens.color.surface.muted,
              border: `1px solid ${onesourceTokens.color.border.subtle}`,
              borderRadius: `${onesourceTokens.radius.button}px`,
              p: 2,
            }}
          >
            <Typography
              component="pre"
              sx={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "0.8rem",
                lineHeight: 1.65,
                m: 0,
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {metadata ?? "No metadata was recorded for this audit event."}
            </Typography>
          </Box>
        </Stack>
      ) : null}
    </Drawer>
  );
}

function MetadataLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      sx={{ justifyContent: "space-between" }}
    >
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.82rem",
          fontWeight: 650,
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

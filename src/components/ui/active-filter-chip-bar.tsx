import Link from "next/link";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type ActiveFilterChip = {
  href?: string;
  label: string;
  leadingVisual?: ReactNode;
};

export function ActiveFilterChipBar({
  chips,
  className,
  clearHref,
  emptyLabel = "No active filters",
}: {
  chips: ActiveFilterChip[];
  className?: string;
  clearHref?: string;
  emptyLabel?: string;
}) {
  return (
    <Stack
      className={cn("gap-2", className)}
      direction="row"
      sx={{ alignItems: "center", flexWrap: "wrap" }}
    >
      {chips.length > 0 ? (
        <>
          {chips.map((chip) =>
            chip.href ? (
              <Link
                aria-label={`Remove ${chip.label}`}
                className="inline-flex"
                href={chip.href}
                key={chip.label}
              >
                <Chip
                  clickable
                  component="span"
                  label={
                    <Box
                      sx={{
                        alignItems: "center",
                        display: "flex",
                        gap: 0.75,
                      }}
                    >
                      {chip.leadingVisual}
                      <span>{chip.label}</span>
                      <Typography
                        aria-hidden="true"
                        color="text.secondary"
                        component="span"
                        sx={{ fontSize: "0.92rem" }}
                      >
                        ×
                      </Typography>
                    </Box>
                  }
                  sx={{
                    "& .MuiChip-label": {
                      px: 1.25,
                      py: 0.75,
                    },
                    backgroundColor: alpha("#122128", 0.04),
                    borderColor: "divider",
                    borderStyle: "solid",
                    borderWidth: 1,
                    color: "text.primary",
                    cursor: "pointer",
                    height: "auto",
                  }}
                  variant="outlined"
                />
              </Link>
            ) : (
              <Chip
                component="span"
                key={chip.label}
                label={
                  <Box
                    sx={{
                      alignItems: "center",
                      display: "flex",
                      gap: 0.75,
                    }}
                  >
                    {chip.leadingVisual}
                    <span>{chip.label}</span>
                  </Box>
                }
                sx={{
                  "& .MuiChip-label": {
                    px: 1.25,
                    py: 0.75,
                  },
                  backgroundColor: alpha("#122128", 0.04),
                  borderColor: "divider",
                  borderStyle: "solid",
                  borderWidth: 1,
                  color: "text.primary",
                  height: "auto",
                }}
                variant="outlined"
              />
            ),
          )}

          {clearHref ? (
              <Link
              className="inline-flex"
              href={clearHref}
            >
              <Typography
                color="primary"
                sx={{
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  px: 0.5,
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Clear all
              </Typography>
            </Link>
          ) : null}
        </>
      ) : (
        <Typography color="text.secondary" variant="body2">
          {emptyLabel}
        </Typography>
      )}
    </Stack>
  );
}

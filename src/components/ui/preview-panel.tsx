import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/cn";

export type PreviewPanelMetadataItem = {
  label: string;
  value: ReactNode;
};

export function PreviewPanel({
  actions,
  children,
  className,
  description,
  eyebrow,
  label,
  metadata = [],
  title,
}: {
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  label?: string;
  metadata?: PreviewPanelMetadataItem[];
  title: ReactNode;
}) {
  return (
    <Surface
      aria-label={label}
      className={cn(
        "h-full",
        className,
      )}
      component="aside"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
        px: { sm: 3, xs: 2.5 },
        py: 2.5,
      }}
    >
      <Stack spacing={1.5}>
        {eyebrow ? (
          <Typography
            color="text.secondary"
            sx={{ letterSpacing: "0.2em" }}
            variant="overline"
          >
            {eyebrow}
          </Typography>
        ) : null}
        <Stack spacing={1}>
          <Typography component="h2" variant="h2">
            {title}
          </Typography>
          {description ? (
            <Box color="text.secondary" sx={{ fontSize: "0.95rem", lineHeight: 1.75 }}>
              {description}
            </Box>
          ) : null}
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

      {actions ? (
        <Stack direction="row" sx={{ columnGap: 1.5, flexWrap: "wrap", rowGap: 1.5 }}>
          {actions}
        </Stack>
      ) : null}

      {children ? <Stack spacing={2}>{children}</Stack> : null}
    </Surface>
  );
}

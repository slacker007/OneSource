import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import { cn } from "@/lib/cn";
import { onesourceTokens } from "@/theme/onesource-theme";

export type DensityToggleOption = {
  active?: boolean;
  href: string;
  label: string;
};

export function DensityToggle({
  className,
  label = "Density",
  options,
}: {
  className?: string;
  label?: string;
  options: DensityToggleOption[];
}) {
  return (
    <Stack
      className={cn("flex items-center gap-3", className)}
      direction="row"
      sx={{ alignItems: "center", columnGap: 1.5 }}
    >
      <Typography
        color="text.secondary"
        sx={{ fontWeight: 600, letterSpacing: "0.18em" }}
        variant="overline"
      >
        {label}
      </Typography>
      <Box
        sx={{
          alignItems: "center",
          backgroundColor: alpha("#122128", 0.04),
          border: "1px solid",
          borderColor: "divider",
          borderRadius: `${onesourceTokens.radius.button}px`,
          display: "inline-flex",
          gap: 0.5,
          p: 0.5,
        }}
      >
        {options.map((option) => (
          <Link
            aria-current={option.active ? "page" : undefined}
            className="inline-flex"
            href={option.href}
            key={option.label}
          >
            <Box
              component="span"
              sx={{
                alignItems: "center",
                borderRadius: `${onesourceTokens.radius.button}px`,
                boxShadow: option.active
                  ? "0 8px 18px rgba(18, 33, 40, 0.08)"
                  : "none",
                color: option.active ? "text.primary" : "text.secondary",
                display: "inline-flex",
                fontSize: "0.92rem",
                fontWeight: 600,
                minHeight: 32,
                px: 1.5,
                transition: "background-color 160ms ease, color 160ms ease",
                ...(option.active
                  ? {
                      backgroundColor: "background.paper",
                    }
                  : {
                      "&:hover": {
                        color: "text.primary",
                      },
                    }),
              }}
            >
              {option.label}
            </Box>
          </Link>
        ))}
      </Box>
    </Stack>
  );
}

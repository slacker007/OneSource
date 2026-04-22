import Chip, { type ChipProps } from "@mui/material/Chip";
import type { ReactNode } from "react";

import { onesourceTokens } from "@/theme/onesource-theme";

type BadgeProps = {
  children: ReactNode;
  className?: string;
  tone?: "accent" | "danger" | "info" | "muted" | "success" | "warning";
} & Omit<ChipProps, "children" | "color" | "label" | "size" | "variant">;

export function Badge({
  children,
  className,
  tone = "accent",
  ...props
}: BadgeProps) {
  return (
    <Chip
      className={className}
      component="span"
      label={children}
      size="small"
      sx={{
        bgcolor:
          tone === "accent"
            ? onesourceTokens.color.accent.soft
            : tone === "danger"
              ? onesourceTokens.color.status.danger.soft
              : tone === "info"
                ? onesourceTokens.color.status.info.soft
                : tone === "success"
                  ? onesourceTokens.color.status.success.soft
                  : tone === "warning"
                    ? onesourceTokens.color.status.warning.soft
                    : onesourceTokens.color.surface.muted,
        borderColor:
          tone === "muted"
            ? onesourceTokens.color.border.subtle
            : "transparent",
        borderRadius: onesourceTokens.radius.pill,
        borderStyle: "solid",
        borderWidth: 1,
        color:
          tone === "accent"
            ? onesourceTokens.color.accent.dark
            : tone === "danger"
              ? onesourceTokens.color.status.danger.main
              : tone === "info"
                ? onesourceTokens.color.status.info.main
                : tone === "success"
                  ? onesourceTokens.color.status.success.main
                  : tone === "warning"
                    ? onesourceTokens.color.status.warning.main
                    : onesourceTokens.color.text.primary,
        fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
        fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
        height: "auto",
        letterSpacing: "0.16em",
        py: 0.25,
        textTransform: "uppercase",
        "& .MuiChip-label": {
          px: 1.25,
          py: 0.5,
        },
      }}
      variant="filled"
      {...props}
    />
  );
}

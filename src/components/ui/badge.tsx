import Chip, { type ChipProps } from "@mui/material/Chip";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";

const toneSx = {
  accent: {
    bgcolor: alpha("#1e5d66", 0.12),
    color: "#133b42",
  },
  danger: {
    bgcolor: alpha("#9b4138", 0.12),
    color: "#9b4138",
  },
  info: {
    bgcolor: alpha("#295b78", 0.12),
    color: "#295b78",
  },
  muted: {
    bgcolor: alpha("#122128", 0.04),
    borderColor: "divider",
    color: "#122128",
  },
  success: {
    bgcolor: alpha("#1f6a4e", 0.12),
    color: "#1f6a4e",
  },
  warning: {
    bgcolor: alpha("#9c5f23", 0.13),
    color: "#9c5f23",
  },
} as const;

type BadgeProps = {
  children: ReactNode;
  className?: string;
  tone?: keyof typeof toneSx;
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
        borderRadius: 999,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "transparent",
        fontSize: "0.68rem",
        fontWeight: 700,
        letterSpacing: "0.16em",
        height: "auto",
        py: 0.25,
        textTransform: "uppercase",
        "& .MuiChip-label": {
          px: 1.25,
          py: 0.5,
        },
        ...toneSx[tone],
      }}
      variant="filled"
      {...props}
    />
  );
}

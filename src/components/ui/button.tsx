import MuiButton, { type ButtonProps as MuiButtonProps } from "@mui/material/Button";
import { alpha, type SxProps, type Theme } from "@mui/material/styles";
import Link from "next/link";
import type { ReactNode } from "react";

export type ButtonTone = "primary" | "neutral" | "danger";
export type ButtonVariant = "solid" | "outlined" | "soft" | "text";
export type ButtonDensity = "comfortable" | "compact";

type ButtonProps = Omit<MuiButtonProps, "color" | "size" | "variant"> & {
  children: ReactNode;
  density?: ButtonDensity;
  href?: string;
  tone?: ButtonTone;
  variant?: ButtonVariant;
};

const densitySx = {
  comfortable: {
    minHeight: 48,
    px: 2.25,
    py: 1.25,
  },
  compact: {
    minHeight: 40,
    px: 1.75,
    py: 0.875,
  },
} as const;

export function Button({
  children,
  density = "comfortable",
  href,
  sx,
  tone = "primary",
  variant = "solid",
  ...props
}: ButtonProps) {
  const muiVariant =
    variant === "solid"
      ? "contained"
      : variant === "outlined"
        ? "outlined"
        : "text";
  const resolvedSx: SxProps<Theme>[] = [
    {
      borderRadius: 999,
      boxShadow: "none",
      fontSize: "0.94rem",
      fontWeight: 600,
      lineHeight: 1.2,
      textTransform: "none",
    },
    densitySx[density],
  ];

  if (tone === "neutral" && variant === "solid") {
    resolvedSx.push({
      bgcolor: "background.paper",
      border: (theme) => `1px solid ${theme.palette.divider}`,
      color: "text.primary",
      "&:hover": {
        bgcolor: alpha("#ffffff", 0.92),
      },
    });
  }

  if (tone === "neutral" && variant === "outlined") {
    resolvedSx.push({
      borderColor: "divider",
      color: "text.primary",
      "&:hover": {
        borderColor: "text.secondary",
        bgcolor: alpha("#122128", 0.035),
      },
    });
  }

  if (tone === "neutral" && variant === "soft") {
    resolvedSx.push({
      bgcolor: alpha("#122128", 0.06),
      color: "text.primary",
      "&:hover": {
        bgcolor: alpha("#122128", 0.1),
      },
    });
  }

  if (tone === "primary" && variant === "soft") {
    resolvedSx.push({
      bgcolor: alpha("#1e5d66", 0.12),
      color: "primary.dark",
      "&:hover": {
        bgcolor: alpha("#1e5d66", 0.18),
      },
    });
  }

  if (tone === "danger" && variant === "soft") {
    resolvedSx.push({
      bgcolor: alpha("#9b4138", 0.12),
      color: "error.main",
      "&:hover": {
        bgcolor: alpha("#9b4138", 0.18),
      },
    });
  }

  if (variant === "text") {
    resolvedSx.push({
      px: density === "compact" ? 1 : 1.25,
    });
  }

  if (variant === "solid" && tone !== "neutral") {
    resolvedSx.push({
      "&:hover": {
        boxShadow: "none",
      },
    });
  }

  if (sx) {
    resolvedSx.push(sx);
  }

  const sharedProps = {
    color: tone === "danger" ? "error" : "primary",
    sx: resolvedSx as SxProps<Theme>,
    variant: muiVariant,
    ...props,
  } as const;

  if (href) {
    return (
      <MuiButton component={Link} href={href} {...sharedProps}>
        {children}
      </MuiButton>
    );
  }

  return (
    <MuiButton
      {...sharedProps}
    >
      {children}
    </MuiButton>
  );
}

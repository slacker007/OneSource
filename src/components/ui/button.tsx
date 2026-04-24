"use client";

import MuiButton, {
  type ButtonProps as MuiButtonProps,
} from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";
import Link from "next/link";
import type { ReactNode } from "react";

import { onesourceTokens } from "@/theme/onesource-theme";

export type ButtonTone = "primary" | "neutral" | "danger";
export type ButtonVariant = "solid" | "outlined" | "soft" | "text";
export type ButtonDensity = "comfortable" | "compact";

type ButtonProps = Omit<MuiButtonProps, "color" | "size" | "variant"> & {
  children: ReactNode;
  density?: ButtonDensity;
  href?: string;
  rel?: string;
  target?: string;
  tone?: ButtonTone;
  variant?: ButtonVariant;
};

export function Button({
  children,
  density = "comfortable",
  href,
  sx,
  style,
  tone = "primary",
  variant = "solid",
  ...props
}: ButtonProps) {
  let resolvedLinkColor: string | undefined;
  const muiVariant =
    variant === "solid"
      ? "contained"
      : variant === "outlined"
        ? "outlined"
        : "text";
  const resolvedSx: SxProps<Theme>[] = [
    {
      borderRadius: onesourceTokens.radius.button,
      boxShadow: "none",
      fontSize: onesourceTokens.typographyRole.button.fontSize,
      fontWeight: onesourceTokens.typographyRole.button.fontWeight,
      letterSpacing: onesourceTokens.typographyRole.button.letterSpacing,
      lineHeight: onesourceTokens.typographyRole.button.lineHeight,
      minHeight:
        density === "compact"
          ? onesourceTokens.sizing.buttonHeightCompact
          : onesourceTokens.sizing.buttonHeightComfortable,
      px:
        density === "compact"
          ? onesourceTokens.spacing.controlPaddingCompactX + 0.25
          : onesourceTokens.spacing.controlPaddingComfortableX + 0.5,
      py:
        density === "compact"
          ? onesourceTokens.spacing.controlPaddingCompactY - 0.25
          : onesourceTokens.spacing.controlPaddingComfortableY,
      textTransform: "none",
    },
  ];

  if (tone === "neutral" && variant === "solid") {
    resolvedLinkColor = onesourceTokens.color.text.primary;
    resolvedSx.push({
      bgcolor: onesourceTokens.color.surface.raised,
      border: `1px solid ${onesourceTokens.color.border.subtle}`,
      color: onesourceTokens.color.text.primary,
      "&:hover": {
        bgcolor: onesourceTokens.color.neutral[0],
      },
    });
  }

  if (tone === "neutral" && variant === "outlined") {
    resolvedLinkColor = onesourceTokens.color.text.primary;
    resolvedSx.push({
      borderColor: onesourceTokens.color.border.subtle,
      color: onesourceTokens.color.text.primary,
      "&:hover": {
        bgcolor: onesourceTokens.interaction.hoverOverlay,
        borderColor: onesourceTokens.color.border.strong,
      },
    });
  }

  if (tone === "neutral" && variant === "soft") {
    resolvedLinkColor = onesourceTokens.color.text.primary;
    resolvedSx.push({
      bgcolor: onesourceTokens.color.surface.muted,
      color: onesourceTokens.color.text.primary,
      "&:hover": {
        bgcolor: onesourceTokens.interaction.pressedOverlay,
      },
    });
  }

  if (tone === "primary" && variant === "soft") {
    resolvedLinkColor = onesourceTokens.color.accent.dark;
    resolvedSx.push({
      bgcolor: onesourceTokens.color.accent.soft,
      color: onesourceTokens.color.accent.dark,
      "&:hover": {
        bgcolor: onesourceTokens.interaction.selectedOverlay,
      },
    });
  }

  if (tone === "primary" && variant === "solid") {
    resolvedLinkColor = onesourceTokens.color.text.inverse;
    resolvedSx.push({
      bgcolor: onesourceTokens.color.accent.main,
      color: onesourceTokens.color.text.inverse,
      "&:hover": {
        bgcolor: onesourceTokens.color.accent.dark,
      },
    });
  }

  if (tone === "danger" && variant === "solid") {
    resolvedLinkColor = onesourceTokens.color.text.inverse;
    resolvedSx.push({
      bgcolor: onesourceTokens.color.status.danger.main,
      color: onesourceTokens.color.text.inverse,
      "&:hover": {
        bgcolor: "#7f312b",
      },
    });
  }

  if (tone === "danger" && variant === "soft") {
    resolvedLinkColor = onesourceTokens.color.status.danger.main;
    resolvedSx.push({
      bgcolor: onesourceTokens.color.status.danger.soft,
      color: onesourceTokens.color.status.danger.main,
      "&:hover": {
        bgcolor: "rgba(155, 65, 56, 0.18)",
      },
    });
  }

  if (variant === "text") {
    resolvedSx.push({
      px: density === "compact" ? 1 : 1.25,
    });
  }

  if (href && resolvedLinkColor) {
    resolvedSx.push({
      "&, &:link, &:visited": {
        color: resolvedLinkColor,
        textDecoration: "none",
      },
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
    style:
      href && resolvedLinkColor
        ? {
            ...style,
            WebkitTextFillColor: resolvedLinkColor,
            color: resolvedLinkColor,
          }
        : style,
    ...props,
  } as const;

  if (href) {
    return (
      <MuiButton component={Link} href={href} {...sharedProps}>
        {children}
      </MuiButton>
    );
  }

  return <MuiButton {...sharedProps}>{children}</MuiButton>;
}

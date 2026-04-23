"use client";

import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId, type ReactNode } from "react";

import { onesourceTokens } from "@/theme/onesource-theme";

type DrawerProps = {
  anchor?: "left" | "right";
  children: ReactNode;
  description?: string;
  eyebrow?: string;
  hideAbove?: "lg" | "xl";
  onClose: () => void;
  open: boolean;
  title: string;
  width?: number;
};

export function Drawer({
  anchor = "right",
  children,
  description,
  eyebrow,
  hideAbove = "lg",
  onClose,
  open,
  title,
  width = 320,
}: DrawerProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <MuiDrawer
      anchor={anchor}
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          "aria-describedby": description ? descriptionId : undefined,
          "aria-labelledby": titleId,
        },
      }}
      sx={{
        display: {
          [hideAbove]: "none",
        },
        "& .MuiDrawer-paper": {
          bgcolor: onesourceTokens.shell.background,
          borderLeft:
            anchor === "right"
              ? `1px solid ${onesourceTokens.shell.panelBorder}`
              : undefined,
          borderRight:
            anchor === "left"
              ? `1px solid ${onesourceTokens.shell.panelBorder}`
              : undefined,
          color: onesourceTokens.shell.textPrimary,
          maxWidth: "84vw",
          px: 2.5,
          py: 2.5,
          width,
        },
      }}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            alignItems: "flex-start",
            display: "flex",
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <div>
            {eyebrow ? (
              <Typography
                sx={{
                  color: onesourceTokens.shell.textFaint,
                  fontSize: "0.78rem",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                }}
              >
                {eyebrow}
              </Typography>
            ) : null}
            <Typography
              id={titleId}
              sx={{
                fontFamily: "var(--font-heading), sans-serif",
                fontSize: "1.65rem",
                fontWeight: 600,
                mt: eyebrow ? 1 : 0,
              }}
            >
              {title}
            </Typography>
          </div>
          <IconButton
            aria-label={`Dismiss ${title}`}
            onClick={onClose}
            sx={{
              color: "inherit",
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {description ? (
          <Typography
            id={descriptionId}
            sx={{
              color: onesourceTokens.shell.textSecondary,
              fontSize: "0.94rem",
              lineHeight: 1.6,
            }}
          >
            {description}
          </Typography>
        ) : null}

        {children}
      </Stack>
    </MuiDrawer>
  );
}

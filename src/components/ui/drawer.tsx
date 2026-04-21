"use client";

import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useId, type ReactNode } from "react";

type DrawerProps = {
  children: ReactNode;
  description?: string;
  eyebrow?: string;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function Drawer({
  children,
  description,
  eyebrow,
  onClose,
  open,
  title,
}: DrawerProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <MuiDrawer
      anchor="right"
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
          lg: "none",
        },
        "& .MuiDrawer-paper": {
          bgcolor: "rgba(15,28,31,0.98)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
          color: "#f5f5f4",
          maxWidth: "84vw",
          px: 2.5,
          py: 2.5,
          width: 320,
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
                  color: "rgba(255,255,255,0.64)",
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
            sx={{ color: "rgba(245,245,244,0.76)", fontSize: "0.94rem", lineHeight: 1.6 }}
          >
            {description}
          </Typography>
        ) : null}

        {children}
      </Stack>
    </MuiDrawer>
  );
}

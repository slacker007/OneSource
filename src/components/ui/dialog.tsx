"use client";

import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Portal from "@mui/material/Portal";
import Typography from "@mui/material/Typography";
import { useId, type ReactNode } from "react";

import { Surface } from "@/components/ui/surface";

type DialogProps = {
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function Dialog({
  children,
  description,
  footer,
  onClose,
  open,
  title,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  if (!open) {
    return null;
  }

  return (
    <Portal>
      <Box
        sx={{
          inset: 0,
          position: "fixed",
          px: 2,
          py: 3,
          zIndex: 1300,
        }}
      >
        <Box
          aria-label={`Close ${title}`}
          component="button"
          onClick={onClose}
          sx={{
            bgcolor: "rgba(15,28,31,0.5)",
            border: 0,
            cursor: "pointer",
            inset: 0,
            position: "absolute",
          }}
          type="button"
        />
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            inset: 0,
            justifyContent: "center",
            pointerEvents: "none",
            position: "absolute",
            px: 2,
            py: 3,
          }}
        >
          <Surface
            aria-modal="true"
            aria-describedby={description ? descriptionId : undefined}
            aria-labelledby={titleId}
            role="dialog"
            sx={{
              bgcolor: "rgba(255,249,239,0.98)",
              maxWidth: 720,
              p: 3,
              pointerEvents: "auto",
              width: "100%",
            }}
          >
            <Box
              sx={{
                alignItems: "flex-start",
                display: "flex",
                gap: 2,
                justifyContent: "space-between",
              }}
            >
              <div>
                <Typography
                  component="h2"
                  id={titleId}
                  sx={{
                    fontFamily: "var(--font-heading), sans-serif",
                    fontSize: "1.9rem",
                    fontWeight: 600,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {title}
                </Typography>
                {description ? (
                  <Typography
                    id={descriptionId}
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.94rem",
                      lineHeight: 1.6,
                      mt: 1,
                    }}
                  >
                    {description}
                  </Typography>
                ) : null}
              </div>
              <IconButton aria-label={`Dismiss ${title}`} onClick={onClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ mt: 3 }}>{children}</Box>

            {footer ? (
              <Box
                sx={{
                  borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                  mt: 3,
                  pt: 2,
                }}
              >
                {footer}
              </Box>
            ) : null}
          </Surface>
        </Box>
      </Box>
    </Portal>
  );
}

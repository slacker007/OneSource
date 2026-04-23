"use client";

import { useEffect } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Surface } from "@/components/ui/surface";

type AppErrorBoundaryProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
  scopeLabel: string;
  title: string;
};

export function AppErrorBoundary({
  error,
  reset,
  scopeLabel,
  title,
}: AppErrorBoundaryProps) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        service: "web",
        level: "error",
        message: `${scopeLabel} error boundary captured an exception.`,
        detail: {
          digest: error.digest ?? null,
          message: error.message,
          name: error.name,
        },
      }),
    );
  }, [error, scopeLabel]);

  return (
    <Box
      component="main"
      sx={{
        alignItems: "center",
        background:
          "radial-gradient(circle at top, rgba(209,229,220,0.72), rgba(250,247,242,0.95) 55%)",
        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
        px: 3,
        py: 8,
      }}
    >
      <Surface
        sx={{
          maxWidth: "40rem",
          px: { xs: 3, sm: 4 },
          py: 4,
          width: "100%",
        }}
      >
        <Typography
          sx={{
            color: "text.secondary",
            fontSize: "0.72rem",
            letterSpacing: "0.24em",
            textTransform: "uppercase",
          }}
        >
          {scopeLabel}
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontFamily: "var(--font-heading), sans-serif",
            fontSize: { xs: "2rem", sm: "2.25rem" },
            fontWeight: 600,
            letterSpacing: "-0.04em",
            mt: 1.5,
          }}
        >
          {title}
        </Typography>
        <Box sx={{ mt: 3 }}>
          <ErrorState
            action={
              <Button
                onClick={() => reset()}
                tone="primary"
                variant="solid"
              >
                Retry route
              </Button>
            }
            message="OneSource caught the failure in a route-level error boundary. Reset the view to retry this route, or return to the previous page if the problem persists."
            title="The current page could not finish rendering"
          />
        </Box>
        <Stack direction="row" spacing={0.75} sx={{ mt: 2 }}>
          <Typography sx={{ color: "text.secondary", fontSize: "0.78rem" }}>
            Error digest:
          </Typography>
          <Typography
            component="span"
            sx={{
              color: "text.secondary",
              fontFamily: "monospace",
              fontSize: "0.78rem",
            }}
          >
            {error.digest ?? "n/a"}
          </Typography>
        </Stack>
      </Surface>
    </Box>
  );
}

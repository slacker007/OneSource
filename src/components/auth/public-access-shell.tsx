import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";

type PublicAccessShellProps = {
  children: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  maxWidth?: number | string;
  surfaceSx?: SxProps<Theme>;
  title?: ReactNode;
};

export function PublicAccessShell({
  children,
  description,
  eyebrow,
  maxWidth = 520,
  surfaceSx,
  title,
}: PublicAccessShellProps) {
  return (
    <Box
      component="main"
      sx={{
        alignItems: "center",
        background:
          "radial-gradient(circle at top, rgba(244,232,214,0.32), transparent 34%), linear-gradient(135deg, rgba(17,44,47,0.99) 0%, rgba(31,72,70,0.96) 54%, rgba(244,232,214,0.94) 100%)",
        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
        px: { sm: 3, xs: 2 },
        py: { sm: 8, xs: 6 },
      }}
    >
      <Surface
        component="section"
        sx={[
          {
            backdropFilter: "blur(18px)",
            bgcolor: "rgba(252,249,244,0.96)",
            borderRadius: 4,
            boxShadow: "0 28px 80px rgba(14,32,35,0.28)",
            mx: "auto",
            p: { sm: 4.5, xs: 3 },
            width: "100%",
            maxWidth,
          },
          ...(surfaceSx ? [surfaceSx] : []),
        ] as SxProps<Theme>}
      >
        <Stack spacing={{ sm: 3.5, xs: 3 }}>
          {eyebrow || title || description ? (
            <Stack spacing={1.5}>
              {eyebrow ? (
                <Typography
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.82rem",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                  }}
                >
                  {eyebrow}
                </Typography>
              ) : null}
              {title ? (
                <Typography
                  component="h1"
                  sx={{
                    fontFamily: "var(--font-heading), sans-serif",
                    fontSize: {
                      sm: "2.6rem",
                      xs: "2.2rem",
                    },
                    fontWeight: 600,
                    letterSpacing: "-0.04em",
                    lineHeight: 1.02,
                    maxWidth: "14ch",
                  }}
                >
                  {title}
                </Typography>
              ) : null}
              {description ? (
                <Box
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.94rem",
                    lineHeight: 1.7,
                    maxWidth: "58ch",
                  }}
                >
                  {description}
                </Box>
              ) : null}
            </Stack>
          ) : null}

          {children}
        </Stack>
      </Surface>
    </Box>
  );
}

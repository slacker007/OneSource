import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ElementType, ReactNode } from "react";

import { Surface } from "@/components/ui/surface";

export type StatePanelTone =
  | "neutral"
  | "info"
  | "error"
  | "loading"
  | "success"
  | "warning";

type StatePanelProps = {
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  component?: ElementType;
  eyebrow: string;
  icon?: ReactNode;
  message?: ReactNode;
  role?: string;
  sx?: SxProps<Theme>;
  title: ReactNode;
  titleComponent?: ElementType;
  tone?: StatePanelTone;
};

function getToneStyles(tone: StatePanelTone) {
  switch (tone) {
    case "error":
      return {
        bgcolor: "rgba(211, 47, 47, 0.04)",
        borderColor: "rgba(211, 47, 47, 0.2)",
        color: "rgb(198, 40, 40)",
      };
    case "info":
      return {
        bgcolor: "rgba(2, 136, 209, 0.04)",
        borderColor: "rgba(2, 136, 209, 0.18)",
        color: "rgb(2, 136, 209)",
      };
    case "loading":
      return {
        bgcolor: "rgba(30, 93, 102, 0.035)",
        borderColor: "rgba(30, 93, 102, 0.14)",
        color: "rgb(30, 93, 102)",
      };
    case "success":
      return {
        bgcolor: "rgba(46, 125, 50, 0.05)",
        borderColor: "rgba(46, 125, 50, 0.18)",
        color: "rgb(46, 125, 50)",
      };
    case "warning":
      return {
        bgcolor: "rgba(237, 108, 2, 0.07)",
        borderColor: "rgba(237, 108, 2, 0.2)",
        color: "rgb(173, 85, 0)",
      };
    case "neutral":
    default:
      return {
        bgcolor: "background.paper",
        borderColor: "divider",
        color: "text.primary",
      };
  }
}

export function StatePanel({
  action,
  children,
  className,
  component = "section",
  eyebrow,
  icon,
  message,
  role,
  sx,
  title,
  titleComponent = "h2",
  tone = "neutral",
}: StatePanelProps) {
  return (
    <Surface
      className={className}
      component={component}
      role={role}
      sx={[
        {
          p: 2.5,
        },
        getToneStyles(tone),
        ...(sx ? [sx] : []),
      ] as SxProps<Theme>}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            alignItems: "flex-start",
            display: "flex",
            flexDirection: {
              sm: "row",
              xs: "column",
            },
            gap: 2,
          }}
        >
          {icon ? (
            <Avatar
              sx={{
                bgcolor: "currentColor",
                color: "background.paper",
                height: 40,
                width: 40,
              }}
              variant="rounded"
            >
              {icon}
            </Avatar>
          ) : null}

          <Stack spacing={1.1}>
            <Typography
              sx={{
                color: tone === "neutral" ? "text.secondary" : "inherit",
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {eyebrow}
            </Typography>
            <Typography
              component={titleComponent}
              sx={{
                color: tone === "neutral" ? "text.primary" : "inherit",
                fontFamily: "var(--font-heading), sans-serif",
                fontSize: "1.28rem",
                fontWeight: 600,
                letterSpacing: "-0.03em",
              }}
            >
              {title}
            </Typography>
            {message ? (
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: "0.94rem",
                  lineHeight: 1.6,
                  maxWidth: "62ch",
                }}
              >
                {message}
              </Typography>
            ) : null}
          </Stack>
        </Box>

        {children}
        {action ? <div>{action}</div> : null}
      </Stack>
    </Surface>
  );
}

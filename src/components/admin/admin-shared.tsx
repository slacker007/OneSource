import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { onesourceTokens } from "@/theme/onesource-theme";

export function SectionJumpLink({
  children,
  href,
}: {
  children: string;
  href: string;
}) {
  return (
    <Button
      density="compact"
      href={href}
      sx={{ minHeight: 36 }}
      tone="neutral"
      variant="soft"
    >
      {children}
    </Button>
  );
}

export function SummaryCard({
  label,
  value,
  supportingText,
}: {
  label: string;
  value: string;
  supportingText: string;
}) {
  return (
    <Surface density="compact" sx={{ p: 2.5 }}>
      <Typography
        sx={{
          color: onesourceTokens.color.text.muted,
          fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
          fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ mt: 1.5 }} variant="h6">
        {value}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
        {supportingText}
      </Typography>
    </Surface>
  );
}

export function MetricPair({ label, value }: { label: string; value: string }) {
  return (
    <Surface density="compact" sx={{ px: 1.5, py: 1.5 }} tone="muted">
      <Typography
        sx={{
          color: onesourceTokens.color.text.muted,
          fontSize: "11px",
          fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ mt: 1 }} variant="body2">
        {value}
      </Typography>
    </Surface>
  );
}

export function ProfileBadgeGroup({
  badges,
  emptyLabel,
  title,
}: {
  badges: string[];
  emptyLabel: string;
  title: string;
}) {
  return (
    <Surface density="compact" sx={{ p: 2.5 }}>
      <Typography
        sx={{
          color: onesourceTokens.color.text.muted,
          fontSize: onesourceTokens.typographyRole.eyebrow.fontSize,
          fontWeight: onesourceTokens.typographyRole.eyebrow.fontWeight,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 1.5 }}>
        {badges.length > 0 ? (
          badges.map((badge) => (
            <Badge key={`${title}-${badge}`} tone="muted">
              {badge}
            </Badge>
          ))
        ) : (
          <Badge tone="warning">{emptyLabel}</Badge>
        )}
      </Stack>
    </Surface>
  );
}

export function mapFeedbackBannerTone(
  tone: "accent" | "warning" | "danger",
): "success" | "warning" | "danger" {
  switch (tone) {
    case "accent":
      return "success";
    case "warning":
      return "warning";
    case "danger":
      return "danger";
  }
}

export function getUserStatusTone(
  status: string,
): "accent" | "danger" | "muted" | "warning" {
  switch (status) {
    case "ACTIVE":
      return "accent";
    case "DISABLED":
      return "danger";
    case "INVITED":
      return "warning";
    default:
      return "muted";
  }
}

export function formatEnumLabel(value: string) {
  return value
    .split(/[_\s-]+/g)
    .filter(Boolean)
    .map(
      (segment) =>
        segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase(),
    )
    .join(" ");
}

export function formatUtcTimestamp(value: string) {
  return value.replace("T", " ").replace(".000Z", " UTC");
}

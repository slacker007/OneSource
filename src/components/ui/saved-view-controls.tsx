import Link from "next/link";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import { cn } from "@/lib/cn";

export type SavedViewControlItem = {
  active?: boolean;
  href: string;
  label: string;
  supportingText?: string;
};

export function SavedViewControls({
  className,
  items,
  label = "Views",
}: {
  className?: string;
  items: SavedViewControlItem[];
  label?: string;
}) {
  return (
    <Stack className={cn("space-y-2", className)} spacing={1.25}>
      <Typography
        color="text.secondary"
        sx={{ fontWeight: 600, letterSpacing: "0.18em" }}
        variant="overline"
      >
        {label}
      </Typography>
      <Stack direction="row" sx={{ columnGap: 1, flexWrap: "wrap", rowGap: 1 }}>
        {items.map((item) => (
          <Link
            aria-current={item.active ? "page" : undefined}
            className="inline-flex"
            href={item.href}
            key={item.label}
          >
            <Chip
              clickable
              component="span"
              label={
                <Box sx={{ alignItems: "center", columnGap: 0.75, display: "flex" }}>
                  <Typography
                    component="span"
                    sx={{ color: "inherit", fontSize: "0.92rem", fontWeight: 600 }}
                  >
                    {item.label}
                  </Typography>
                  {item.supportingText ? (
                    <Typography
                      color="text.secondary"
                      component="span"
                      sx={{ fontSize: "0.78rem" }}
                    >
                      {item.supportingText}
                    </Typography>
                  ) : null}
                </Box>
              }
              sx={{
                "& .MuiChip-label": {
                  px: 1.25,
                  py: 0.875,
                },
                backgroundColor: item.active
                  ? alpha("#1e5d66", 0.12)
                  : alpha("#122128", 0.04),
                borderColor: item.active ? "primary.main" : "divider",
                borderStyle: "solid",
                borderWidth: 1,
                color: item.active ? "text.primary" : "text.secondary",
                cursor: "pointer",
                height: "auto",
              }}
              variant="outlined"
            />
          </Link>
        ))}
      </Stack>
    </Stack>
  );
}

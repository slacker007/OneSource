import { render, screen } from "@testing-library/react";
import { useTheme } from "@mui/material/styles";
import { describe, expect, it } from "vitest";

import { AppThemeProvider } from "@/components/layout/app-theme-provider";

function ThemeProbe() {
  const theme = useTheme();

  return (
    <div
      data-testid="theme-probe"
      data-font={theme.typography.fontFamily}
      data-primary={theme.palette.primary.main}
      data-radius={theme.shape.borderRadius}
    />
  );
}

describe("AppThemeProvider", () => {
  it("provides the OneSource Material UI theme to descendants", () => {
    render(
      <AppThemeProvider>
        <ThemeProbe />
        <span>Theme child</span>
      </AppThemeProvider>,
    );

    expect(screen.getByText("Theme child")).toBeInTheDocument();
    expect(screen.getByTestId("theme-probe")).toHaveAttribute(
      "data-primary",
      "#1e5d66",
    );
    expect(screen.getByTestId("theme-probe")).toHaveAttribute(
      "data-radius",
      "14",
    );
    expect(screen.getByTestId("theme-probe")).toHaveAttribute(
      "data-font",
      expect.stringContaining("var(--font-body)"),
    );
  });
});

import { describe, expect, it } from "vitest";

import onesourceTheme from "@/theme/onesource-theme";

describe("onesourceTheme", () => {
  it("maps the OneSource brand colors into the Material UI palette", () => {
    expect(onesourceTheme.palette.primary.main).toBe("#2563eb");
    expect(onesourceTheme.palette.primary.dark).toBe("#1d4ed8");
    expect(onesourceTheme.palette.background.default).toBe("#f3f6f9");
    expect(onesourceTheme.palette.text.primary).toBe("#0f172a");
    expect(onesourceTheme.onesource.color.surface.raised).toBe(
      "rgba(255, 255, 255, 0.98)",
    );
  });

  it("preserves the intended typography and decision-complete token defaults", () => {
    expect(onesourceTheme.typography.fontFamily).toContain("var(--font-body)");
    expect(onesourceTheme.typography.h1?.fontFamily).toContain(
      "var(--font-heading)",
    );
    expect(onesourceTheme.shape.borderRadius).toBe(12);
    expect(onesourceTheme.onesource.radius.button).toBe(6);
    expect(onesourceTheme.onesource.radius.panel).toBe(18);
    expect(onesourceTheme.onesource.sizing.controlHeightComfortable).toBe(44);
    expect(onesourceTheme.onesource.sizing.railCollapsed).toBe(84);
    expect(onesourceTheme.onesource.sizing.railExpanded).toBe(256);
    expect(onesourceTheme.onesource.shell.background).toBe(
      "rgba(15, 23, 42, 0.98)",
    );
    expect(onesourceTheme.onesource.shell.textSecondary).toBe(
      "rgba(248, 250, 252, 0.92)",
    );
    expect(onesourceTheme.onesource.typographyRole.eyebrow.letterSpacing).toBe(
      "0.14em",
    );
    expect(
      onesourceTheme.components?.MuiButton?.defaultProps?.disableElevation,
    ).toBe(true);
    expect(
      (
        onesourceTheme.components?.MuiButton?.styleOverrides?.root as {
          borderRadius: number;
        }
      ).borderRadius,
    ).toBe(6);
    expect(
      (
        onesourceTheme.components?.MuiDataGrid?.styleOverrides?.root as {
          borderRadius: number;
        }
      ).borderRadius,
    ).toBe(12);
  });
});

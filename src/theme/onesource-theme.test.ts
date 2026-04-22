import { describe, expect, it } from "vitest";

import onesourceTheme from "@/theme/onesource-theme";

describe("onesourceTheme", () => {
  it("maps the OneSource brand colors into the Material UI palette", () => {
    expect(onesourceTheme.palette.primary.main).toBe("#1e5d66");
    expect(onesourceTheme.palette.primary.dark).toBe("#133b42");
    expect(onesourceTheme.palette.background.default).toBe("#ece9de");
    expect(onesourceTheme.palette.text.primary).toBe("#122128");
    expect(onesourceTheme.onesource.color.surface.raised).toBe(
      "rgba(255, 255, 255, 0.98)",
    );
  });

  it("preserves the intended typography and decision-complete token defaults", () => {
    expect(onesourceTheme.typography.fontFamily).toContain("var(--font-body)");
    expect(onesourceTheme.typography.h1?.fontFamily).toContain(
      "var(--font-heading)",
    );
    expect(onesourceTheme.shape.borderRadius).toBe(14);
    expect(onesourceTheme.onesource.radius.panel).toBe(20);
    expect(onesourceTheme.onesource.sizing.controlHeightComfortable).toBe(48);
    expect(onesourceTheme.onesource.sizing.railCollapsed).toBe(92);
    expect(onesourceTheme.onesource.shell.background).toBe(
      "rgba(15,28,31,0.98)",
    );
    expect(onesourceTheme.onesource.shell.textSecondary).toBe(
      "rgba(250,248,245,0.92)",
    );
    expect(onesourceTheme.onesource.typographyRole.eyebrow.letterSpacing).toBe(
      "0.18em",
    );
    expect(onesourceTheme.components?.MuiButton?.defaultProps?.disableElevation).toBe(
      true,
    );
  });
});

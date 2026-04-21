import { describe, expect, it } from "vitest";

import onesourceTheme from "@/theme/onesource-theme";

describe("onesourceTheme", () => {
  it("maps the OneSource brand colors into the Material UI palette", () => {
    expect(onesourceTheme.palette.primary.main).toBe("#1e5d66");
    expect(onesourceTheme.palette.primary.dark).toBe("#133b42");
    expect(onesourceTheme.palette.background.default).toBe("#ece9de");
    expect(onesourceTheme.palette.text.primary).toBe("#122128");
  });

  it("preserves the intended typography and component density defaults", () => {
    expect(onesourceTheme.typography.fontFamily).toContain("var(--font-body)");
    expect(onesourceTheme.typography.h1?.fontFamily).toContain(
      "var(--font-heading)",
    );
    expect(onesourceTheme.shape.borderRadius).toBe(14);
    expect(onesourceTheme.components?.MuiButton?.defaultProps?.disableElevation).toBe(
      true,
    );
  });
});

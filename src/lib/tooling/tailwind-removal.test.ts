import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

describe("Tailwind runtime removal", () => {
  it("removes Tailwind from the package manifest and PostCSS pipeline", () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(repoRoot, "package.json"), "utf8"),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const postcssConfig = readFileSync(
      path.join(repoRoot, "postcss.config.mjs"),
      "utf8",
    );

    expect(packageJson.dependencies?.tailwindcss).toBeUndefined();
    expect(packageJson.devDependencies?.tailwindcss).toBeUndefined();
    expect(
      packageJson.devDependencies?.["@tailwindcss/postcss"],
    ).toBeUndefined();
    expect(
      packageJson.devDependencies?.["prettier-plugin-tailwindcss"],
    ).toBeUndefined();
    expect(postcssConfig).not.toMatch(/tailwind/i);
  });

  it("loads the frozen compatibility stylesheet instead of the live Tailwind import", () => {
    const globalsCss = readFileSync(
      path.join(repoRoot, "src/app/globals.css"),
      "utf8",
    );
    const frozenCss = readFileSync(
      path.join(repoRoot, "src/app/tailwind-freeze.css"),
      "utf8",
    );

    expect(globalsCss).toContain('@import "./tailwind-freeze.css";');
    expect(globalsCss).not.toContain('@import "tailwindcss";');
    expect(globalsCss).not.toContain("@theme");
    expect(frozenCss).toContain(".space-y-2");
    expect(frozenCss).toContain(".text-muted");
    expect(frozenCss).toContain(":root");
    expect(frozenCss).toContain(".ui-state");
  });
});
